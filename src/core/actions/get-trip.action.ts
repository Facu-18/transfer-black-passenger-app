import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Trip } from '@/infrastructure/interfaces/trips';
import type { TripResponse } from '@/infrastructure/interfaces/trips-api';
import { TripQuoteMapper } from '@/infrastructure/mappers/trip-quote.mapper';

/**
 * Estado actual del viaje.
 *
 * Lo consulta la pantalla de busqueda: al pagar con Mercado Pago el viaje sale
 * de `draft` recien cuando se acredita el pago, y ese aviso le llega al backend
 * por webhook, no a la app.
 */
export async function getTripAction(tripId: string): Promise<Trip> {
  const { data } = await transferBlackApi.get<ApiDataResponse<TripResponse>>(`/rides/${tripId}`);

  return TripQuoteMapper.toTrip(data.data);
}
