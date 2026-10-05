import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { cancelTripAction } from '@/core/actions/cancel-trip.action';
import { getCancellationPreviewAction } from '@/core/actions/get-cancellation-preview.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { buildCancelConfirmationMessage, buildCancelledRefundMessage } from '@/presentation/utils/cancellation-copy';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

interface UseCancelTripOptions {
  /** Relee el viaje cuando el backend dice que ya no se puede cancelar. */
  onRefresh: () => void;
}

/** Cancelacion del pasajero, con vista previa de la politica y confirmacion. */
export function useCancelTrip(tripId: string | null, { onRefresh }: UseCancelTripOptions) {
  const [isCancelling, setIsCancelling] = useState(false);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const cancel = async () => {
    if (!tripId || isCancelling) return;

    setIsCancelling(true);

    try {
      const result = await cancelTripAction(tripId);
      resetTrip();

      const refundMessage = buildCancelledRefundMessage(result);
      if (refundMessage) {
        Alert.alert('Viaje cancelado', refundMessage, [
          { text: 'Entendido', onPress: () => router.dismissTo('/home') },
        ]);
      } else {
        router.dismissTo('/home');
      }
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }

        if (error.code === 'TRIP_CANNOT_BE_CANCELLED') {
          Alert.alert('Ya no se puede cancelar', 'El viaje avanzó mientras lo cancelabas.', [
            { text: 'Entendido', onPress: onRefresh },
          ]);
          return;
        }
      }

      Alert.alert('No pudimos cancelar el viaje', getApiErrorMessage(error, 'Intentá de nuevo en unos segundos.'), [
        { text: 'Entendido' },
      ]);
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Sin chofer se cancela la busqueda; con chofer asignado, el viaje. Antes de
   * confirmar se consulta la vista previa de la politica, para avisar la
   * penalidad y el reembolso reales; si la consulta falla, se sigue con el
   * texto de siempre (no se bloquea la cancelacion por eso).
   */
  const requestCancel = async (hasDriver: boolean) => {
    if (!tripId || isCancelling) return;

    setIsCancelling(true);
    let preview = null;
    try {
      preview = await getCancellationPreviewAction(tripId);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setIsCancelling(false);
        handleExpiredSession();
        return;
      }
      // Sin vista previa se sigue con el texto generico; no es un error fatal.
    }
    setIsCancelling(false);

    Alert.alert(
      hasDriver ? '¿Cancelar el viaje?' : '¿Cancelar la búsqueda?',
      buildCancelConfirmationMessage(hasDriver, preview),
      [
        { text: 'Seguir esperando', style: 'cancel' },
        { text: 'Cancelar', style: 'destructive', onPress: () => void cancel() },
      ],
    );
  };

  return { requestCancel, isCancelling };
}
