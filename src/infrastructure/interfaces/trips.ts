// Modelos de viaje que usa la app.

import type { Coordinates } from './places';

/** Medio de pago que ofrece la pantalla de cotizacion. */
export type PaymentMethod = 'account_money' | 'cash';

export interface FareOption {
  /** `fare_quote_id` de la confirmacion. */
  id: string;
  /** Codigo de la categoria en el backend (`essential`, `comfort`...). */
  code: string;
  name: string;
  /** Importe exacto tal como lo mando el backend, para no perder centavos. */
  totalAmount: string;
  /** Mismo importe listo para mostrar, por ejemplo `$ 24.500`. */
  formattedTotal: string;
  currency: string;
  expiresAt: Date;
}

export interface QuotedRoute {
  distanceKm: number;
  durationMinutes: number;
  /** Trazado listo para `Polyline`, ya convertido a `{ latitude, longitude }`. */
  points: Coordinates[];
}

export interface RideQuote {
  /** Viaje en `draft`: es el `tripId` de la confirmacion. */
  tripId: string;
  publicCode: string;
  expiresAt: Date;
  route: QuotedRoute;
  options: FareOption[];
}

export interface ConfirmedTrip {
  tripId: string;
  publicCode: string;
  status: string;
  /** Solo con transferencia: hay que abrir esta URL de Mercado Pago. */
  checkoutUrl: string | null;
}

/** Estados del viaje en el backend. */
export type TripStatus =
  | 'draft'
  | 'scheduled'
  | 'searching'
  | 'assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Trip {
  id: string;
  /** Codigo corto que ve el pasajero, por ejemplo `TB-8F3K2A`. */
  publicCode: string;
  status: TripStatus;
  paymentMethod: string;
  driverId: string | null;
}
