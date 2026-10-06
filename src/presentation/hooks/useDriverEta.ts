import { useEffect, useRef, useState } from 'react';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import type { DrivingRoute } from '@/infrastructure/interfaces/routes';
import { distanceMeters } from '@/presentation/utils/geo';

/**
 * Cada cuanto se recalcula la ruta mostrada. No hay proveedor de rutas para el
 * chofer en movimiento (el backend solo calcula una ruta al cotizar el viaje,
 * no para un origen/destino cualquiera): esto solo evita recalcular y
 * reencuadrar el mapa con cada posicion (llegan cada 3 s), no gastar cuota.
 */
const ROUTE_REFRESH_MS = 30_000;

/** En la ciudad no se maneja en linea recta. */
const DETOUR_FACTOR = 1.3;
const FALLBACK_SPEED_METERS_PER_SECOND = 25_000 / 3_600;

/** Estimacion local a partir de la distancia en linea recta. */
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
 * Es siempre una estimacion en linea recta (no existe un proveedor de rutas
 * para el chofer en movimiento, solo para la cotizacion ya hecha): se calcula
 * al llegar la primera posicion y despues cada 30 segundos, o antes si cambia
 * el destino, para no reencuadrar el mapa con cada posicion.
 */
export function useDriverEta(driver: Coordinates | null, target: Coordinates | null, enabled: boolean) {
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const lastRequestAt = useRef(0);
  const lastTarget = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!enabled || !driver || !target) return;

    const targetChanged =
      lastTarget.current?.latitude !== target.latitude || lastTarget.current?.longitude !== target.longitude;
    if (!targetChanged && Date.now() - lastRequestAt.current < ROUTE_REFRESH_MS) return;

    lastRequestAt.current = Date.now();
    lastTarget.current = target;
    setRoute(estimateRoute(driver, target));
    // Solo importa el valor de las coordenadas, no la identidad del objeto.
  }, [enabled, driver?.latitude, driver?.longitude, target?.latitude, target?.longitude]);

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
