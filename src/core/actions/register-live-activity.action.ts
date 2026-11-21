import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { RegisterLiveActivityRequest } from '@/infrastructure/interfaces/live-activity-api';

/** Responde 204; es idempotente por token (se puede repetir si el token cambia). */
export async function registerLiveActivityAction(tripId: string, body: RegisterLiveActivityRequest): Promise<void> {
  await transferBlackApi.put(`/rides/${tripId}/live-activity`, body);
}
