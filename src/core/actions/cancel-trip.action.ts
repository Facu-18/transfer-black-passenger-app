import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { CancelTripRequest } from '@/infrastructure/interfaces/trips-api';

/** Motivo que registra el backend cuando cancela el pasajero desde la app. */
const PASSENGER_CANCEL_REASON = 'passenger_cancelled';

/**
 * Cancela el viaje. Repetirla sobre un viaje ya cancelado no falla: el backend
 * devuelve el viaje tal como quedo.
 */
export async function cancelTripAction(tripId: string): Promise<void> {
  const body: CancelTripRequest = { reason_code: PASSENGER_CANCEL_REASON };

  await transferBlackApi.post(`/rides/${tripId}/cancel`, body);
}
