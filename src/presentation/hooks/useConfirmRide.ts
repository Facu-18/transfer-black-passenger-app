import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { confirmRideAction } from '@/core/actions/confirm-ride.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { newIdempotencyKey } from '@/core/api/idempotency';
import type { FareOption, PaymentMethod, RideQuote } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

interface UseConfirmRideOptions {
  quote: RideQuote | null;
  selectedFare: FareOption | null;
  /** Se llama cuando la tarifa vencio y hay que cotizar de nuevo. */
  onQuoteExpired: () => void;
}

export function useConfirmRide({ quote, selectedFare, onQuoteExpired }: UseConfirmRideOptions) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('account_money');
  const [isConfirming, setIsConfirming] = useState(false);

  // Una clave por borrador: mientras sea el mismo viaje, reintentar no duplica el cobro.
  const idempotencyKey = useRef(newIdempotencyKey());
  const keyOwnerTripId = useRef(quote?.tripId ?? null);

  useEffect(() => {
    if (quote && keyOwnerTripId.current !== quote.tripId) {
      keyOwnerTripId.current = quote.tripId;
      idempotencyKey.current = newIdempotencyKey();
    }
  }, [quote]);

  const confirm = async () => {
    if (!quote || !selectedFare || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const trip = await confirmRideAction({
        tripId: quote.tripId,
        fareQuoteId: selectedFare.id,
        paymentMethod,
        idempotencyKey: idempotencyKey.current,
      });

      // El `tripId` viaja a la pantalla de espera: es lo que le permite consultar
      // el estado real. Con efectivo el viaje ya esta en `searching`; con Mercado
      // Pago queda en `draft` hasta que se acredite el pago, y eso lo avisa el
      // webhook al backend, no la respuesta de esta confirmacion.
      if (trip.checkoutUrl) {
        await WebBrowser.openBrowserAsync(trip.checkoutUrl);
        router.replace({ pathname: '/searching', params: { tripId: trip.tripId, paymentPending: '1' } });
        return;
      }

      router.replace({ pathname: '/searching', params: { tripId: trip.tripId } });
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }

        if (error.code === 'FARE_QUOTE_EXPIRED') {
          Alert.alert('La tarifa venció', 'Estamos calculando el precio otra vez.', [{ text: 'Entendido' }]);
          onQuoteExpired();
          return;
        }

        if (error.code === 'INVALID_TRIP_TRANSITION') {
          Alert.alert('Este viaje ya no se puede confirmar', 'Volvé a pedirlo desde el inicio.', [
            { text: 'Entendido', onPress: () => router.replace('/home') },
          ]);
          return;
        }
      }

      Alert.alert('No pudimos confirmar el viaje', getApiErrorMessage(error, 'Intentá de nuevo en unos segundos.'), [
        { text: 'Entendido' },
      ]);
    } finally {
      setIsConfirming(false);
    }
  };

  return { paymentMethod, setPaymentMethod, confirm, isConfirming };
}
