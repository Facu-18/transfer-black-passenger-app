import { placesProvider } from '@/core/api/places-provider';
import type { Coordinates, Place } from '@/infrastructure/interfaces/places';

/** Menos letras dan resultados demasiado genericos y gastan cuota del proveedor. */
export const MIN_SEARCH_LENGTH = 3;

export async function searchPlacesAction(
  text: string,
  options: { near?: Coordinates | null; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const query = text.trim();

  if (query.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  return placesProvider.autocomplete(query, options);
}
