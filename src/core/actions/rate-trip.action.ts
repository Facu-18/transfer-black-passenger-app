import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { TripRatingInput } from '@/infrastructure/interfaces/trips';
import type { RateTripRequest } from '@/infrastructure/interfaces/trips-api';

/**
 * Califica al chofer de un viaje completado. Una sola vez por viaje: repetirla
 * responde 409 `RATING_ALREADY_EXISTS`.
 */
export async function rateTripAction(tripId: string, input: TripRatingInput): Promise<void> {
  const body: RateTripRequest = {
    rating: input.stars,
    ...(input.tags.length > 0 ? { tags: input.tags } : {}),
  };

  await transferBlackApi.post(`/rides/${tripId}/ratings`, body);
}
