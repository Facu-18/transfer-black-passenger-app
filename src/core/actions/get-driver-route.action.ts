import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Coordinates } from '@/infrastructure/interfaces/places';
import type { DrivingRoute } from '@/infrastructure/interfaces/routes';

interface DriverRouteResponse {
  phase: 'to_pickup' | 'to_destination';
  distance_meters: number;
  duration_seconds: number;
  geometry: { type: 'MultiLineString'; coordinates: number[][][] };
}

/** GeoJSON guarda [longitud, latitud]; las lineas se recorren en orden. */
function toPoints(geometry: DriverRouteResponse['geometry']): Coordinates[] {
  if (!geometry || geometry.type !== 'MultiLineString' || !Array.isArray(geometry.coordinates)) return [];
  return geometry.coordinates.flatMap((line) =>
    line
      .filter((position) => position.length >= 2)
      .map(([longitude, latitude]) => ({ latitude: latitude as number, longitude: longitude as number })),
  );
}

/**
 * Ruta real del chofer en movimiento (`GET /rides/{tripId}/driver-route`):
 * desde donde esta hasta la partida o, con el pasajero arriba, hasta el
 * destino por las paradas. El backend la reusa mientras el auto no se mueva
 * mucho, asi que pedirla cada ~30 s no gasta cuota de Google en cada posicion.
 */
export async function getDriverRouteAction(tripId: string): Promise<DrivingRoute> {
  const { data } = await transferBlackApi.get<ApiDataResponse<DriverRouteResponse>>(`/rides/${tripId}/driver-route`);

  return {
    points: toPoints(data.data.geometry),
    distanceMeters: data.data.distance_meters,
    durationSeconds: data.data.duration_seconds,
  };
}
