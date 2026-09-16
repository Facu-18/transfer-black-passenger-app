import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Place } from '@/infrastructure/interfaces/places';
import type { RideQuote } from '@/infrastructure/interfaces/trips';
import type { RideQuoteRequest, RideQuoteResponse, RoutePointRequest } from '@/infrastructure/interfaces/trips-api';
import { TripQuoteMapper } from '@/infrastructure/mappers/trip-quote.mapper';

function toRoutePoint(place: Place): RoutePointRequest {
  return {
    address_text: place.address,
    place_id: place.placeId,
    latitude: place.coordinates.latitude,
    longitude: place.coordinates.longitude,
  };
}

/**
 * Cotiza el viaje y crea el borrador (`draft`).
 *
 * El `placeId` viaja tal cual: tiene que ser del mismo proveedor de mapas que
 * usa el backend. La respuesta trae el trazado de la ruta ya calculado, asi que
 * la app no vuelve a pedirlo por su cuenta.
 *
 * Errores que interesan a la pantalla: 400 (no se pudo calcular la ruta),
 * 403 (correo sin verificar) y 401 (sesion vencida).
 */
export async function quoteRideAction(origin: Place, destination: Place): Promise<RideQuote> {
  const body: RideQuoteRequest = {
    origin: toRoutePoint(origin),
    destination: toRoutePoint(destination),
  };

  const { data } = await transferBlackApi.post<ApiDataResponse<RideQuoteResponse>>('/rides/quote', body);

  return TripQuoteMapper.toRideQuote(data.data);
}
