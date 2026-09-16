import type { GeoapifyResult } from '../interfaces/geoapify-api';
import type { Place } from '../interfaces/places';

export const GeoapifyPlaceMapper = {
  toPlace(result: GeoapifyResult): Place {
    const name = result.address_line1 || result.name || result.formatted;

    return {
      placeId: result.place_id,
      name,
      detail: result.address_line2 ?? '',
      address: result.formatted,
      coordinates: { latitude: result.lat, longitude: result.lon },
    };
  },
};
