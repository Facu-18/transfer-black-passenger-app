import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import type { TripUpcomingResponse } from '@/infrastructure/interfaces/trips-api';
import { TripHistoryMapper } from '@/infrastructure/mappers/trip-history.mapper';

/**
 * Viajes reservados del pasajero que todavia no se activaron (`GET /rides/upcoming`),
 * mas proximos primero. Es lo que muestra la tarjeta "Próximo viaje" del home;
 * una vez activado el viaje deja de aparecer aca y pasa a verse como cualquier
 * otro viaje en curso.
 */
export async function listUpcomingTripsAction(): Promise<TripHistoryItem[]> {
  const { data } = await transferBlackApi.get<ApiDataResponse<TripUpcomingResponse>>('/rides/upcoming');

  return TripHistoryMapper.toItems(data.data.trips);
}
