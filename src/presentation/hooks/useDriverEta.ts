import { useEffect, useRef, useState } from 'react';

import { routesProvider } from '@/core/api/routes-provider';
import type { Coordinates } from '@/infrastructure/interfaces/places';
import type { DrivingRoute } from '@/infrastructure/interfaces/routes';
import { distanceMeters } from '@/presentation/utils/geo';

/**
 * Cada cuanto se recalcula la ruta. Las posiciones llegan cada 3 segundos:
 * pedir una ruta por cada una gastaria la cuota del proveedor sin cambiar lo
 * que ve el pasajero.
 */
const ROUTE_REFRESH_MS = 30_000;

/** Si el proveedor falla: en la ciudad no se maneja en linea recta. */
const DETOUR_FACTOR = 1.3;
const FALLBACK_SPEED_METERS_PER_SECOND = 25_000 / 3_600;

function estimateRoute(from: Coordinates, to: Coordinates): DrivingRoute {
  const meters = distanceMeters(from, to) * DETOUR_FACTOR;
  return {
    points: [from, to],
    distanceMeters: meters,
    durationSeconds: meters / FALLBACK_SPEED_METERS_PER_SECOND,
  };
}

/**
 * Ruta, minutos y distancia del chofer hasta `target`: el punto de partida
 * mientras viene a buscar al pasajero, el destino final cuando ya lo lleva.
 *
 * Se calcula al llegar la primera posicion y despues cada 30 segundos, o antes
 * si cambia el destino.
 */
export function useDriverEta(driver: Coordinates | null, target: Coordinates | null, enabled: boolean) {
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const lastRequestAt = useRef(0);
  const lastTarget = useRef<Coordinates | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    if (!enabled || !driver || !target) return;

    const targetChanged =
      lastTarget.current?.latitude !== target.latitude || lastTarget.current?.longitude !== target.longitude;
    if (!targetChanged && Date.now() - lastRequestAt.current < ROUTE_REFRESH_MS) return;

    lastRequestAt.current = Date.now();
    lastTarget.current = target;

    // La respuesta se usa aunque ya haya llegado otra posicion: las posiciones
    // llegan cada 3 segundos y la ruta puede tardar mas.
    void routesProvider
      .route(driver, target)
      .catch(() => estimateRoute(driver, target))
      .then((next) => {
        if (mounted.current) setRoute(next);
      });
    // Solo importa el valor de las coordenadas, no la identidad del objeto.
  }, [enabled, driver?.latitude, driver?.longitude, target?.latitude, target?.longitude]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRoute(null);
      lastRequestAt.current = 0;
    }
  }, [enabled]);

  return {
    route,
    minutes: route ? Math.max(1, Math.ceil(route.durationSeconds / 60)) : null,
    distanceKm: route ? route.distanceMeters / 1000 : null,
  };
}
