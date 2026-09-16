import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Place } from '@/infrastructure/interfaces/places';
import { recentPlacesStorage } from '@/infrastructure/storage/recent-places-storage';

/** Destinos recientes del dispositivo; se recargan cada vez que la pantalla vuelve a tener foco. */
export function useRecentPlaces() {
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void recentPlacesStorage.get().then((places) => {
        if (active) setRecentPlaces(places);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const addRecentPlace = useCallback(async (place: Place) => {
    try {
      setRecentPlaces(await recentPlacesStorage.add(place));
    } catch {
      // No poder guardar un reciente no debe frenar el armado del viaje.
    }
  }, []);

  return { recentPlaces, addRecentPlace };
}
