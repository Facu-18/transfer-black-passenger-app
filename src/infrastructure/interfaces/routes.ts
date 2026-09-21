// Rutas en auto entre dos puntos, independientes del proveedor de mapas. Igual
// que con los lugares: migrar a Google es escribir otro `RoutesProvider`.

import type { Coordinates } from './places';

export interface DrivingRoute {
  /** Trazado listo para `Polyline`. */
  points: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutesProvider {
  route(from: Coordinates, to: Coordinates, options?: { signal?: AbortSignal }): Promise<DrivingRoute>;
}
