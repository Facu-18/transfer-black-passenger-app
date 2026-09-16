import axios from 'axios';

import type { GeoapifyResultsResponse } from '@/infrastructure/interfaces/geoapify-api';
import type { PlacesProvider } from '@/infrastructure/interfaces/places';
import { GeoapifyPlaceMapper } from '@/infrastructure/mappers/geoapify-place.mapper';

import { getGeoapifyApiKey } from './api-config';

const SUGGESTIONS_LIMIT = 6;

// Cliente propio y no `transferBlackApi`: es otro servidor y no debe recibir el
// access token de Transfer Black.
const geoapifyApi = axios.create({
  baseURL: 'https://api.geoapify.com/v1/geocode',
  timeout: 8_000,
});

/** Parametros comunes: resultados en español y solo de Argentina. */
function baseParams() {
  return { apiKey: getGeoapifyApiKey(), lang: 'es', format: 'json' };
}

export const geoapifyPlacesProvider: PlacesProvider = {
  async autocomplete(text, { near, signal } = {}) {
    const { data } = await geoapifyApi.get<GeoapifyResultsResponse>('/autocomplete', {
      signal,
      params: {
        ...baseParams(),
        text,
        limit: SUGGESTIONS_LIMIT,
        filter: 'countrycode:ar',
        // Geoapify recibe la proximidad como lon,lat (al reves que el resto de la app).
        ...(near ? { bias: `proximity:${near.longitude},${near.latitude}` } : {}),
      },
    });

    return data.results.map(GeoapifyPlaceMapper.toPlace);
  },

  async reverseGeocode({ latitude, longitude }, { signal } = {}) {
    const { data } = await geoapifyApi.get<GeoapifyResultsResponse>('/reverse', {
      signal,
      params: { ...baseParams(), lat: latitude, lon: longitude, limit: 1 },
    });

    const [first] = data.results;
    return first ? GeoapifyPlaceMapper.toPlace(first) : null;
  },
};
