import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { resolvePlaceDetailsAction } from '@/core/actions/resolve-place-details.action';
import type { Place, PlaceSuggestion } from '@/infrastructure/interfaces/places';
import { usePlaceSearch } from '@/presentation/hooks/usePlaceSearch';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useReservationStore } from '@/presentation/store/useReservationStore';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getPlacesErrorMessage } from '@/presentation/utils/places-error-message';

export type TripField = 'origin' | 'destination';

/**
 * Esta misma pantalla la usa tambien "Reservar viaje": `mode=reserve` hace
 * que el origen y destino elegidos se guarden en `useReservationStore` en vez
 * de `useTripStore`, y que al completar los dos campos se vuelva a la
 * reserva (no se avanza a la cotizacion). `field` precarga cual campo abrir
 * activo, para cuando se entra a elegir solo uno de los dos.
 */
export function usePlanTrip() {
  const { mode, field } = useLocalSearchParams<{ mode?: string; field?: TripField }>();
  const isReserveMode = mode === 'reserve';

  const currentLocation = useTripStore((state) => state.currentLocation);
  const currentPlace = useTripStore((state) => state.currentPlace);

  const tripOrigin = useTripStore((state) => state.origin);
  const tripDestination = useTripStore((state) => state.destinationLocation);
  const setTripOrigin = useTripStore((state) => state.setOrigin);
  const setTripDestination = useTripStore((state) => state.setDestination);

  const reservationOrigin = useReservationStore((state) => state.origin);
  const reservationDestination = useReservationStore((state) => state.destination);
  const setReservationOrigin = useReservationStore((state) => state.setOrigin);
  const setReservationDestination = useReservationStore((state) => state.setDestination);

  const origin = isReserveMode ? reservationOrigin : tripOrigin;
  const destination = isReserveMode ? reservationDestination : tripDestination;
  const setOrigin = isReserveMode ? setReservationOrigin : setTripOrigin;
  const setDestination = isReserveMode ? setReservationDestination : setTripDestination;

  const { recentPlaces, addRecentPlace } = useRecentPlaces();

  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);

  const [activeField, setActiveField] = useState<TripField>(field === 'origin' ? 'origin' : 'destination');
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  // Mientras se resuelve el detalle de una sugerencia elegida (pide las coordenadas).
  const [isResolvingSuggestion, setIsResolvingSuggestion] = useState(false);

  const activeQuery = activeField === 'origin' ? originQuery : destinationQuery;
  const search = usePlaceSearch(activeQuery, currentLocation);

  // Identifica la seleccion vigente: una respuesta de detalle que llega
  // despues de una seleccion mas nueva (doble tap o red lenta) se descarta.
  const selectionIdRef = useRef(0);

  // En la reserva se vuelve a esa pantalla (ya estaba en la pila); en el viaje
  // "Ahora" se sigue a la cotizacion.
  const goToPricing = () => (isReserveMode ? router.back() : router.push('/pricing'));

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

  /** Ya resuelto (recientes, ubicacion actual): tiene coordenadas, se usa directo. */
  const applyPlace = (place: Place) => {
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

  const selectPlace = (place: Place) => applyPlace(place);

  /**
   * Sugerencia del autocompletado: todavia no tiene coordenadas. Hay que
   * pedir el detalle (cierra la sesion de autocompletado) antes de poder
   * usarla como origen o destino.
   */
  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    if (!search.sessionToken) return;
    // Ya hay un detalle en curso (doble tap u otra sugerencia tocada antes de
    // que responda): se ignora para no abrir una segunda llamada a Google.
    if (isResolvingSuggestion) return;

    const selectionId = ++selectionIdRef.current;
    setIsResolvingSuggestion(true);
    setHint(null);

    try {
      const place = await resolvePlaceDetailsAction(suggestion, search.sessionToken);
      if (selectionIdRef.current !== selectionId) return; // la tapo una seleccion mas nueva
      search.resetSession();
      applyPlace(place);
    } catch (reason) {
      if (selectionIdRef.current !== selectionId) return;
      setHint(getPlacesErrorMessage(reason) ?? 'No pudimos obtener esa dirección. Probá de nuevo.');
    } finally {
      if (selectionIdRef.current === selectionId) setIsResolvingSuggestion(false);
    }
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
    isResolvingSuggestion,
    selectPlace,
    selectSuggestion,
    selectCurrentPlaceAsOrigin,
  };
}
