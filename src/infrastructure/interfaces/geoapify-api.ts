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
