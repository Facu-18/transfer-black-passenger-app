import { placesProvider } from '@/core/api/places-provider';
import type { Place, PlaceSuggestion } from '@/infrastructure/interfaces/places';

/**
 * Resuelve las coordenadas de una sugerencia del autocompletado: Google no las
 * manda hasta este punto. Tambien cierra la sesion de autocompletado que la
 * trajo (`sessionToken`), asi que solo se llama una vez por sesion.
 */
export function resolvePlaceDetailsAction(
  suggestion: PlaceSuggestion,
  sessionToken: string,
  options: { signal?: AbortSignal } = {},
): Promise<Place> {
  return placesProvider.getPlaceDetails(suggestion, sessionToken, options);
}
