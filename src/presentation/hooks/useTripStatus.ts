import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getTripAction } from '@/core/actions/get-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { Trip, TripStatus } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/** Cada cuanto se vuelve a preguntar mientras el viaje todavia puede cambiar solo. */
const POLL_INTERVAL_MS = 5_000;

/**
 * Estados que cambian sin que el pasajero haga nada: el pago que se acredita
 * (`draft`) y la busqueda de conductor (`searching`). En el resto, preguntar de
 * nuevo no aporta y solo gasta bateria y datos.
 */
const PENDING_STATUSES: TripStatus[] = ['draft', 'searching'];

/**
 * Sigue el estado del viaje mientras la pantalla esta abierta.
 *
 * Con Mercado Pago el viaje queda en `draft` hasta que el pago se acredita, y el
 * backend se entera por webhook: sin esto la app no tendria como saberlo.
 */
export function useTripStatus(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(tripId !== null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const stop = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    const check = async () => {
      try {
        const current = await getTripAction(tripId);
        if (!active) return;

        setTrip(current);
        setError(null);

        // Se sigue preguntando solo mientras el viaje pueda moverse solo.
        if (PENDING_STATUSES.includes(current.status)) {
          timer.current = setTimeout(() => void check(), POLL_INTERVAL_MS);
        }
      } catch (reason: unknown) {
        if (!active) return;

        if (reason instanceof ApiRequestError && reason.status === 401) {
          handleExpiredSession();
          return;
        }

        // Un corte de red no cancela el seguimiento: se reintenta en el proximo ciclo.
        setError(getApiErrorMessage(reason, 'No pudimos consultar tu viaje.'));
        timer.current = setTimeout(() => void check(), POLL_INTERVAL_MS);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void check();

    // Con la app en segundo plano los timers se frenan: al volver conviene preguntar ya.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && active) {
        stop();
        void check();
      }
    });

    return () => {
      active = false;
      stop();
      subscription.remove();
    };
  }, [tripId]);

  return { trip, isLoading, error };
}
