// Respuestas de la API de Geoapify con `format=json`. Solo los campos que se usan.
// https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/

export interface GeoapifyResult {
  place_id: string;
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  name?: string;
  lat: number;
  lon: number;
  result_type?: string;
}

export interface GeoapifyResultsResponse {
  results: GeoapifyResult[];
}

// Respuesta de la API de rutas con `format=geojson`.
// https://apidocs.geoapify.com/docs/routing/

export interface GeoapifyRoutingResponse {
  features: Array<{
    properties: { distance: number; time: number };
    /** Cada punto es `[longitud, latitud]`. */
    geometry: { type: 'MultiLineString'; coordinates: number[][][] };
  }>;
}
