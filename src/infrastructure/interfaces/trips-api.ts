// Contratos de `/api/v1/rides` tal como los devuelve el backend (snake_case).
// Los importes viajan como texto para no perder centavos en un `number`.

export interface RouteGeometryResponse {
  type: 'MultiLineString';
  /** Cada punto es `[longitud, latitud]`, al reves que en React Native Maps. */
  coordinates: number[][][];
}

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
    geometry: RouteGeometryResponse;
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

/** `voucher` tambien existe en el backend, pero la app todavia no lo ofrece. */
export type PaymentTypeRequest = 'account_money' | 'cash';

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
  /** Codigo en snake_case; la penalidad todavia no esta implementada en el backend. */
  reason_code: string;
  notes?: string;
}

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
