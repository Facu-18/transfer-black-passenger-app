import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Coordinates, PlacesProvider, PlaceSuggestion } from '@/infrastructure/interfaces/places';
import type { PlaceDetailsResponse, PlaceReverseResponse, PlaceSuggestionResponse } from '@/infrastructure/interfaces/places-api';
import { GooglePlaceMapper } from '@/infrastructure/mappers/google-place.mapper';

import { transferBlackApi } from './transfer-black-api';

/**
 * Cache minuscula de autocompletado por `sessionToken` + texto exacto: dentro
 * de una misma sesion el usuario puede borrar y volver a escribir lo mismo
 * (o el debounce puede reencolar la misma consulta), y repetirla no cambia el
 * resultado. No tiene TTL: una sesion dura segundos y se descarta completa al
 * cerrarse (ver `resetSession`).
 */
const MAX_CACHE_ENTRIES = 30;
const autocompleteCache = new Map<string, PlaceSuggestion[]>();

function cacheKey(sessionToken: string, text: string): string {
  return `${sessionToken}:${text}`;
}

function rememberSuggestions(key: string, suggestions: PlaceSuggestion[]): void {
  if (autocompleteCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = autocompleteCache.keys().next().value;
    if (oldestKey !== undefined) autocompleteCache.delete(oldestKey);
  }
  autocompleteCache.set(key, suggestions);
}

function toNearParams(near: Coordinates | null | undefined) {
  return near ? { lat: near.latitude, lng: near.longitude } : {};
}

export const googlePlacesProvider: PlacesProvider = {
  async autocomplete(text, { near, sessionToken, signal } = {}) {
    if (!sessionToken) {
      throw new Error('Falta sessionToken para el autocompletado de lugares');
    }

    const key = cacheKey(sessionToken, text);
    const cached = autocompleteCache.get(key);
    if (cached) return cached;

    const { data } = await transferBlackApi.get<ApiDataResponse<PlaceSuggestionResponse[]>>('/places/autocomplete', {
      signal,
      params: { text, session_token: sessionToken, ...toNearParams(near) },
    });

    const suggestions = data.data.map(GooglePlaceMapper.toSuggestion);
    rememberSuggestions(key, suggestions);
    return suggestions;
  },

  async getPlaceDetails(suggestion, sessionToken, { signal } = {}) {
    const { data } = await transferBlackApi.get<ApiDataResponse<PlaceDetailsResponse>>(
      `/places/details/${encodeURIComponent(suggestion.placeId)}`,
      { signal, params: { session_token: sessionToken } },
    );

    return GooglePlaceMapper.toPlaceFromSuggestion(suggestion, data.data);
  },

  async reverseGeocode({ latitude, longitude }, { signal } = {}) {
    const { data } = await transferBlackApi.get<ApiDataResponse<PlaceReverseResponse>>('/places/reverse', {
      signal,
      params: { lat: latitude, lng: longitude },
    });

    return GooglePlaceMapper.toPlaceFromAddress(data.data);
  },
};
