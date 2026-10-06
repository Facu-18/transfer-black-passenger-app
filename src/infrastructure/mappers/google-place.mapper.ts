import type { PlaceDetailsResponse, PlaceReverseResponse, PlaceSuggestionResponse } from '../interfaces/places-api';
import type { Place, PlaceSuggestion } from '../interfaces/places';

export const GooglePlaceMapper = {
  toSuggestion(result: PlaceSuggestionResponse): PlaceSuggestion {
    return {
      placeId: result.place_id,
      primaryText: result.primary_text,
      secondaryText: result.secondary_text,
      description: result.description,
    };
  },

  /**
   * Los details solo agregan coordenadas: el nombre y el detalle que se
   * muestran son los de la sugerencia que el usuario ya vio y tocó (Google no
   * repite esa separacion en el detalle, solo manda `address` entera).
   */
  toPlaceFromSuggestion(suggestion: PlaceSuggestion, details: PlaceDetailsResponse): Place {
    return {
      placeId: details.place_id,
      name: suggestion.primaryText,
      detail: suggestion.secondaryText,
      address: details.address,
      coordinates: { latitude: details.lat, longitude: details.lng },
    };
  },

  /**
   * Geocodificacion inversa (ubicacion actual): no hay una sugerencia previa
   * que separe nombre y detalle, asi que se parte `address` por la primera
   * coma ("Colón 1200, Nueva Córdoba" -> "Colón 1200" / "Nueva Córdoba").
   *
   * `place_id` puede venir `null` (Google no siempre asocia un lugar estable a
   * unas coordenadas): como la cotizacion exige un `place_id` no vacío, se usa
   * uno sintetico con las propias coordenadas, que no se vuelve a resolver
   * contra el proveedor.
   */
  toPlaceFromAddress(result: PlaceReverseResponse): Place {
    const [name, ...rest] = result.address.split(',');
    const detail = rest.join(',').trim();

    return {
      placeId: result.place_id ?? `coords:${result.lat.toFixed(6)},${result.lng.toFixed(6)}`,
      name: name.trim() || result.address,
      detail,
      address: result.address,
      coordinates: { latitude: result.lat, longitude: result.lng },
    };
  },
};
