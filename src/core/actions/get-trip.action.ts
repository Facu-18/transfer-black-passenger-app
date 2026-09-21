import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { Trip } from '@/infrastructure/interfaces/trips';
import type { TripDetailResponse } from '@/infrastructure/interfaces/trips-api';
import { TripQuoteMapper } from '@/infrastructure/mappers/trip-quote.mapper';

/**
 * Estado actual del viaje, con origen, destino y, si ya hay, chofer y auto.
 *
 * Es la fuente de verdad del viaje activo: el socket solo avisa que algo
 * cambio y la pantalla vuelve a consultar aca.
 */
export async function getTripAction(tripId: string): Promise<Trip> {
  const { data } = await transferBlackApi.get<ApiDataResponse<TripDetailResponse>>(`/rides/${tripId}`);

  return TripQuoteMapper.toTrip(data.data);
}
