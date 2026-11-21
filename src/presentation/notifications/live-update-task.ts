import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { liveTrackingStorage } from '@/infrastructure/storage/live-tracking-storage';
import { startOrUpdateAndroidLiveUpdate, stopAndroidLiveUpdate } from '@/presentation/utils/live-trip-tracking';
import { tripDeepLink, type TripTrackingProps } from '@/presentation/utils/trip-tracking-content';

/**
 * Tarea que corre al llegar la push silenciosa del seguimiento (`type:
 * live_update`), aunque la app este cerrada: expo-task-manager carga el
 * bundle en segundo plano y ejecuta esto. Actualiza o cierra la Live Update
 * de Android con lo que manda el backend, asi nunca queda mostrando un estado
 * viejo. Tiene que definirse en el alcance del modulo y cargarse desde la
 * entrada de la app (`index.ts`), antes que expo-router.
 */
export const LIVE_UPDATE_TASK = 'transferblack-live-update';

/** Lo que manda el backend (`ExpoLiveUpdateSender`). */
export interface LiveUpdatePush {
  type: 'live_update';
  event: 'update' | 'stop';
  trip_id: string;
  notification_id: number;
  title?: string;
  text?: string;
  sub_text?: string;
  short_text?: string;
  progress?: number;
  eta_ends_at?: number | null;
}

/**
 * Expo puede entregar los datos en distintos niveles segun el estado de la
 * app (`dataString` con JSON, `body` con JSON o el objeto directo): se busca
 * en todos.
 */
export function extractLiveUpdatePush(raw: unknown, depth = 0): LiveUpdatePush | null {
  if (depth > 3 || raw === null || raw === undefined) return null;

  if (typeof raw === 'string') {
    try {
      return extractLiveUpdatePush(JSON.parse(raw), depth + 1);
    } catch {
      return null;
    }
  }

  if (typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  if (record.type === 'live_update' && typeof record.trip_id === 'string') {
    const notificationId = Number(record.notification_id);
    if (!Number.isFinite(notificationId)) return null;
    return { ...(record as unknown as LiveUpdatePush), notification_id: notificationId };
  }

  for (const key of ['data', 'dataString', 'body', 'notification']) {
    const found = extractLiveUpdatePush(record[key], depth + 1);
    if (found) return found;
  }
  return null;
}

export async function applyLiveUpdatePush(push: LiveUpdatePush): Promise<void> {
  const stored = await liveTrackingStorage.get();
  // Solo se toca la Live Update que inicio esta app para ese viaje.
  if (!stored || stored.tripId !== push.trip_id || stored.activityId !== String(push.notification_id)) return;

  if (push.event === 'stop') {
    stopAndroidLiveUpdate(push.notification_id);
    await liveTrackingStorage.clear();
    return;
  }

  const props: TripTrackingProps = {
    status: '',
    title: push.title ?? 'Tu viaje',
    subtitle: push.text ?? '',
    driverName: null,
    // `sub_text` ya viene armado ("auto · patente"): se pasa entero como vehiculo.
    vehicle: push.sub_text || null,
    plate: null,
    publicCode: '',
    etaEndsAt: push.eta_ends_at ?? null,
    progress: push.progress ?? 0,
    shortText: push.short_text ?? '',
    finished: false,
  };
  await startOrUpdateAndroidLiveUpdate(push.notification_id, props, tripDeepLink(push.trip_id));
}

if (Platform.OS === 'android') {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(LIVE_UPDATE_TASK, async ({ data }) => {
    // Un toque sobre una notificacion tambien llega aca: no es una push del seguimiento.
    if (!data || 'actionIdentifier' in data) return;

    const push = extractLiveUpdatePush(data);
    if (push) await applyLiveUpdatePush(push).catch(() => undefined);
  });

  void Notifications.registerTaskAsync(LIVE_UPDATE_TASK).catch(() => undefined);
}
