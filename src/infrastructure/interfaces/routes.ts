// Ruta estimada del chofer en movimiento (no hay proveedor de rutas para esto,
// solo para la cotizacion ya hecha): ver `useDriverEta`.

import type { Coordinates } from './places';

export interface DrivingRoute {
  /** Trazado listo para `Polyline`. */
  points: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
}
