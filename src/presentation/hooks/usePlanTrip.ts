import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import type { Place } from '@/infrastructure/interfaces/places';
import { usePlaceSearch } from '@/presentation/hooks/usePlaceSearch';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useTripStore } from '@/presentation/store/useTripStore';

export type TripField = 'origin' | 'destination';

/**
 * Estado de "Planifica tu viaje": dos campos que comparten una misma lista de
 * sugerencias (la del campo activo). Al tener origen y destino avanza a la cotizacion.
 */
export function usePlanTrip() {
  const currentLocation = useTripStore((state) => state.currentLocation);
  const currentPlace = useTripStore((state) => state.currentPlace);
  const origin = useTripStore((state) => state.origin);
  const destination = useTripStore((state) => state.destinationLocation);
  const setOrigin = useTripStore((state) => state.setOrigin);
  const setDestination = useTripStore((state) => state.setDestination);
  const { recentPlaces, addRecentPlace } = useRecentPlaces();

  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);

  const [activeField, setActiveField] = useState<TripField>('destination');
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const activeQuery = activeField === 'origin' ? originQuery : destinationQuery;
  const search = usePlaceSearch(activeQuery, currentLocation);

  const goToPricing = () => router.push('/pricing');

  const selectOrigin = (place: Place) => {
    setHint(null);
    setOrigin(place);
    setOriginQuery('');

    if (destination) {
      goToPricing();
      return;
    }
    destinationInputRef.current?.focus();
  };

  const selectPlace = (place: Place) => {
    if (activeField === 'origin') {
      selectOrigin(place);
      return;
    }

    setHint(null);
    setDestination(place);
    setDestinationQuery('');
    void addRecentPlace(place);

    if (origin) {
      goToPricing();
      return;
    }

    // Sin ubicacion actual no hay origen propuesto: se pide antes de cotizar.
    setHint('Elige el punto de partida para continuar.');
    originInputRef.current?.focus();
  };

  const selectCurrentPlaceAsOrigin = () => {
    if (currentPlace) selectOrigin(currentPlace);
  };

  return {
    origin,
    destination,
    currentPlace,
    recentPlaces,
    activeField,
    setActiveField,
    originQuery,
    setOriginQuery,
    destinationQuery,
    setDestinationQuery,
    originInputRef,
    destinationInputRef,
    search,
    hint,
    selectPlace,
    selectCurrentPlaceAsOrigin,
  };
}
