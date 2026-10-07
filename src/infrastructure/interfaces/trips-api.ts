// Contratos de `/api/v1/rides` tal como los devuelve el backend (snake_case).
// Los importes viajan como texto para no perder centavos en un `number`.

export interface RideQuoteResponse {
  draft: {
    /** Es el `tripId` de `POST /rides/{tripId}/confirm`. */
    id: string;
    public_code: string;
    status: 'draft';
    expires_at: string;
  };
  route: {
    provider: string;
    distance_meters: number;
    distance_km: number;
    duration_seconds: number;
    duration_minutes: number;
    /** Recorrido codificado (algoritmo de polyline de Google): la app lo dibuja sin pedirlo aparte. */
    polyline: string;
  };
  quotes: Array<{
    /** Es el `fare_quote_id` de la confirmacion. */
    id: string;
    service_type: { code: string; name: string };
    pricing: { total_amount: string };
    currency: string;
    expires_at: string;
  }>;
  attribution: { text: string; url: string };
}

export interface RideQuoteRequest {
  origin: RoutePointRequest;
  destination: RoutePointRequest;
}

export interface RoutePointRequest {
  address_text: string;
  /** Del mismo proveedor de mapas que usa el backend. */
  place_id: string;
  latitude: number;
  longitude: number;
}

/** `voucher` tambien existe en el backend, pero la app no lo ofrece: la cuenta corriente corporativa lo reemplaza. */
export type PaymentTypeRequest = 'account_money' | 'cash' | 'corporate';

/** Invitado que viaja, para `POST /rides/{tripId}/confirm`. Sin invitado, viaja el titular. */
export interface ThirdPartyRequest {
  name: string;
  phone_e164: string;
  /** Se omite (no se manda vacio) cuando el titular no cargo un email. */
  email?: string;
}

export interface ConfirmTripRequest {
  fare_quote_id: string;
  payment: { type: PaymentTypeRequest };
  third_party?: ThirdPartyRequest;
  /** Si es `true`, el conductor debe validar un PIN antes de iniciar el viaje. */
  require_pin?: boolean;
}

/** Viaje tal como lo devuelven `GET /rides/{tripId}` y la confirmacion. */
export interface TripResponse {
  id: string;
  public_code: string;
  status: string;
  payment_method: string;
  estimated_fare: string | null;
  currency: string;
  driver_id: string | null;
  /** Ausente cuando la app consume una version anterior del backend. */
  require_pin?: boolean;
  /** Solo se expone al pasajero/solicitante; para el conductor siempre es `null`. */
  boarding_pin?: string | null;
}

export interface TripStopPointResponse {
  address: string;
  place_id: string;
  latitude: number;
  longitude: number;
}

/**
 * `GET /rides/{tripId}`: el viaje con origen, destino, chofer y auto. Los cuatro
 * son opcionales para no romper contra un backend anterior que no los manda.
 */
export interface TripDetailResponse extends TripResponse {
  pickup?: TripStopPointResponse | null;
  dropoff?: TripStopPointResponse | null;
  driver?: {
    first_name: string;
    last_initial: string | null;
    avatar_url: string | null;
    rating_average: number;
    rating_count: number;
  } | null;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
    color: string;
  } | null;
  /** `scheduled` es un viaje reservado con fecha y hora fijas. Ausente en un backend anterior. */
  booking_type?: 'immediate' | 'scheduled';
  /** Hora de retiro pedida. `null` en un viaje inmediato. */
  scheduled_at?: string | null;
  /** Cuando se acredito el cobro por adelantado de un reservado. `null` en uno inmediato o sin cobrar. */
  prepaid_at?: string | null;
  /**
   * Chofer que la agencia reservo (viajes reservados), mientras el viaje
   * todavia no se activo. `null` en un viaje inmediato, en uno reservado sin
   * chofer fijo, o una vez activado (ahi ya llega por `driver`/`vehicle`).
   */
  reserved_driver?: {
    first_name: string;
    last_initial: string | null;
    avatar_url: string | null;
    rating_average: number;
    rating_count: number;
    vehicle: { plate: string; brand: string; model: string; color: string } | null;
  } | null;
  final_fare?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  /** Cuando `status` es `cancelled`. Ausente en un backend que todavia no lo manda. */
  cancelled_at?: string | null;
  /** Motivo en snake_case, por ejemplo `passenger_cancelled`. */
  cancellation_reason_code?: string | null;
  estimated_distance_meters?: number;
  payment_status?: PaymentStatusResponse | null;
  rating?: { rating: number; created_at: string } | null;
  /** Invitado que viaja; `null` si el titular viaja. Ausente en un backend que todavia no lo manda. */
  third_party?: ThirdPartyResponse | null;
  /** Link de seguimiento del invitado; solo lo trae el titular de un viaje de tercero. */
  tracking_url?: string | null;
  chat?: ChatInfoResponse | null;
  /** Categoria elegida al confirmar. Ausente en un backend que todavia no la manda. */
  service_type?: TripServiceTypeResponse | null;
  /** Desglose de la cotizacion. Ausente en un backend que todavia no lo manda. */
  fare_breakdown?: TripFareBreakdownResponse | null;
  /**
   * Reintegro en curso hacia Mercado Pago; `null` cuando no hay ninguno (el
   * pago nunca se marco para reintegrar, o el viaje no se pago con MP).
   * Ausente en un backend que todavia no lo manda.
   */
  refund?: { status: PaymentRefundStatusResponse; amount: string } | null;
}

export type PaymentStatusResponse = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'charged_back';

/** `GET /rides/{tripId}`: nombre y codigo de la categoria elegida al confirmar. */
export interface TripServiceTypeResponse {
  code: string;
  name: string;
}

/**
 * Desglose de la cotizacion que el pasajero eligio al confirmar. `total` puede
 * no coincidir con `final_fare` del viaje: `final_fare` es lo que se liquido
 * al completarlo. Importes como texto, igual que el resto del contrato.
 */
export interface TripFareBreakdownResponse {
  base: string;
  distance: string;
  time: string;
  discount: string;
  fees: string;
  total: string;
  currency: string;
}

/** Invitado que viaja, tal como lo devuelve `GET /rides/{tripId}`. */
export interface ThirdPartyResponse {
  name: string;
  phone_e164: string;
  email: string | null;
}

/** Info de coordinacion para el chat (ticket aparte); la app todavia no la usa. */
export interface ChatInfoResponse {
  coordinator_user_id: string;
  coordinator_role: 'passenger' | 'requester';
  passenger_user_id: string;
  is_third_party_trip: boolean;
  third_party: { name: string; phone_e164: string } | null;
}

/** Motivos que el backend acepta junto a las estrellas. */
export type RatingTagRequest = 'punctuality' | 'smooth_driving' | 'clean_vehicle';

export interface RateTripRequest {
  rating: number;
  comment?: string;
  tags?: RatingTagRequest[];
}

export interface CancelTripRequest {
  /** Codigo en snake_case. */
  reason_code: string;
  notes?: string;
}

/** Como se va a reintegrar, cuando corresponde: ver `cancellation-policy.ts` del backend. */
export type RefundModeResponse = 'automatic' | 'claim' | 'none';
export type RefundKindResponse = 'none' | 'full' | 'partial';

/** Como quedo la cancelacion recien hecha: solo viaja en la respuesta que efectivamente cancelo. */
export interface TripCancellationResponse {
  penalty_amount: string;
  refund_amount: string;
  refund_kind: RefundKindResponse;
  debt_amount: string;
  company_charge_amount: string;
  refund_mode: RefundModeResponse;
}

/**
 * `POST /rides/{tripId}/cancel`: la app solo tipa lo que necesita de la
 * respuesta completa (es el mismo `Trip` que devuelve el backend).
 */
export interface TripCancelResponse {
  status: string;
  currency: string;
  cancellation_reason_code: string | null;
  /** `null` al repetir la cancelacion sobre un viaje ya cancelado. */
  cancellation: TripCancellationResponse | null;
}

/** `GET /rides/{tripId}/cancellation-preview`: la politica evaluada sin ejecutarla. */
export interface CancellationPreviewResponse {
  cancellable: boolean;
  penalty_amount: string;
  refund_amount: string;
  refund_kind: RefundKindResponse;
  debt_amount: string;
  company_charge_amount: string;
  currency: string;
  refund_mode: RefundModeResponse;
  /** Fin de la ventana de reembolso automatico; `null` sin pago acreditado todavia. */
  auto_refund_window_ends_at: string | null;
}

/** Estado del reintegro hacia Mercado Pago; `claim_required` queda a cargo de un admin. */
export type PaymentRefundStatusResponse = 'pending' | 'processing' | 'processed' | 'failed' | 'claim_required';

export interface ConfirmTripResponse {
  trip: TripResponse;
  payment: {
    id: string;
    status: string;
    /** Solo con `account_money`: URL de Mercado Pago a la que hay que mandar al pasajero. */
    checkout_url: string | null;
    amount: string;
    currency: string;
  };
}

/**
 * `GET /rides`: vista liviana de un viaje para la lista del historial. El
 * detalle completo se pide aparte, con `GET /rides/{tripId}`.
 */
/** Chofer reservado en la vista liviana del historial: sin foto ni calificacion. */
export interface TripHistoryReservedDriverResponse {
  first_name: string;
  last_initial: string | null;
  vehicle: { plate: string; brand: string; model: string; color: string } | null;
}

export interface TripListItemResponse {
  id: string;
  public_code: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  cancelled_at: string | null;
  origin: { address_text: string } | null;
  destination: { address_text: string } | null;
  final_fare: string | null;
  estimated_fare: string | null;
  currency: string;
  payment_method: string | null;
  service_type: TripServiceTypeResponse | null;
  is_third_party: boolean;
  third_party_name: string | null;
  rated: boolean;
  /** `scheduled` es un viaje reservado. Ausente en un backend anterior. */
  booking_type?: 'immediate' | 'scheduled';
  /** Hora de retiro pedida. `null` en un viaje inmediato. */
  scheduled_at?: string | null;
  /** Cuando se acredito el cobro por adelantado. `null` en uno inmediato o sin cobrar. */
  prepaid_at?: string | null;
  /** Chofer reservado, mientras el viaje reservado todavia no se activo. */
  reserved_driver?: TripHistoryReservedDriverResponse | null;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TripListResponse {
  trips: TripListItemResponse[];
  pagination: PaginationResponse;
}

/** `GET /rides/upcoming`: viajes reservados del pasajero que todavia no se activaron. */
export interface TripUpcomingResponse {
  trips: TripListItemResponse[];
}
