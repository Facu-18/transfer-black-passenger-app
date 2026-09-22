import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getTripAction } from '@/core/actions/get-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { realtimeClient } from '@/core/api/realtime-client';
import type { DriverLocation, RealtimeConnectionState } from '@/infrastructure/interfaces/realtime';
import { FINISHED_TRIP_STATUSES, type Trip, type TripStatus } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/**
 * Consulta de respaldo mientras el socket esta caido: el viaje no deja de
 * avanzar porque el pasajero perdio la conexion en tiempo real.
 */
const FALLBACK_POLL_MS = 10_000;

/**
 * Consulta de respaldo con el socket conectado, solo en los estados que cambian
 * sin que el pasajero haga nada (pago que se acredita, busqueda de chofer). Un
 * aviso perdido no puede dejar la pantalla trabada en "Confirmando tu pago".
 */
const PENDING_POLL_MS = 15_000;
const SELF_ADVANCING_STATUSES: readonly TripStatus[] = ['draft', 'searching'];

/**
 * Sigue el viaje activo: REST para el estado real y Socket.IO para enterarse
 * al instante de cada cambio y de la posicion del chofer.
 *
 * Cada aviso del socket dispara una nueva consulta a `GET /rides/{tripId}`:
 * el evento solo trae el estado, y el detalle (chofer, auto) viene por REST.
 * Tambien se re-consulta al reconectar y al volver del segundo plano, porque
 * mientras no se escuchaba el viaje pudo cambiar.
 */
export function useActiveTrip(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connection, setConnection] = useState<RealtimeConnectionState>(realtimeClient.getState());
  const [isLoading, setIsLoading] = useState(tripId !== null);
  const [error, setError] = useState<string | null>(null);

  // Descarta respuestas viejas: si dos consultas se cruzan, gana la ultima pedida.
  const requestSeq = useRef(0);
  const sessionExpired = useRef(false);

  const expireSession = useCallback(() => {
    if (sessionExpired.current) return;
    sessionExpired.current = true;
    handleExpiredSession();
  }, []);

  const refresh = useCallback(async () => {
    if (!tripId) return;

    const seq = ++requestSeq.current;

    try {
      const current = await getTripAction(tripId);
      if (seq !== requestSeq.current) return;

      setTrip(current);
      setError(null);
    } catch (reason: unknown) {
      if (seq !== requestSeq.current) return;

      // El interceptor ya intento renovar el token: si llega un 401, no se pudo.
      if (reason instanceof ApiRequestError && reason.status === 401) {
        expireSession();
        return;
      }

      setError(getApiErrorMessage(reason, 'No pudimos actualizar tu viaje.'));
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [tripId, expireSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFinished = trip ? FINISHED_TRIP_STATUSES.includes(trip.status) : false;

  // Tiempo real: solo mientras el viaje puede cambiar.
  useEffect(() => {
    if (!tripId || isFinished) return;

    let wasDisconnected = false;

    const unsubscribers = [
      realtimeClient.onTripStatusChanged(({ status }) => {
        // El estado se muestra ya; el detalle llega con la consulta.
        setTrip((current) => (current ? { ...current, status } : current));
        void refresh();
      }),
      realtimeClient.onDriverLocation(setDriverLocation),
      // Lo que cambio entre la primera consulta y la entrada a la sala no llego
      // por socket: con tarjeta, el pago suele acreditarse justo en ese hueco.
      realtimeClient.onRideJoined((rideId) => {
        if (rideId === tripId) void refresh();
      }),
      realtimeClient.onConnectionStateChange((state) => {
        setConnection(state);

        if (state === 'unauthorized') {
          expireSession();
        } else if (state === 'reconnecting') {
          wasDisconnected = true;
        } else if (state === 'connected' && wasDisconnected) {
          wasDisconnected = false;
          void refresh();
        }
      }),
    ];

    realtimeClient.joinRide(tripId);
    setConnection(realtimeClient.getState());

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      realtimeClient.leaveRide(tripId);
    };
  }, [tripId, isFinished, refresh, expireSession]);

  // Con la app en segundo plano el socket se corta y los avisos se pierden.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Respaldo por REST: siempre sin socket, y con socket mientras el viaje puede
  // avanzar solo.
  const selfAdvancing = trip ? SELF_ADVANCING_STATUSES.includes(trip.status) : true;
  useEffect(() => {
    if (!tripId || isFinished) return;
    if (connection === 'connected' && !selfAdvancing) return;

    const interval = connection === 'connected' ? PENDING_POLL_MS : FALLBACK_POLL_MS;
    const timer = setInterval(() => void refresh(), interval);
    return () => clearInterval(timer);
  }, [tripId, isFinished, connection, selfAdvancing, refresh]);

  // Otro chofer (o ninguno): la ultima posicion ya no corresponde.
  const driverId = trip?.driverId ?? null;
  useEffect(() => {
    setDriverLocation(null);
  }, [driverId]);

  return { trip, driverLocation, connection, isLoading, error, refresh };
}
