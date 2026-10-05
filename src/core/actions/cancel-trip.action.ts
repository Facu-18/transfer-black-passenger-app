import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { CancellationResult } from '@/infrastructure/interfaces/trips';
import type { CancelTripRequest, TripCancelResponse } from '@/infrastructure/interfaces/trips-api';
import { CancellationMapper } from '@/infrastructure/mappers/cancellation.mapper';

/** Motivo que registra el backend cuando cancela el pasajero desde la app. */
const PASSENGER_CANCEL_REASON = 'passenger_cancelled';

/**
 * Cancela el viaje. Repetirla sobre un viaje ya cancelado no falla (el backend
 * devuelve el viaje tal como quedo, con `cancellation: null`): en ese caso
 * devuelve `null`, porque no hay nada nuevo que informar sobre el reembolso.
 */
export async function cancelTripAction(tripId: string): Promise<CancellationResult | null> {
  const body: CancelTripRequest = { reason_code: PASSENGER_CANCEL_REASON };

  const { data } = await transferBlackApi.post<ApiDataResponse<TripCancelResponse>>(`/rides/${tripId}/cancel`, body);

  return CancellationMapper.toResult(data.data.cancellation, data.data.currency);
}
