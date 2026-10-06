// Respuestas de `/places/*` tal como las devuelve el backend (snake_case), ya
// resueltas contra Google del lado del servidor: la app nunca llama a Google
// directamente, asi que esto no es el contrato de Google sino el propio.

/** Una sugerencia de autocompletado. No trae coordenadas: para eso esta Place Details. */
export interface PlaceSuggestionResponse {
  place_id: string;
  primary_text: string;
  secondary_text: string;
  description: string;
}

/** `place_id` es el mismo id space que usa la cotizacion de viajes. */
export interface PlaceDetailsResponse {
  place_id: string;
  address: string;
  lat: number;
  lng: number;
}

/** `place_id` puede ser `null`: la geocodificacion inversa no siempre encuentra un lugar para esas coordenadas. */
export interface PlaceReverseResponse {
  place_id: string | null;
  address: string;
  lat: number;
  lng: number;
}
