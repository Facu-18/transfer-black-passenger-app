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

/** A esta distancia de un tramo, el auto se considera sobre ese tramo. */
const ON_ROUTE_METERS = 60;

/**
 * Recorta la polilinea de la ruta desde donde esta el auto: el tramo ya
 * recorrido no se dibuja ni se cuenta. Busca hacia adelante desde
 * `fromSegment` (el ultimo tramo alcanzado) y se queda con el primero que pasa
 * cerca del auto: en un recorrido de ida y vuelta (con paradas) el regreso pasa
 * por los mismos lugares, y el tramo "mas cercano" de toda la ruta podria ser
 * el ultimo. Si ninguno pasa cerca (el auto se desvio), usa el mas cercano de
 * los que quedan. Con menos de dos puntos se devuelve la ruta sin cambios.
 */
export function trimRouteAhead(
  route: Coordinates[],
  position: Coordinates,
  fromSegment = 0,
): { points: Coordinates[]; segment: number } {
  if (route.length < 2) return { points: route, segment: 0 };

  const start = Math.min(Math.max(0, fromSegment), route.length - 2);
  let bestDistance = Infinity;
  let bestSegment = start;
  let bestPoint: Coordinates = route[start]!;

  for (let i = start; i < route.length - 1; i++) {
    const candidate = nearestPointOnSegment(position, route[i]!, route[i + 1]!);
    if (candidate.distance <= ON_ROUTE_METERS) {
      bestSegment = i;
      bestPoint = candidate.point;
      break;
    }
    if (candidate.distance < bestDistance) {
      bestDistance = candidate.distance;
      bestSegment = i;
      bestPoint = candidate.point;
    }
  }

  return { points: [bestPoint, ...route.slice(bestSegment + 1)], segment: bestSegment };
}

/** `trimRouteAhead` desde el principio de la ruta. */
export function trimRouteFromPosition(route: Coordinates[], position: Coordinates): Coordinates[] {
  return trimRouteAhead(route, position).points;
}
