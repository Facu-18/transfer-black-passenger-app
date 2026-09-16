// Modelos de lugares que usa la app, independientes del proveedor de mapas.
// Las pantallas y el store solo conocen estos tipos: cambiar Geoapify por Google
// Maps es escribir otro `PlacesProvider`, sin tocar nada de presentacion.

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

export interface PlaceSearchOptions {
  /** Prioriza resultados cerca de este punto, sin excluir los lejanos. */
  near?: Coordinates | null;
  signal?: AbortSignal;
}

export interface PlacesProvider {
  /** Sugerencias mientras el usuario escribe. */
  autocomplete(text: string, options?: PlaceSearchOptions): Promise<Place[]>;
  /** El lugar mas cercano a unas coordenadas; `null` si el proveedor no encuentra ninguno. */
  reverseGeocode(coordinates: Coordinates, options?: { signal?: AbortSignal }): Promise<Place | null>;
}
