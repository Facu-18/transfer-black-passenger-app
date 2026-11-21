import { transferBlackApi } from '@/core/api/transfer-black-api';

/** El backend deja de mandar cambios del viaje a los seguimientos de este pasajero. */
export async function unregisterLiveActivityAction(tripId: string): Promise<void> {
  await transferBlackApi.delete(`/rides/${tripId}/live-activity`);
}
