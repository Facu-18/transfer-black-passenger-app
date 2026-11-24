import { useEffect, useRef, useState } from 'react';

import { getDriverRouteAction } from '@/core/actions/get-driver-route.action';
import type { Coordinates } from '@/infrastructure/interfaces/places';
import type { DrivingRoute } from '@/infrastructure/interfaces/routes';
import { distanceMeters, trimRouteAhead } from '@/presentation/utils/geo';

/**
 * Cada cuanto se pide de nuevo la ruta del chofer al backend. No en cada
 * posicion (llegan cada 3 s): el backend la calcula con Google, y reencuadrar
 * el mapa a cada rato no dejaria moverlo.
 */
const ROUTE_REFRESH_MS = 30_000;

/** Sin ruta real, en la ciudad no se maneja en linea recta. */
const DETOUR_FACTOR = 1.3;
const FALLBACK_SPEED_METERS_PER_SECOND = 25_000 / 3_600;

/** Largo de una polilinea, sumando sus tramos. */
function pathMeters(points: Coordinates[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceMeters(points[index - 1]!, points[index]!);
  }
  return total;
}

/** Ultimo recurso, sin ruta del backend: linea recta con un factor de desvio. */
function straightLine(from: Coordinates, to: Coordinates): DrivingRoute {
  const meters = distanceMeters(from, to) * DETOUR_FACTOR;
  return { points: [from, to], distanceMeters: meters, durationSeconds: meters / FALLBACK_SPEED_METERS_PER_SECOND };
}

/**
 * Lo que falta de una ruta desde donde esta el auto. Se devuelve la ruta
 * entera (misma referencia): el mapa recorta lo recorrido y no reencuadra.
 */
function remainingOf(route: DrivingRoute, from: Coordinates, progress: { current: number }): DrivingRoute {
  const trimmed = trimRouteAhead(route.points, from, progress.current);
  progress.current = trimmed.segment;
  const meters = pathMeters(trimmed.points);
  const totalMeters = pathMeters(route.points) || 1;
  // Con la duracion de Google, el tiempo que falta es proporcional a lo que falta recorrer.
  const durationSeconds =
    route.durationSeconds > 0 ? (route.durationSeconds * meters) / totalMeters : meters / FALLBACK_SPEED_METERS_PER_SECOND;
  return { points: route.points, distanceMeters: meters, durationSeconds };
}

/**
 * Ruta, minutos y distancia del chofer hasta `target`: el punto de partida
 * mientras viene a buscar al pasajero, el destino final cuando ya lo lleva.
 *
 * - A bordo con ruta cotizada: esa ruta (pasa por las paradas), medida desde el auto.
 * - Si no: la ruta real del chofer que calcula el backend
 *   (`GET /rides/{tripId}/driver-route`), pedida al llegar la primera
 *   posicion, al cambiar el destino y despues cada 30 s.
 * - Si el backend no la da (sin red, backend viejo): linea recta estimada.
 */
export function useDriverEta(
  tripId: string | null,
  driver: Coordinates | null,
  target: Coordinates | null,
  enabled: boolean,
  /** Ruta cotizada hasta `target` (a bordo); `null` para pedir la del chofer. */
  quotedRoute: Coordinates[] | null = null,
) {
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  // Ultima ruta completa conocida (cotizada o del backend) y tramo alcanzado sobre ella.
  const baseRoute = useRef<DrivingRoute | null>(null);
  const routeProgress = useRef(0);
  const lastFetchAt = useRef(0);
  const lastTarget = useRef<Coordinates | null>(null);
  const lastQuotedRoute = useRef<Coordinates[] | null>(null);
  const fetching = useRef(false);

  useEffect(() => {
    if (!enabled || !driver || !target) return;

    const targetChanged =
      lastTarget.current?.latitude !== target.latitude || lastTarget.current?.longitude !== target.longitude;
    const quotedChanged = lastQuotedRoute.current !== quotedRoute;
    lastTarget.current = target;
    lastQuotedRoute.current = quotedRoute;

    if (quotedRoute && quotedRoute.length > 1) {
      if (quotedChanged || !baseRoute.current) {
        baseRoute.current = { points: quotedRoute, distanceMeters: pathMeters(quotedRoute), durationSeconds: 0 };
        routeProgress.current = 0;
      }
      setRoute(remainingOf(baseRoute.current, driver, routeProgress));
      return;
    }

    if (targetChanged) {
      // Otro destino (llego a buscarte y ahora va al destino): la ruta anterior ya no sirve.
      baseRoute.current = null;
      routeProgress.current = 0;
      lastFetchAt.current = 0;
    }

    // Entre pedidos, la ruta conocida se sigue midiendo desde donde esta el auto.
    if (baseRoute.current) setRoute(remainingOf(baseRoute.current, driver, routeProgress));
    else setRoute(straightLine(driver, target));

    const due = Date.now() - lastFetchAt.current >= ROUTE_REFRESH_MS;
    if (!tripId || fetching.current || !due) return;

    fetching.current = true;
    lastFetchAt.current = Date.now();
    const requestedTarget = target;
    getDriverRouteAction(tripId)
      .then((fresh) => {
        // Si mientras tanto cambio el destino, esta ruta ya no corresponde.
        const current = lastTarget.current;
        const sameTarget =
          current?.latitude === requestedTarget.latitude && current?.longitude === requestedTarget.longitude;
        if (!sameTarget || fresh.points.length < 2) return;
        baseRoute.current = fresh;
        routeProgress.current = 0;
        setRoute(remainingOf(fresh, driver, routeProgress));
      })
      .catch(() => {
        // Sin ruta del backend queda la linea recta; se reintenta en el proximo turno.
      })
      .finally(() => {
        fetching.current = false;
      });
    // Solo importa el valor de las coordenadas, no la identidad del objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tripId, driver?.latitude, driver?.longitude, target?.latitude, target?.longitude, quotedRoute]);

  useEffect(() => {
    if (!enabled) {
      setRoute(null);
      baseRoute.current = null;
      routeProgress.current = 0;
      lastFetchAt.current = 0;
    }
  }, [enabled]);

  return {
    route,
    minutes: route ? Math.max(1, Math.ceil(route.durationSeconds / 60)) : null,
    distanceKm: route ? route.distanceMeters / 1000 : null,
  };
}
