import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiRequestError, CONNECTION_ERROR_CODES } from '@/core/api/api-request-error';
import { resolvePlaceFromCoordinatesAction } from '@/core/actions/resolve-place-from-coordinates.action';
import type { Coordinates, Place } from '@/infrastructure/interfaces/places';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useTripStore } from '@/presentation/store/useTripStore';
import { distanceMeters } from '@/presentation/utils/geo';
import { getPlacesErrorMessage } from '@/presentation/utils/places-error-message';

/** Centro de Cordoba: si no hay origen ni ubicacion, el mapa nunca arranca en (0,0). */
const DEFAULT_CENTER: Coordinates = { latitude: -31.4201, longitude: -64.1888 };

/** Espera tras dejar de mover el mapa antes de pedir la direccion. */
const REVERSE_DEBOUNCE_MS = 400;

/** Pasado este tiempo cargando se avisa que el servidor puede estar despertando (Render, hasta ~1 min). */
const SLOW_RESPONSE_MS = 8000;

export type MapPickerStatus = 'loading' | 'ready' | 'error';

/** Mas cerca que esto del punto anterior o del siguiente se considera el mismo lugar. */
const MIN_DISTANCE_FROM_PREVIOUS_METERS = 100;

function getReverseErrorMessage(reason: unknown): string {
  const placesMessage = getPlacesErrorMessage(reason);
  if (placesMessage) return placesMessage;

  if (reason instanceof ApiRequestError && (reason.code === CONNECTION_ERROR_CODES.NETWORK || reason.code === CONNECTION_ERROR_CODES.TIMEOUT)) {
    return 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.';
  }

  return 'No pudimos obtener la dirección de ese punto. Probá de nuevo.';
}

/**
 * Elegir un punto del recorrido moviendo el mapa bajo un puntero fijo: el
 * destino, o una parada si `field` es `stop-N`. Cada vez que el mapa termina de
 * moverse se geocodifica el centro (con debounce, descartando respuestas
 * viejas); al confirmar, el lugar se guarda y se vuelve a la busqueda, que sigue
 * igual que al elegir un resultado (pide lo que falta o pasa a la cotizacion).
 */
export function useMapDestinationPicker() {
  const origin = useTripStore((state) => state.origin);
  const currentLocation = useTripStore((state) => state.currentLocation);
  const destination = useTripStore((state) => state.destinationLocation);
  const setDestination = useTripStore((state) => state.setDestination);
  const setStop = useTripStore((state) => state.setStop);
  const setPendingMapPick = useTripStore((state) => state.setPendingMapPick);
  const stops = useTripStore((state) => state.stops);

  // Que punto del recorrido se elige: una parada (`stop-N`) o el destino.
  const { field } = useLocalSearchParams<{ field?: string }>();
  const parsedStop = field?.startsWith('stop-') ? Number(field.slice('stop-'.length)) : NaN;
  const stopIndex = Number.isInteger(parsedStop) && parsedStop >= 0 && parsedStop < stops.length ? parsedStop : null;
  const targetLabel = stopIndex !== null ? `Parada ${stopIndex + 1}` : 'Destino';
  const { addRecentPlace } = useRecentPlaces();

  // Se lee una sola vez: el mapa arranca ahi y despues lo mueve el pasajero.
  const [initialCenter] = useState<Coordinates>(
    () => origin?.coordinates ?? currentLocation ?? DEFAULT_CENTER,
  );

  const [status, setStatus] = useState<MapPickerStatus>('loading');
  const [place, setPlace] = useState<Place | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Guarda sincronica: dos toques rapidos llegan antes de que el estado se refleje.
  const confirmedRef = useRef(false);
  const centerRef = useRef<Coordinates>(initialCenter);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (slowRef.current) clearTimeout(slowRef.current);
    debounceRef.current = null;
    slowRef.current = null;
  }, []);

  const resolveCenter = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resolved = await resolvePlaceFromCoordinatesAction(centerRef.current, { signal: controller.signal });
      if (requestIdRef.current !== requestId) return; // la tapo un movimiento mas nuevo

      if (!resolved) {
        setPlace(null);
        setErrorMessage('No encontramos una dirección en ese punto. Mové el mapa un poco e intentá de nuevo.');
        setStatus('error');
        return;
      }
      setPlace(resolved);
      setStatus('ready');
    } catch (reason) {
      if (requestIdRef.current !== requestId) return;
      setPlace(null);
      setErrorMessage(getReverseErrorMessage(reason));
      setStatus('error');
    } finally {
      if (requestIdRef.current === requestId) {
        if (slowRef.current) clearTimeout(slowRef.current);
        slowRef.current = null;
        setIsSlow(false);
      }
    }
  }, []);

  /** Programa la consulta del centro actual; un movimiento nuevo cancela la anterior. */
  const scheduleResolve = useCallback(
    (delayMs: number) => {
      clearTimers();
      requestIdRef.current += 1; // invalida cualquier respuesta en vuelo
      abortRef.current?.abort();
      setStatus('loading');
      setErrorMessage(null);
      setIsSlow(false);

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        slowRef.current = setTimeout(() => setIsSlow(true), SLOW_RESPONSE_MS);
        void resolveCenter();
      }, delayMs);
    },
    [clearTimers, resolveCenter],
  );

  const onCenterChange = useCallback(
    (center: Coordinates) => {
      centerRef.current = center;
      scheduleResolve(REVERSE_DEBOUNCE_MS);
    },
    [scheduleResolve],
  );

  /** Primera direccion: el mapa ya esta listo y todavia no se movio. */
  const resolveInitialCenter = useCallback(() => scheduleResolve(0), [scheduleResolve]);

  const retry = useCallback(() => scheduleResolve(0), [scheduleResolve]);

  useEffect(
    () => () => {
      clearTimers();
      requestIdRef.current += 1;
      abortRef.current?.abort();
    },
    [clearTimers],
  );

  // Vecinos del punto en el recorrido (origen, paradas, destino), salteando
  // paradas todavia vacias. El mapa arranca centrado en el origen: confirmar sin
  // moverlo daria dos puntos seguidos iguales, que el backend rechaza con un
  // error de ruta poco claro.
  const route = [origin, ...stops, stopIndex !== null ? destination : null];
  const position = stopIndex !== null ? stopIndex + 1 : route.length - 1;
  const previousPoint = route.slice(0, position).reverse().find((point): point is Place => point !== null) ?? null;
  const nextPoint = route.slice(position + 1).find((point): point is Place => point !== null) ?? null;
  const near = (point: Place | null) =>
    point !== null &&
    place !== null &&
    distanceMeters(point.coordinates, place.coordinates) < MIN_DISTANCE_FROM_PREVIOUS_METERS;
  const tooClose = near(previousPoint) || near(nextPoint);
  const pointName = stopIndex !== null ? 'tu parada' : 'tu destino';
  const blockedMessage = !tooClose
    ? null
    : near(previousPoint) && previousPoint === origin
      ? `Ese es tu punto de partida. Mové el mapa hasta ${pointName}.`
      : `Ese lugar ya está en tu recorrido justo al lado. Mové el mapa hasta ${pointName}.`;

  const confirm = useCallback(() => {
    if (status !== 'ready' || !place || confirmedRef.current || tooClose) return;
    confirmedRef.current = true;
    setIsConfirming(true);

    if (stopIndex !== null) setStop(stopIndex, place);
    else setDestination(place);
    void addRecentPlace(place);

    // La busqueda decide que sigue al enfocarse (ver `pendingMapPick` en `usePlanTrip`).
    setPendingMapPick(true);
    router.back();
  }, [status, place, tooClose, stopIndex, setStop, setDestination, setPendingMapPick, addRecentPlace]);

  return {
    initialCenter,
    status,
    place,
    errorMessage,
    isSlow,
    isConfirming,
    /** "Destino" o "Parada N": que punto del recorrido se esta eligiendo. */
    targetLabel,
    /** Por que no se puede confirmar este punto (muy cerca del anterior); `null` si se puede. */
    blockedMessage,
    onCenterChange,
    resolveInitialCenter,
    retry,
    confirm,
  };
}
