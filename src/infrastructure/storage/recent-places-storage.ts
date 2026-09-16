import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Place } from '../interfaces/places';

const RECENT_PLACES_KEY = 'transferblack.recent_places';
export const MAX_RECENT_PLACES = 5;

function isPlace(value: unknown): value is Place {
  if (typeof value !== 'object' || value === null) return false;
  const place = value as Record<string, unknown>;
  const coordinates = place.coordinates as Record<string, unknown> | undefined;

  return (
    typeof place.placeId === 'string' &&
    typeof place.name === 'string' &&
    typeof place.address === 'string' &&
    typeof coordinates?.latitude === 'number' &&
    typeof coordinates?.longitude === 'number'
  );
}

/**
 * Ultimos destinos elegidos, guardados en el dispositivo.
 *
 * El backend todavia no tiene lugares frecuentes ni guardados. No es un dato
 * sensible, por eso va en AsyncStorage y no en SecureStore (que ademas avisa
 * por encima de 2 KB en iOS).
 */
export const recentPlacesStorage = {
  async get(): Promise<Place[]> {
    try {
      const raw = await AsyncStorage.getItem(RECENT_PLACES_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      // Lo guardado puede venir de una version anterior de la app: se descarta lo que no encaje.
      return Array.isArray(parsed) ? parsed.filter(isPlace) : [];
    } catch {
      return [];
    }
  },

  /** Agrega el lugar al principio, sin duplicados y hasta `MAX_RECENT_PLACES`. */
  async add(place: Place): Promise<Place[]> {
    const current = await recentPlacesStorage.get();
    const next = [place, ...current.filter((item) => item.placeId !== place.placeId)].slice(0, MAX_RECENT_PLACES);

    await AsyncStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(next));
    return next;
  },

  clear(): Promise<void> {
    return AsyncStorage.removeItem(RECENT_PLACES_KEY);
  },
};
