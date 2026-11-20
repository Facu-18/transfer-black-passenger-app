import * as SecureStore from 'expo-secure-store';

const LIVE_TRACKING_KEY = 'transferblack.live_tracking';

/**
 * El seguimiento en vivo abierto, para retomarlo si la app se cierra y vuelve
 * a abrirse con el viaje en curso. En Android el id de la notificacion solo
 * lo devuelve `startLiveUpdate`: sin guardarlo no se podria actualizar ni
 * cerrar despues de un reinicio.
 */
export interface StoredLiveTracking {
  tripId: string;
  /** iOS: id de la Live Activity. Android: id de la notificacion, como texto. */
  activityId: string;
  /** Ultimo token registrado en el backend: si cambia, se vuelve a registrar. */
  registeredToken: string | null;
}

export const liveTrackingStorage = {
  async get(): Promise<StoredLiveTracking | null> {
    const raw = await SecureStore.getItemAsync(LIVE_TRACKING_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredLiveTracking;
    } catch {
      return null;
    }
  },

  save(value: StoredLiveTracking): Promise<void> {
    return SecureStore.setItemAsync(LIVE_TRACKING_KEY, JSON.stringify(value));
  },

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(LIVE_TRACKING_KEY);
  },
};
