// Ruta del chofer en movimiento (la calcula el backend, `GET /rides/{tripId}/driver-route`):
// ver `useDriverEta`.

import type { Coordinates } from './places';

export interface DrivingRoute {
  /** Trazado listo para `Polyline`. */
  points: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
}
