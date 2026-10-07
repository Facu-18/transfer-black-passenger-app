import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import type { TripListItemResponse, TripListResponse } from '@/infrastructure/interfaces/trips-api';
import { TripHistoryMapper } from '@/infrastructure/mappers/trip-history.mapper';

/**
 * Un viaje inmediato ya confirmado: hay chofer buscandose, en camino, o el
 * viaje esta en curso. Siempre se puede retomar. `scheduled` (reservado sin
 * activar) queda afuera: eso lo muestra la tarjeta de "Proximo viaje" del
 * Home, no el seguimiento en vivo.
 */
const ACTIVE_TRIP_STATUSES = new Set(['searching', 'assigned', 'driver_arriving', 'driver_arrived', 'in_progress']);

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

  const best = pickResumable(data.data.trips);
  return best ? TripHistoryMapper.toItems([best])[0] : null;
}

/**
 * No deberia haber mas de un viaje inmediato activo a la vez (el despacho
 * deja al pasajero `in_trip`), pero si lo hubiera no alcanza con el primero
 * que mande el backend: se prioriza el que ya esta confirmado (chofer
 * buscandose o viaje en curso) por sobre un simple borrador, y entre
 * iguales el mas reciente. Un `draft` sin `payment_method` es solo una
 * cotizacion abandonada antes de confirmar pago (`POST /rides/quote` ya crea
 * uno): no hay nada ahi que retomar, y no deberia secuestrar el arranque de
 * la app.
 */
function pickResumable(trips: TripListItemResponse[]): TripListItemResponse | null {
  const candidates = trips.filter(
    (trip) => ACTIVE_TRIP_STATUSES.has(trip.status) || (trip.status === 'draft' && trip.payment_method !== null),
  );

  return [...candidates].sort(byResumePriority)[0] ?? null;
}

function byResumePriority(a: TripListItemResponse, b: TripListItemResponse): number {
  const rank = (trip: TripListItemResponse) => (trip.status === 'draft' ? 1 : 0);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
