import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { confirmRideAction } from '@/core/actions/confirm-ride.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { newIdempotencyKey } from '@/core/api/idempotency';
import type { FareOption, PaymentMethod, RideQuote } from '@/infrastructure/interfaces/trips';
import { invalidateCorporateEligibility, useCorporateEligibility } from '@/presentation/hooks/useCorporateEligibility';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { getCorporateErrorMessage } from '@/presentation/utils/corporate-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';
import { handleIncompleteProfile } from '@/presentation/utils/incomplete-profile';

interface UseConfirmRideOptions {
  quote: RideQuote | null;
  selectedFare: FareOption | null;
  /** Se llama cuando la tarifa vencio y hay que cotizar de nuevo. */
  onQuoteExpired: () => void;
}

export function useConfirmRide({ quote, selectedFare, onQuoteExpired }: UseConfirmRideOptions) {
  const preferredPaymentMethod = useTripStore((state) => state.preferredPaymentMethod);
  // Arranca en el medio preferido (p. ej. "Viaje corporativo" del Home) o en
  // Mercado Pago, como antes de que existiera esa preferencia.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(preferredPaymentMethod ?? 'account_money');
  const [requirePin, setRequirePin] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const guestPassenger = useTripStore((state) => state.guestPassenger);

  // Misma consulta que la pastilla de pago (comparten cache): si ya sabemos
  // que no se puede viajar a cuenta corporativa, no se puede dejar ese medio
  // elegido a ciegas, aunque venga precargado desde el Home.
  const { membership: corporateMembership, isLoading: isCorporateEligibilityLoading } = useCorporateEligibility();
  const canUseCorporate = corporateMembership?.canRideOnAccount === true;

  useEffect(() => {
    if (!isCorporateEligibilityLoading && paymentMethod === 'corporate' && !canUseCorporate) {
      setPaymentMethod('account_money');
    }
  }, [isCorporateEligibilityLoading, canUseCorporate, paymentMethod]);

  // Una clave por borrador: mientras sea el mismo viaje, reintentar no duplica el cobro.
  const idempotencyKey = useRef(newIdempotencyKey());
  const keyOwnerTripId = useRef(quote?.tripId ?? null);

  useEffect(() => {
    if (quote && keyOwnerTripId.current !== quote.tripId) {
      keyOwnerTripId.current = quote.tripId;
      idempotencyKey.current = newIdempotencyKey();
    }
  }, [quote]);

  // Cambiar el invitado cambia el cuerpo de la confirmacion: con la misma
  // clave, el backend devolveria la respuesta del intento anterior.
  const keyOwnerGuest = useRef(guestPassenger);

  useEffect(() => {
    if (keyOwnerGuest.current !== guestPassenger) {
      keyOwnerGuest.current = guestPassenger;
      idempotencyKey.current = newIdempotencyKey();
    }
  }, [guestPassenger]);

  // El PIN forma parte del hash idempotente del backend. Si cambia, la siguiente
  // confirmacion necesita una clave nueva para no parecer un payload reutilizado.
  const keyOwnerRequirePin = useRef(requirePin);

  useEffect(() => {
    if (keyOwnerRequirePin.current !== requirePin) {
      keyOwnerRequirePin.current = requirePin;
      idempotencyKey.current = newIdempotencyKey();
    }
  }, [requirePin]);

  // El medio de pago tambien es parte del cuerpo que hashea el backend para la
  // idempotencia: cambiarlo sin renovar la clave devolveria el intento anterior.
  const keyOwnerPaymentMethod = useRef(paymentMethod);

  useEffect(() => {
    if (keyOwnerPaymentMethod.current !== paymentMethod) {
      keyOwnerPaymentMethod.current = paymentMethod;
      idempotencyKey.current = newIdempotencyKey();
    }
  }, [paymentMethod]);

  const confirm = async () => {
    if (!quote || !selectedFare || isConfirming) {
      return;
    }

    // Todavia no sabemos si se puede viajar a cuenta corporativa: mejor
    // frenar aca que dejar pasar un cobro elegido mientras la pastilla
    // corporativa todavia esta escondida en la pantalla.
    if (paymentMethod === 'corporate' && isCorporateEligibilityLoading) {
      Alert.alert('Cuenta corporativa', 'Estamos confirmando tu cuenta corporativa. Probá de nuevo en un momento.', [
        { text: 'Entendido' },
      ]);
      return;
    }

    setIsConfirming(true);

    try {
      const trip = await confirmRideAction({
        tripId: quote.tripId,
        fareQuoteId: selectedFare.id,
        paymentMethod,
        idempotencyKey: idempotencyKey.current,
        guestPassenger,
        requirePin,
      });

      // El remanente del mes cambio: se descarta el cache para que la proxima
      // consulta traiga el monto actualizado en vez del que ya no es cierto.
      if (paymentMethod === 'corporate') {
        invalidateCorporateEligibility();
      }

      // Con efectivo el viaje ya esta en `searching` y la pantalla del viaje
      // arranca con el radar. Con Mercado Pago queda en `draft` hasta que se
      // acredite el pago; ese aviso llega por webhook al backend y de ahi, por
      // socket, a la pantalla del viaje.
      if (trip.checkoutUrl) {
        await WebBrowser.openBrowserAsync(trip.checkoutUrl);
      }

      router.replace({ pathname: '/trip/[tripId]', params: { tripId: trip.tripId } });
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }

        if (error.code === 'PROFILE_INCOMPLETE') {
          handleIncompleteProfile();
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

        const corporateMessage = getCorporateErrorMessage(error);
        if (corporateMessage) {
          // El medio elegido no funciono: se vuelve a Mercado Pago para no
          // dejar seleccionado un pago que va a fallar de nuevo, y se
          // descarta el cache: el limite, el estado de la empresa o el
          // centro de costo cambiaron y la proxima consulta tiene que
          // traerlos de nuevo en vez de repetir lo que ya sabemos que esta mal.
          setPaymentMethod('account_money');
          invalidateCorporateEligibility();
          Alert.alert('No pudimos cobrar con tu cuenta corporativa', corporateMessage, [{ text: 'Entendido' }]);
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

  return { paymentMethod, setPaymentMethod, requirePin, setRequirePin, confirm, isConfirming };
}
