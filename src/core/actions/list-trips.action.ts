import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { TripHistoryFilter, TripHistoryPage } from '@/infrastructure/interfaces/trips';
import type { TripListResponse } from '@/infrastructure/interfaces/trips-api';
import { TripHistoryMapper } from '@/infrastructure/mappers/trip-history.mapper';

/** El backend solo entiende `completed` y `cancelled`: "Todos" no manda `status`. */
const STATUS_BY_FILTER: Partial<Record<TripHistoryFilter, string>> = {
  completed: 'completed',
  cancelled: 'cancelled',
};

export interface ListTripsParams {
  page: number;
  limit: number;
  filter: TripHistoryFilter;
}

/**
 * Historial paginado del pasajero (solicitante o pasajero, sin borradores).
 *
 * Sin filtro trae todo lo no-borrador, incluidos los viajes en curso: por eso
 * "Todos" puede mostrar algo mas arriba de lo que se pidio.
 */
export async function listTripsAction({ page, limit, filter }: ListTripsParams): Promise<TripHistoryPage> {
  const status = STATUS_BY_FILTER[filter];

  const { data } = await transferBlackApi.get<ApiDataResponse<TripListResponse>>('/rides', {
    params: { page, limit, ...(status ? { status } : {}) },
  });

  return TripHistoryMapper.toPage(data.data);
}
