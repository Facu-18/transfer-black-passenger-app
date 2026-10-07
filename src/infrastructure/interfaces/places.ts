// Modelos de lugares que usa la app, independientes del proveedor de mapas.
// Las pantallas y el store solo conocen estos tipos: cambiar de proveedor es
// escribir otro `PlacesProvider`, sin tocar nada de presentacion.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  /**
   * Identificador del lugar en el proveedor. Viaja tal cual a `POST /rides/quote`
   * (`place_id`), asi que tiene que ser del mismo proveedor que usa el backend.
   */
  placeId: string;
  /** Linea principal: calle y altura, o el nombre del lugar. */
  name: string;
  /** Linea secundaria: barrio, ciudad. Puede venir vacia. */
  detail: string;
  /** Direccion completa en una linea: es el `address_text` de la cotizacion. */
  address: string;
  coordinates: Coordinates;
}

/**
 * Sugerencia del autocompletado: no trae coordenadas (Google no las da hasta
 * pedir el detalle). Elegirla requiere resolver `PlacesProvider.getPlaceDetails`
 * antes de poder usarla como origen o destino.
 */
export interface PlaceSuggestion {
  placeId: string;
  /** Linea principal: calle y altura, o el nombre del lugar. */
  primaryText: string;
  /** Linea secundaria: barrio, ciudad. Puede venir vacia. */
  secondaryText: string;
  /** Direccion completa en una linea. */
  description: string;
}

export interface PlaceSearchOptions {
  /** Prioriza resultados cerca de este punto, sin excluir los lejanos. */
  near?: Coordinates | null;
  /** Agrupa todas las teclas de una misma busqueda bajo una sola sesion de Places. */
  sessionToken?: string;
  signal?: AbortSignal;
}

export interface PlacesProvider {
  /** Sugerencias mientras el usuario escribe; sin coordenadas. */
  autocomplete(text: string, options?: PlaceSearchOptions): Promise<PlaceSuggestion[]>;
  /**
   * Resuelve las coordenadas de una sugerencia elegida y cierra la sesion de
   * autocompletado que la trajo.
   */
  getPlaceDetails(
    suggestion: PlaceSuggestion,
    sessionToken: string,
    options?: { signal?: AbortSignal },
  ): Promise<Place>;
  /** El lugar mas cercano a unas coordenadas; `null` si el proveedor no encuentra ninguno. */
  reverseGeocode(coordinates: Coordinates, options?: { signal?: AbortSignal }): Promise<Place | null>;
}
