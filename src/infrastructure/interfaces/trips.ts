// Modelos de viaje que usa la app.

import type { Coordinates } from './places';

/** Medio de pago que ofrece la pantalla de cotizacion. */
export type PaymentMethod = 'account_money' | 'cash';

export interface FareOption {
  /** `fare_quote_id` de la confirmacion. */
  id: string;
  /** Codigo de la categoria en el backend (hoy solo `prioridad`; la lista la decide el backend). */
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

/** Datos del invitado que carga el titular para pedir un viaje para un tercero. */
export interface GuestPassenger {
  name: string;
  phoneE164: string;
  email: string | null;
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

export interface TripPoint {
  address: string;
  coordinates: Coordinates;
}

/** Lo que el pasajero ve del chofer asignado: sin telefono ni email. */
export interface TripDriver {
  /** Nombre y la inicial del apellido, por ejemplo `Carlos R.`. */
  displayName: string;
  /** Iniciales para el avatar cuando no hay foto. */
  initials: string;
  avatarUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
}

export interface TripVehicle {
  /** Marca y modelo, por ejemplo `Toyota Corolla`. */
  name: string;
  color: string;
  plate: string;
}

/** Datos del invitado que viaja, cuando el viaje se pidio para un tercero. */
export interface TripThirdParty {
  name: string;
  phoneE164: string;
  email: string | null;
}

/**
 * Quien coordina el viaje. Hoy la app solo usa `thirdParty` (arriba) y
 * `trackingUrl` en `Trip`; esto viaja para el chat (ticket aparte), sin uso
 * todavia.
 */
export interface TripCoordinator {
  coordinatorUserId: string;
  coordinatorRole: 'passenger' | 'requester';
  passengerUserId: string;
  isThirdPartyTrip: boolean;
  thirdParty: { name: string; phoneE164: string } | null;
}

export interface Trip {
  id: string;
  /** Codigo corto que ve el pasajero, por ejemplo `TB-8F3K2A`. */
  publicCode: string;
  status: TripStatus;
  paymentMethod: string;
  driverId: string | null;
  /** Tarifa lista para mostrar (`$ 18.500`); `null` si todavia no hay una confirmada. */
  formattedFare: string | null;
  /** `null` con un backend que todavia no los devuelve. */
  pickup: TripPoint | null;
  dropoff: TripPoint | null;
  /** `null` mientras no hay chofer asignado. */
  driver: TripDriver | null;
  vehicle: TripVehicle | null;
  /** Lo que se cobro al finalizar, listo para mostrar; `null` hasta que termina. */
  formattedFinalFare: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Cuando `status` es `cancelled`; `null` en cualquier otro caso. */
  cancelledAt: Date | null;
  /** Motivo en snake_case (`passenger_cancelled`...); `null` si no hay uno o el viaje no se cancelo. */
  cancellationReasonCode: string | null;
  /** Distancia de la ruta cotizada, en km. */
  distanceKm: number | null;
  paymentStatus: PaymentStatus | null;
  /** Estrellas que dejo el pasajero; `null` mientras no califico. */
  ratingGiven: number | null;
  /** Invitado que viaja; `null` si el titular viaja. */
  thirdParty: TripThirdParty | null;
  /** Link de seguimiento para compartir con el invitado; solo lo trae el titular que pidio el viaje. */
  trackingUrl: string | null;
  /** Info de coordinacion (para el chat, ticket aparte); `null` con un backend que todavia no la manda. */
  coordinator: TripCoordinator | null;
  /** Categoria elegida al confirmar; `null` con un backend que todavia no la manda. */
  serviceType: { code: string; name: string } | null;
  /** Desglose de la cotizacion confirmada; `null` con un backend que todavia no lo manda. */
  fareBreakdown: FareBreakdown | null;
}

/** Un renglon del desglose, con el importe crudo (para comparar) y el listo para mostrar. */
export interface FareBreakdownItem {
  amount: number;
  formattedAmount: string;
}

export interface FareBreakdown {
  base: FareBreakdownItem;
  distance: FareBreakdownItem;
  time: FareBreakdownItem;
  /** Importe descontado; se muestra solo cuando es mayor a cero. */
  discount: FareBreakdownItem;
  /** Cargos adicionales; se muestra solo cuando es mayor a cero. */
  fees: FareBreakdownItem;
  total: FareBreakdownItem;
  currency: string;
}

/** Filtro de la pestaña "Viajes"; sin filtro el backend trae todo lo no-borrador. */
export type TripHistoryFilter = 'all' | 'completed' | 'cancelled';

/** Un renglon del historial, la vista liviana de `GET /rides`. */
export interface TripHistoryItem {
  id: string;
  publicCode: string;
  status: TripStatus;
  /** Cuando se pidio el viaje: sirve para ordenar y mostrar, tanto si termino como si sigue en curso. */
  date: Date;
  origin: string | null;
  destination: string | null;
  /** `final_fare` y, si todavia no hay, `estimated_fare`; `null` sin ninguno de los dos. */
  formattedFare: string | null;
  serviceCode: string | null;
  serviceName: string | null;
  isThirdParty: boolean;
  thirdPartyName: string | null;
  rated: boolean;
}

export interface TripHistoryPage {
  items: TripHistoryItem[];
  page: number;
  totalPages: number;
  total: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'charged_back';

/** Motivos que se pueden marcar junto a las estrellas. */
export type RatingTag = 'punctuality' | 'smooth_driving' | 'clean_vehicle';

export interface TripRatingInput {
  stars: number;
  tags: RatingTag[];
}

/** Estados en los que el viaje ya no cambia: no hay nada que seguir en vivo. */
export const FINISHED_TRIP_STATUSES: readonly TripStatus[] = ['completed', 'cancelled'];
