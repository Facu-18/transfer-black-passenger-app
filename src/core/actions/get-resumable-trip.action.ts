import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import type { TripListResponse } from '@/infrastructure/interfaces/trips-api';
import { TripHistoryMapper } from '@/infrastructure/mappers/trip-history.mapper';

/**
 * Estados de un viaje inmediato que todavia se puede retomar en la pantalla de
 * seguimiento en vivo. `scheduled` (reservado sin activar) queda afuera: eso
 * lo muestra la tarjeta de "Proximo viaje" del Home, no el seguimiento en vivo.
 */
const RESUMABLE_STATUSES = new Set([
  'draft',
  'searching',
  'assigned',
  'driver_arriving',
  'driver_arrived',
  'in_progress',
]);

/**
 * Viaje para retomar al abrir la app (restauracion de sesion): un viaje
 * inmediato en curso, o un borrador todavia esperando que se acredite el
 * pago de Mercado Pago. Usa el alias `status=active` (todo lo que no sea
 * `completed` ni `cancelled`) porque el listado sin filtro excluye los
 * borradores.
 */
export async function getResumableTripAction(): Promise<TripHistoryItem | null> {
  const { data } = await transferBlackApi.get<ApiDataResponse<TripListResponse>>('/rides', {
    params: { status: 'active', page: 1, limit: 10 },
  });

  const items = TripHistoryMapper.toItems(data.data.trips);

  return items.find((item) => RESUMABLE_STATUSES.has(item.status)) ?? null;
}
