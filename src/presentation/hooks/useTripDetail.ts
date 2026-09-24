import { useCallback, useEffect, useState } from 'react';

import { getTripAction } from '@/core/actions/get-trip.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { Trip } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/** Detalle de un viaje ya terminado (o en curso, si se entra por la lista): se consulta una sola vez. */
export function useTripDetail(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(tripId !== null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      setTrip(await getTripAction(tripId));
    } catch (reason: unknown) {
      if (reason instanceof ApiRequestError) {
        if (reason.status === 401) {
          handleExpiredSession();
          return;
        }
        if (reason.status === 404 || reason.status === 403) {
          setNotFound(true);
          return;
        }
      }
      setError(getApiErrorMessage(reason, 'No pudimos cargar el viaje.'));
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { trip, isLoading, error, notFound, retry: load };
}
