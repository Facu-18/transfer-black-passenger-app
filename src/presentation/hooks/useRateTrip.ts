import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert } from 'react-native';

import { rateTripAction } from '@/core/actions/rate-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { RatingTag } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

interface UseRateTripOptions {
  /** Se llama cuando la calificacion quedo guardada (o ya lo estaba). */
  onRated: () => void;
}

/**
 * Estado y envio de la calificacion. Arranca en 0 estrellas: no se puede
 * enviar hasta elegir al menos una.
 */
export function useRateTrip(tripId: string | null, { onRated }: UseRateTripOptions) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<RatingTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: RatingTag) =>
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));

  const selectStars = (value: number) => {
    void Haptics.selectionAsync();
    setStars(value);
  };

  const submit = async () => {
    if (!tripId || stars === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await rateTripAction(tripId, { stars, tags });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRated();
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }

        // Ya estaba calificado (por ejemplo, un reintento despues de un corte):
        // para el pasajero el resultado es el mismo.
        if (error.code === 'RATING_ALREADY_EXISTS') {
          onRated();
          return;
        }
      }

      Alert.alert('No pudimos enviar tu calificación', getApiErrorMessage(error, 'Intentá de nuevo en unos segundos.'), [
        { text: 'Entendido' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { stars, selectStars, tags, toggleTag, submit, isSubmitting };
}
