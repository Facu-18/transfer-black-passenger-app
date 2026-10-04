import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { CancellationPreview } from '@/infrastructure/interfaces/trips';
import type { CancellationPreviewResponse } from '@/infrastructure/interfaces/trips-api';
import { CancellationMapper } from '@/infrastructure/mappers/cancellation.mapper';

/**
 * Evalua la politica de cancelacion sin ejecutarla: cuanto se penaliza, cuanto
 * se reintegra y como (`refundMode`). Es la unica fuente de verdad: los montos
 * que trae son los que `cancelTripAction` termina aplicando.
 *
 * 409 `TRIP_CANNOT_BE_CANCELLED` si el viaje ya no se puede cancelar en su
 * estado actual; se propaga para que quien llama decida que mostrar.
 */
export async function getCancellationPreviewAction(tripId: string): Promise<CancellationPreview> {
  const { data } = await transferBlackApi.get<ApiDataResponse<CancellationPreviewResponse>>(
    `/rides/${tripId}/cancellation-preview`,
  );

  return CancellationMapper.toPreview(data.data);
}
