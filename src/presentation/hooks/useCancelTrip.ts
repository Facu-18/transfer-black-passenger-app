import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { cancelTripAction } from '@/core/actions/cancel-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

interface UseCancelTripOptions {
  /** Relee el viaje cuando el backend dice que ya no se puede cancelar. */
  onRefresh: () => void;
}

/** Cancelacion del pasajero, con confirmacion previa. */
export function useCancelTrip(tripId: string | null, { onRefresh }: UseCancelTripOptions) {
  const [isCancelling, setIsCancelling] = useState(false);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const cancel = async () => {
    if (!tripId || isCancelling) return;

    setIsCancelling(true);

    try {
      await cancelTripAction(tripId);
      resetTrip();
      router.dismissTo('/home');
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

  /** Sin chofer se cancela la busqueda; con chofer asignado, el viaje. */
  const requestCancel = (hasDriver: boolean) => {
    Alert.alert(
      hasDriver ? '¿Cancelar el viaje?' : '¿Cancelar la búsqueda?',
      hasDriver
        ? 'Tu chofer ya está en camino. Si cancelás, queda libre para otro viaje.'
        : 'Dejamos de buscar un chofer para este viaje.',
      [
        { text: 'Seguir esperando', style: 'cancel' },
        { text: 'Cancelar', style: 'destructive', onPress: () => void cancel() },
      ],
    );
  };

  return { requestCancel, isCancelling };
}
