import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';

import { registerLiveActivityAction } from '@/core/actions/register-live-activity.action';
import { unregisterLiveActivityAction } from '@/core/actions/unregister-live-activity.action';
import type { Trip } from '@/infrastructure/interfaces/trips';
import { liveTrackingStorage, type StoredLiveTracking } from '@/infrastructure/storage/live-tracking-storage';
import {
  endIosActivity,
  isLiveTrackingSupported,
  startOrUpdateAndroidLiveUpdate,
  startOrUpdateIosActivity,
  stopAndroidLiveUpdate,
} from '@/presentation/utils/live-trip-tracking';
import {
  buildTripTrackingProps,
  LIVE_TRACKING_STATUSES,
  tripDeepLink,
  type TripTrackingProps,
} from '@/presentation/utils/trip-tracking-content';

/**
 * Seguimiento del viaje fuera de la app: Live Activity (iOS, Dynamic Island y
 * pantalla bloqueada) y Live Update (Android, notificacion en curso).
 *
 * - Se inicia con la app abierta, apenas el viaje tiene chofer: si el pasajero
 *   cierra la app antes, no hay nada que el backend pueda actualizar.
 * - Mientras la app esta abierta lo actualiza ella misma con cada cambio.
 * - En iOS registra el token de la actividad (`PUT /rides/{id}/live-activity`)
 *   para que el backend la siga actualizando por APNs con la app suspendida
 *   o cerrada. En Android se actualiza solo con la app viva (decision de
 *   producto): no se registra en el backend y, con la app cerrada, el
 *   pasajero se entera por las notificaciones del viaje.
 * - Al completarse o cancelarse lo cierra y le avisa al backend.
 *
 * Nada de esto puede romper la pantalla: cualquier fallo queda en silencio y
 * el viaje se sigue viendo como siempre.
 */
export function useLiveTripTracking(trip: Trip | null, etaMinutes: number | null): void {
  // Una operacion a la vez: start/update/end son asincronos y no se pueden pisar.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const tokenSubscription = useRef<{ remove: () => void } | null>(null);

  const props = useMemo<TripTrackingProps | null>(
    () => (trip ? buildTripTrackingProps(trip, etaMinutes) : null),
    // `etaEndsAt` se recalcula con `Date.now()`: se actualiza solo cuando cambian los minutos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip?.id, trip?.status, trip?.driver?.displayName, trip?.vehicle?.plate, trip?.vehicle?.name, etaMinutes],
  );

  const tripId = trip?.id ?? null;

  // Solo cuando cambia lo que se muestra: cada consulta trae un `trip` nuevo con lo mismo.
  useEffect(() => {
    if (!tripId || !props || !isLiveTrackingSupported()) return;

    const shouldTrack = (LIVE_TRACKING_STATUSES as readonly string[]).includes(props.status);
    if (!shouldTrack && !props.finished) return;

    queue.current = queue.current
      .then(() => (props.finished ? endTracking(tripId, props) : syncTracking(tripId, props, tokenSubscription)))
      .catch(() => undefined);
  }, [tripId, props]);

  useEffect(
    () => () => {
      tokenSubscription.current?.remove();
      tokenSubscription.current = null;
    },
    [],
  );
}

async function syncTracking(
  tripId: string,
  props: TripTrackingProps,
  tokenSubscription: { current: { remove: () => void } | null },
): Promise<void> {
  let stored = await liveTrackingStorage.get();

  // Quedo abierto el seguimiento de otro viaje (la app se cerro sin terminarlo).
  if (stored && stored.tripId !== tripId) {
    await closeLocal(stored, null);
    await liveTrackingStorage.clear();
    stored = null;
  }

  const deepLink = tripDeepLink(tripId);

  if (Platform.OS === 'ios') {
    const result = startOrUpdateIosActivity(stored?.activityId ?? null, props, deepLink);
    if (!result) return;

    const next: StoredLiveTracking = {
      tripId,
      activityId: result.activityId,
      registeredToken: stored?.activityId === result.activityId ? stored.registeredToken : null,
    };
    await liveTrackingStorage.save(next);

    const register = async (token: string | null) => {
      if (!token) return;
      const current = await liveTrackingStorage.get();
      if (!current || current.tripId !== tripId || current.registeredToken === token) return;

      await registerLiveActivityAction(tripId, { platform: 'ios', push_token: token });
      await liveTrackingStorage.save({ ...current, registeredToken: token });
    };

    // El token puede tardar en llegar y APNs lo rota: se registra cada vez que cambia.
    if (!tokenSubscription.current) {
      tokenSubscription.current = result.instance.addPushTokenListener((event) => {
        void register(event.pushToken).catch(() => undefined);
      });
    }
    await register(await result.instance.getPushToken());
    return;
  }

  const currentId = stored ? Number(stored.activityId) : null;
  const notificationId = await startOrUpdateAndroidLiveUpdate(
    currentId !== null && Number.isFinite(currentId) ? currentId : null,
    props,
    deepLink,
  );
  if (notificationId === null) return;

  await liveTrackingStorage.save({ tripId, activityId: String(notificationId), registeredToken: null });
}

async function endTracking(tripId: string, finalProps: TripTrackingProps): Promise<void> {
  const stored = await liveTrackingStorage.get();
  if (!stored || stored.tripId !== tripId) return;

  await closeLocal(stored, finalProps);
  await liveTrackingStorage.clear();

  // El backend ya cierra los registros al terminar el viaje; esto es por si
  // el aviso llego antes por socket que por el outbox.
  await unregisterLiveActivityAction(tripId).catch(() => undefined);
}

async function closeLocal(stored: StoredLiveTracking, finalProps: TripTrackingProps | null): Promise<void> {
  if (Platform.OS === 'ios') {
    await endIosActivity(stored.activityId, finalProps);
    return;
  }

  const id = Number(stored.activityId);
  stopAndroidLiveUpdate(Number.isFinite(id) ? id : null);
}
