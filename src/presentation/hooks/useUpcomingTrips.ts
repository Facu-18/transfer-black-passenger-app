import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listUpcomingTripsAction } from '@/core/actions/list-upcoming-trips.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/**
 * Próximo viaje reservado para la tarjeta del Home. Se recarga con cada foco
 * de la pantalla; liviana a propósito, sin paginación ni estados de carga
 * propios. Un error se traga en silencio: la tarjeta simplemente no aparece,
 * no hay nada crítico que avisar en el Home por esto.
 */
export function useUpcomingTrips() {
  const [nextTrip, setNextTrip] = useState<TripHistoryItem | null>(null);

  const load = useCallback(async () => {
    try {
      const trips = await listUpcomingTripsAction();
      setNextTrip(trips[0] ?? null);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }
      setNextTrip(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { nextTrip, refresh: load };
}
