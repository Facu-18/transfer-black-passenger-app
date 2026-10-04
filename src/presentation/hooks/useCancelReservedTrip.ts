import { useState } from 'react';
import { Alert } from 'react-native';

import { cancelTripAction } from '@/core/actions/cancel-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/** El backend bloquea asi la cancelacion de un reservado ya pago: la gestiona la agencia. */
const AGENCY_CANCEL_CODE = 'SCHEDULED_TRIP_CANCEL_VIA_AGENCY';

interface UseCancelReservedTripOptions {
  /** Relee el viaje despues de un intento (por si realmente se cancelo). */
  onCancelled: () => void;
}

/**
 * Cancelacion de un viaje reservado desde su detalle. A diferencia de un viaje
 * activo, uno reservado ya pago no se puede cancelar desde la app: el backend
 * responde `SCHEDULED_TRIP_CANCEL_VIA_AGENCY` y hay que avisarle a la agencia
 * por WhatsApp (el reembolso, si corresponde, lo maneja ella).
 */
export function useCancelReservedTrip(tripId: string | null, { onCancelled }: UseCancelReservedTripOptions) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [needsAgencyContact, setNeedsAgencyContact] = useState(false);

  const cancel = async () => {
    if (!tripId || isCancelling) return;

    setIsCancelling(true);
    setNeedsAgencyContact(false);

    try {
      await cancelTripAction(tripId);
      onCancelled();
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }
        if (error.code === AGENCY_CANCEL_CODE) {
          setNeedsAgencyContact(true);
          return;
        }
      }

      Alert.alert(
        'No pudimos cancelar la reserva',
        getApiErrorMessage(error, 'Intentá de nuevo en unos segundos.'),
        [{ text: 'Entendido' }],
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const requestCancel = () => {
    Alert.alert('¿Cancelar la reserva?', 'Vas a cancelar este viaje reservado.', [
      { text: 'Seguir con la reserva', style: 'cancel' },
      { text: 'Cancelar reserva', style: 'destructive', onPress: () => void cancel() },
    ]);
  };

  return { requestCancel, isCancelling, needsAgencyContact };
}
