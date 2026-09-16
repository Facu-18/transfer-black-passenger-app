import { placesProvider } from '@/core/api/places-provider';
import type { Coordinates, Place } from '@/infrastructure/interfaces/places';

/**
 * Convierte la posicion del GPS en un lugar con direccion y `placeId`, que es lo
 * que necesita la cotizacion para usarla como origen.
 */
export function resolvePlaceFromCoordinatesAction(
  coordinates: Coordinates,
  options: { signal?: AbortSignal } = {},
): Promise<Place | null> {
  return placesProvider.reverseGeocode(coordinates, options);
}
