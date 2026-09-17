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
  estimated_fare: string;
  currency: string;
  driver_id: string | null;
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
