import { placesProvider } from '@/core/api/places-provider';
import type { Coordinates, PlaceSuggestion } from '@/infrastructure/interfaces/places';

/** Menos letras dan resultados demasiado genericos y gastan cuota del proveedor. */
export const MIN_SEARCH_LENGTH = 3;

export async function searchPlacesAction(
  text: string,
  options: { near?: Coordinates | null; sessionToken: string; signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const query = text.trim();

  if (query.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  return placesProvider.autocomplete(query, options);
}
