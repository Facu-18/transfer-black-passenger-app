// Eventos de Socket.IO del viaje. Los nombres y cuerpos son los que emite el
// backend (seccion "Tiempo real" de la documentacion en `/docs`).

import type { Coordinates } from './places';
import type { TripStatus } from './trips';

/** `trip:status_changed`: solo el estado; el detalle se relee por REST. */
export interface TripStatusChangedEvent {
  status: TripStatus;
}

/** `driver:location`: llega como mucho cada 3 segundos mientras hay viaje activo. */
export interface DriverLocationEvent {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface DriverLocation {
  coordinates: Coordinates;
  recordedAt: Date;
}

/**
 * `idle`: sin viaje que seguir. `connecting`: primera conexion. `reconnecting`:
 * se perdio y se esta recuperando. `unauthorized`: el token no se pudo renovar.
 */
export type RealtimeConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unauthorized';
