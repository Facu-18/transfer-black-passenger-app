import type { Coordinates } from '@/infrastructure/interfaces/places';

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** Distancia en linea recta (haversine). */
export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Rumbo de `from` a `to` en grados, 0 = norte y en sentido horario. */
export function bearingDegrees(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Punto intermedio entre `from` y `to`; `ratio` va de 0 a 1. */
export function interpolate(from: Coordinates, to: Coordinates, ratio: number): Coordinates {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * ratio,
    longitude: from.longitude + (to.longitude - from.longitude) * ratio,
  };
}

/**
 * Punto mas cercano a `point` sobre el segmento `a`-`b`. A la escala de una
 * ruta urbana (unas pocas cuadras) alcanza con proyectar a un plano
 * cartesiano corrigiendo la longitud por el coseno de la latitud.
 */
function nearestPointOnSegment(
  point: Coordinates,
  a: Coordinates,
  b: Coordinates,
): { point: Coordinates; distance: number } {
  const latScale = Math.cos(toRadians(a.latitude)) || 1;
  const ax = a.longitude * latScale;
  const ay = a.latitude;
  const bx = b.longitude * latScale;
  const by = b.latitude;
  const px = point.longitude * latScale;
  const py = point.latitude;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  const projected: Coordinates = { latitude: ay + dy * t, longitude: (ax + dx * t) / latScale };
  return { point: projected, distance: distanceMeters(point, projected) };
}

/**
 * Recorta la polilinea de la ruta desde el punto mas cercano a `position`: el
 * tramo ya recorrido por el chofer no se dibuja. Si la ruta tiene menos de dos
 * puntos se devuelve sin cambios.
 */
export function trimRouteFromPosition(route: Coordinates[], position: Coordinates): Coordinates[] {
  if (route.length < 2) return route;

  let bestDistance = Infinity;
  let bestSegment = 0;
  let bestPoint: Coordinates = route[0];

  for (let i = 0; i < route.length - 1; i++) {
    const candidate = nearestPointOnSegment(position, route[i], route[i + 1]);
    if (candidate.distance < bestDistance) {
      bestDistance = candidate.distance;
      bestSegment = i;
      bestPoint = candidate.point;
    }
  }

  return [bestPoint, ...route.slice(bestSegment + 1)];
}
