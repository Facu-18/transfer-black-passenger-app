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

export interface ConfirmTripRequest {
  fare_quote_id: string;
  payment: { type: PaymentTypeRequest };
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
  estimated_distance_meters?: number;
  payment_status?: PaymentStatusResponse | null;
  rating?: { rating: number; created_at: string } | null;
}

export type PaymentStatusResponse = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'charged_back';

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
