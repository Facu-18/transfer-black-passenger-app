import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Place } from '@/infrastructure/interfaces/places';
import type { RideQuote } from '@/infrastructure/interfaces/trips';
import type { RideQuoteRequest, RideQuoteResponse, RoutePointRequest } from '@/infrastructure/interfaces/trips-api';
import { TripQuoteMapper } from '@/infrastructure/mappers/trip-quote.mapper';

/** Lo que acepta el backend como `address_text`. */
const MAX_ADDRESS_LENGTH = 500;

/**
 * "Nuevocentro Shopping, Av. Duarte Quiros 1400..." en vez de solo la
 * direccion: el backend guarda un unico texto por punto, y es lo que despues
 * ven el pasajero (recorrido, recibo), el chofer y el panel. Si la direccion
 * ya empieza con el nombre (una calle y altura), no se repite.
 */
function toAddressText(place: Place): string {
  const name = place.name.trim();
  const address = place.address.trim();
  const text = !name || address.toLowerCase().startsWith(name.toLowerCase()) ? address : `${name}, ${address}`;
  return text.slice(0, MAX_ADDRESS_LENGTH);
}

function toRoutePoint(place: Place): RoutePointRequest {
  return {
    address_text: toAddressText(place),
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
export async function quoteRideAction(origin: Place, destination: Place, stops: Place[] = []): Promise<RideQuote> {
  // Con paradas, la ruta pasa por ellas en este orden y el precio sale de esa distancia.
  const body: RideQuoteRequest = {
    origin: toRoutePoint(origin),
    ...(stops.length > 0 ? { stops: stops.map(toRoutePoint) } : {}),
    destination: toRoutePoint(destination),
  };

  const { data } = await transferBlackApi.post<ApiDataResponse<RideQuoteResponse>>('/rides/quote', body);

  return TripQuoteMapper.toRideQuote(data.data);
}
