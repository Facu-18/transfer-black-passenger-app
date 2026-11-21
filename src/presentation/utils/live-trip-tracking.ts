import { PermissionsAndroid, Platform } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import type { TripTrackingProps } from '@/presentation/utils/trip-tracking-content';

/**
 * Adaptador por plataforma del seguimiento en vivo fuera de la app:
 * Live Activity en iOS (`expo-widgets`) y Live Update en Android
 * (`expo-live-updates`). Las dos librerias necesitan un build nativo; en Expo
 * Go no existen, asi que se cargan de forma perezosa y, si faltan, todo esto
 * queda en no-op en vez de romper la pantalla del viaje.
 */

type LiveActivityFactory = typeof import('@/presentation/live-activity/TripTrackingActivity').default;
type LiveActivityInstance = ReturnType<LiveActivityFactory['start']>;
type LiveUpdatesModule = typeof import('expo-live-updates');

let iosFactory: LiveActivityFactory | null | undefined;
let androidModule: LiveUpdatesModule | null | undefined;

function getIosFactory(): LiveActivityFactory | null {
  if (Platform.OS !== 'ios') return null;
  if (iosFactory !== undefined) return iosFactory;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga perezosa: el modulo nativo no existe en Expo Go
    iosFactory = (require('../live-activity/TripTrackingActivity') as { default: LiveActivityFactory }).default;
  } catch {
    iosFactory = null;
  }
  return iosFactory;
}

function getAndroidModule(): LiveUpdatesModule | null {
  if (Platform.OS !== 'android') return null;
  if (androidModule !== undefined) return androidModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga perezosa: el modulo nativo no existe en Expo Go
    androidModule = require('expo-live-updates') as LiveUpdatesModule;
  } catch {
    androidModule = null;
  }
  return androidModule;
}

export function isLiveTrackingSupported(): boolean {
  return getIosFactory() !== null || getAndroidModule() !== null;
}

/** Lo que muestra la Live Update de Android: los mismos campos que manda el backend por FCM. */
function toAndroidState(props: TripTrackingProps) {
  const vehicleLine = [props.vehicle, props.plate].filter(Boolean).join(' · ');

  return {
    title: props.title,
    text: props.subtitle || undefined,
    subText: vehicleLine || undefined,
    shortCriticalText: props.shortText,
    progress: { max: 100, progress: props.progress },
    ...(props.etaEndsAt !== null ? { showTime: true, time: props.etaEndsAt } : { showTime: false }),
  };
}

// --- iOS ---

function findIosActivity(activityId: string): LiveActivityInstance | null {
  const factory = getIosFactory();
  if (!factory) return null;

  return factory.getInstances().find((instance) => instance.getId() === activityId) ?? null;
}

/** Inicia (o reusa) la Live Activity del viaje y devuelve su id; `null` si no se pudo. */
export function startOrUpdateIosActivity(
  activityId: string | null,
  props: TripTrackingProps,
  deepLink: string,
): { activityId: string; instance: LiveActivityInstance } | null {
  const factory = getIosFactory();
  if (!factory) return null;

  try {
    const existing = activityId ? findIosActivity(activityId) : null;
    if (existing) {
      void existing.update(props);
      return { activityId: existing.getId(), instance: existing };
    }

    const instance = factory.start(props, deepLink);
    const id = instance.getId();
    return id ? { activityId: id, instance } : null;
  } catch {
    // Live Activities deshabilitadas por el usuario o iOS sin soporte (< 16.2).
    return null;
  }
}

export async function endIosActivity(activityId: string | null, finalProps: TripTrackingProps | null): Promise<void> {
  const factory = getIosFactory();
  if (!factory) return;

  // Sin id (o con uno viejo) se cierran todas: solo hay un viaje en curso a la vez.
  const targets = activityId
    ? factory.getInstances().filter((instance) => instance.getId() === activityId)
    : factory.getInstances();

  await Promise.allSettled(
    targets.map((instance) => instance.end(finalProps ? 'default' : 'immediate', finalProps ?? undefined)),
  );
}

// --- Android ---

const ANDROID_NOTIFICATION_PERMISSION = 'android.permission.POST_NOTIFICATIONS';

export async function startOrUpdateAndroidLiveUpdate(
  notificationId: number | null,
  props: TripTrackingProps,
  deepLink: string,
): Promise<number | null> {
  const module = getAndroidModule();
  if (!module) return null;

  // Sin permiso de notificaciones (Android 13+) la libreria no puede mostrar nada.
  if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.check(ANDROID_NOTIFICATION_PERMISSION);
    if (!granted) return null;
  }

  try {
    const state = toAndroidState(props);
    // La libreria antepone sola el scheme de la app (`<scheme>://<deepLinkUrl>`):
    // con la URL completa quedaria `transferblack-passenger://transferblack-passenger://...`,
    // una ruta que no existe. Se le pasa solo la ruta (`trip/<id>`).
    const config = {
      deepLinkUrl: deepLink.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''),
      iconBackgroundColor: colors.gold,
    };

    if (notificationId !== null) {
      module.updateLiveUpdate(notificationId, state, config);
      return notificationId;
    }

    return module.startLiveUpdate(state, config) ?? null;
  } catch {
    return null;
  }
}

export function stopAndroidLiveUpdate(notificationId: number | null): void {
  const module = getAndroidModule();
  if (!module || notificationId === null) return;

  try {
    module.stopLiveUpdate(notificationId);
  } catch {
    // Ya no existia (el usuario la descarto o el sistema la quito).
  }
}
