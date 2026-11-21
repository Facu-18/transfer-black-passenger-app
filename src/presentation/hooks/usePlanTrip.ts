import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { resolvePlaceDetailsAction } from '@/core/actions/resolve-place-details.action';
import type { Place, PlaceSuggestion } from '@/infrastructure/interfaces/places';
import { usePlaceSearch } from '@/presentation/hooks/usePlaceSearch';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useReservationStore } from '@/presentation/store/useReservationStore';
import { MAX_TRIP_STOPS, useTripStore } from '@/presentation/store/useTripStore';
import { getPlacesErrorMessage } from '@/presentation/utils/places-error-message';

/** Parada intermedia por su posicion en el recorrido (`stop-0` es la primera). */
export type StopField = `stop-${number}`;
export type TripField = 'origin' | 'destination' | StopField;

const NO_STOPS: (Place | null)[] = [];
const ORIGIN_HINT = 'Elige el punto de partida para continuar.';
const SAME_PLACE_HINT = 'Elegí otro lugar: dos puntos seguidos del recorrido no pueden ser el mismo.';

export function stopField(index: number): StopField {
  return `stop-${index}`;
}

/** Indice de la parada de un campo, o `null` si es el origen o el destino. */
export function stopIndexOf(field: TripField): number | null {
  if (!field.startsWith('stop-')) return null;
  const index = Number(field.slice('stop-'.length));
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function samePlace(a: Place | null | undefined, b: Place | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.coordinates.latitude === b.coordinates.latitude &&
    a.coordinates.longitude === b.coordinates.longitude
  );
}

/**
 * Esta misma pantalla la usa tambien "Reservar viaje": `mode=reserve` hace
 * que el origen y destino elegidos se guarden en `useReservationStore` en vez
 * de `useTripStore`, y que al completar los dos campos se vuelva a la
 * reserva (no se avanza a la cotizacion). La reserva no admite paradas.
 *
 * `field` precarga cual campo abrir activo (`origin`, `destination` o
 * `stop-N`). `returnTo=pricing` indica que se vino desde la cotizacion (por
 * ejemplo, a agregar una parada): al completar el recorrido se vuelve a ella en
 * vez de abrir otra.
 *
 * Con todos los campos completos (origen, cada parada agregada y destino) se
 * pasa sola a la cotizacion, como siempre; si falta alguno, se enfoca ese.
 */
export function usePlanTrip() {
  const { mode, field, returnTo } = useLocalSearchParams<{ mode?: string; field?: string; returnTo?: string }>();
  const isReserveMode = mode === 'reserve';

  const currentLocation = useTripStore((state) => state.currentLocation);
  const currentPlace = useTripStore((state) => state.currentPlace);

  const tripOrigin = useTripStore((state) => state.origin);
  const tripDestination = useTripStore((state) => state.destinationLocation);
  const tripStops = useTripStore((state) => state.stops);
  const setTripOrigin = useTripStore((state) => state.setOrigin);
  const setTripDestination = useTripStore((state) => state.setDestination);
  const setTripStop = useTripStore((state) => state.setStop);
  const addTripStop = useTripStore((state) => state.addStop);
  const removeTripStop = useTripStore((state) => state.removeStop);
  const setPendingOriginPrompt = useTripStore((state) => state.setPendingOriginPrompt);

  const reservationOrigin = useReservationStore((state) => state.origin);
  const reservationDestination = useReservationStore((state) => state.destination);
  const setReservationOrigin = useReservationStore((state) => state.setOrigin);
  const setReservationDestination = useReservationStore((state) => state.setDestination);

  const origin = isReserveMode ? reservationOrigin : tripOrigin;
  const destination = isReserveMode ? reservationDestination : tripDestination;
  const stops = isReserveMode ? NO_STOPS : tripStops;
  const setOrigin = isReserveMode ? setReservationOrigin : setTripOrigin;
  const setDestination = isReserveMode ? setReservationDestination : setTripDestination;

  const { recentPlaces, addRecentPlace } = useRecentPlaces();

  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const stopInputRef0 = useRef<TextInput>(null);
  const stopInputRef1 = useRef<TextInput>(null);
  const stopInputRefs = [stopInputRef0, stopInputRef1];

  const initialField: TripField =
    field === 'origin' ? 'origin' : field && stopIndexOf(field as TripField) !== null ? (field as StopField) : 'destination';
  const [activeField, setActiveField] = useState<TripField>(initialField);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [stopQueries, setStopQueries] = useState<string[]>(() => Array.from({ length: MAX_TRIP_STOPS }, () => ''));
  const [hint, setHint] = useState<string | null>(null);
  // Mientras se resuelve el detalle de una sugerencia elegida (pide las coordenadas).
  const [isResolvingSuggestion, setIsResolvingSuggestion] = useState(false);

  const activeStopIndex = stopIndexOf(activeField);
  const activeQuery =
    activeField === 'origin'
      ? originQuery
      : activeStopIndex !== null
        ? (stopQueries[activeStopIndex] ?? '')
        : destinationQuery;
  const search = usePlaceSearch(activeQuery, currentLocation);

  // Identifica la seleccion vigente: una respuesta de detalle que llega
  // despues de una seleccion mas nueva (doble tap o red lenta) se descarta.
  const selectionIdRef = useRef(0);

  const setStopQuery = (index: number, text: string) =>
    setStopQueries((previous) => previous.map((query, current) => (current === index ? text : query)));

  // En la reserva se vuelve a esa pantalla (ya estaba en la pila); si se vino
  // desde la cotizacion, se vuelve a ella; si no, se sigue a la cotizacion.
  const goToPricing = () => (isReserveMode || returnTo === 'pricing' ? router.back() : router.push('/pricing'));

  const focusField = (target: TripField) => {
    setActiveField(target);
    if (target === 'origin') originInputRef.current?.focus();
    else if (target === 'destination') destinationInputRef.current?.focus();
    else stopInputRefs[stopIndexOf(target) ?? 0]?.current?.focus();
  };

  /**
   * Con el recorrido como quedo tras elegir un lugar: si esta completo pasa a
   * la cotizacion; si no, enfoca el primer campo vacio en orden.
   */
  const continueWith = (next: { origin: Place | null; stops: (Place | null)[]; destination: Place | null }) => {
    if (!next.origin) {
      // Sin ubicacion actual no hay origen propuesto: se pide antes de cotizar.
      if (next.destination) setHint(ORIGIN_HINT);
      focusField('origin');
      return;
    }

    const emptyStop = next.stops.findIndex((stop) => stop === null);
    if (emptyStop !== -1) {
      focusField(stopField(emptyStop));
      return;
    }

    if (!next.destination) {
      focusField('destination');
      return;
    }

    goToPricing();
  };

  /** Ya resuelto (recientes, ubicacion actual): tiene coordenadas, se usa directo. */
  const applyPlace = (place: Place, target: TripField = activeField) => {
    const index = stopIndexOf(target);
    const points = [origin, ...stops, destination];
    // Posicion en el recorrido completo: origen 0, paradas 1..n, destino n + 1.
    const position = target === 'origin' ? 0 : index !== null ? index + 1 : points.length - 1;
    const touchesNeighbor = samePlace(points[position - 1], place) || samePlace(points[position + 1], place);

    // Sin paradas, origen y destino iguales los sigue rechazando el backend con su propio mensaje.
    if (stops.length > 0 && touchesNeighbor) {
      setHint(SAME_PLACE_HINT);
      return;
    }

    setHint(null);

    if (target === 'origin') {
      setOrigin(place);
      setOriginQuery('');
      continueWith({ origin: place, stops, destination });
      return;
    }

    void addRecentPlace(place);

    if (index !== null) {
      setTripStop(index, place);
      setStopQuery(index, '');
      continueWith({
        origin,
        stops: stops.map((stop, current) => (current === index ? place : stop)),
        destination,
      });
      return;
    }

    setDestination(place);
    setDestinationQuery('');
    continueWith({ origin, stops, destination: place });
  };

  const selectPlace = (place: Place) => applyPlace(place);

  /** Agrega una parada vacia al final y la deja lista para escribir. */
  const addStop = () => {
    if (isReserveMode || stops.length >= MAX_TRIP_STOPS) return;
    setHint(null);
    addTripStop();
    // El campo nuevo se monta con autofoco por estar activo.
    setActiveField(stopField(stops.length));
  };

  const removeStop = (index: number) => {
    removeTripStop(index);
    setHint(null);
    // Las busquedas de las paradas siguientes se corren un lugar, como las paradas.
    setStopQueries((previous) => [...previous.filter((_, current) => current !== index), '']);
    if (activeStopIndex === index) setActiveField('destination');
    else if (activeStopIndex !== null && activeStopIndex > index) setActiveField(stopField(activeStopIndex - 1));
  };

  // Recorrido completo (origen, cada parada y destino): se puede pasar a la cotizacion a mano.
  const isRouteComplete =
    !isReserveMode && origin !== null && destination !== null && stops.every((stop) => stop !== null);

  // Al volver de "Elegir en el mapa" con el destino ya fijado pero sin origen,
  // pasa lo mismo que al elegir un resultado sin origen: se pide la partida.
  // El mapa deja un aviso de un solo uso que se consume aca, para no pisar el
  // campo que elija el pasajero en enfoques posteriores.
  useFocusEffect(
    useCallback(() => {
      if (!useTripStore.getState().pendingOriginPrompt) return;
      setPendingOriginPrompt(false);
      if (isReserveMode || !tripDestination || tripOrigin) return;
      setActiveField('origin');
      setHint(ORIGIN_HINT);
      originInputRef.current?.focus();
    }, [isReserveMode, tripDestination, tripOrigin, setPendingOriginPrompt]),
  );

  /**
   * Sugerencia del autocompletado: todavia no tiene coordenadas. Hay que
   * pedir el detalle (cierra la sesion de autocompletado) antes de poder
   * usarla en el recorrido.
   */
  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    if (!search.sessionToken) return;
    // Ya hay un detalle en curso (doble tap u otra sugerencia tocada antes de
    // que responda): se ignora para no abrir una segunda llamada a Google.
    if (isResolvingSuggestion) return;

    const selectionId = ++selectionIdRef.current;
    // El campo se fija al tocar: si el foco cambia mientras responde, el lugar va igual a este.
    const target = activeField;
    setIsResolvingSuggestion(true);
    setHint(null);

    try {
      const place = await resolvePlaceDetailsAction(suggestion, search.sessionToken);
      if (selectionIdRef.current !== selectionId) return; // la tapo una seleccion mas nueva
      search.resetSession();
      applyPlace(place, target);
    } catch (reason) {
      if (selectionIdRef.current !== selectionId) return;
      setHint(getPlacesErrorMessage(reason) ?? 'No pudimos obtener esa dirección. Probá de nuevo.');
    } finally {
      if (selectionIdRef.current === selectionId) setIsResolvingSuggestion(false);
    }
  };

  const selectCurrentPlaceAsOrigin = () => {
    if (currentPlace) applyPlace(currentPlace, 'origin');
  };

  return {
    isReserveMode,
    origin,
    destination,
    stops,
    canAddStop: !isReserveMode && stops.length < MAX_TRIP_STOPS,
    isRouteComplete,
    currentPlace,
    recentPlaces,
    activeField,
    setActiveField,
    originQuery,
    setOriginQuery,
    destinationQuery,
    setDestinationQuery,
    stopQueries,
    setStopQuery,
    originInputRef,
    destinationInputRef,
    stopInputRefs,
    search,
    hint,
    isResolvingSuggestion,
    selectPlace,
    selectSuggestion,
    selectCurrentPlaceAsOrigin,
    addStop,
    removeStop,
    goToPricing,
  };
}
