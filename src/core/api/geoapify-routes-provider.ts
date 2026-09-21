import axios from 'axios';

import type { GeoapifyRoutingResponse } from '@/infrastructure/interfaces/geoapify-api';
import type { RoutesProvider } from '@/infrastructure/interfaces/routes';

import { getGeoapifyApiKey } from './api-config';

// Cliente propio: es otro servidor y no debe recibir el access token de Transfer Black.
const geoapifyRoutingApi = axios.create({
  baseURL: 'https://api.geoapify.com/v1/routing',
  timeout: 8_000,
});

export const geoapifyRoutesProvider: RoutesProvider = {
  async route(from, to, { signal } = {}) {
    const { data } = await geoapifyRoutingApi.get<GeoapifyRoutingResponse>('', {
      signal,
      params: {
        apiKey: getGeoapifyApiKey(),
        // Geoapify recibe lat,lon en `waypoints`, separados por `|`.
        waypoints: `${from.latitude},${from.longitude}|${to.latitude},${to.longitude}`,
        mode: 'drive',
        format: 'geojson',
      },
    });

    const [route] = data.features;
    if (!route) {
      throw new Error('Geoapify no encontro una ruta entre los puntos');
    }

    return {
      points: route.geometry.coordinates.flat().map(([longitude, latitude]) => ({
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      })),
      distanceMeters: route.properties.distance,
      durationSeconds: route.properties.time,
    };
  },
};
