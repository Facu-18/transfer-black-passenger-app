import { useCallback, useEffect, useState } from 'react';

import { getTripAction } from '@/core/actions/get-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { Trip } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/**
 * Viaje terminado para el recibo. Se consulta una vez: un viaje completado ya
 * no cambia, salvo la calificacion, que la pantalla maneja sola.
 */
export function useTripReceipt(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(tripId !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError(null);

    try {
      setTrip(await getTripAction(tripId));
    } catch (reason: unknown) {
      if (reason instanceof ApiRequestError && reason.status === 401) {
        handleExpiredSession();
        return;
      }
      setError(getApiErrorMessage(reason, 'No pudimos cargar el comprobante.'));
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { trip, isLoading, error, retry: load };
}
