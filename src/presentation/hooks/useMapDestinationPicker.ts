import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiRequestError, CONNECTION_ERROR_CODES } from '@/core/api/api-request-error';
import { resolvePlaceFromCoordinatesAction } from '@/core/actions/resolve-place-from-coordinates.action';
import type { Coordinates, Place } from '@/infrastructure/interfaces/places';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getPlacesErrorMessage } from '@/presentation/utils/places-error-message';

/** Centro de Cordoba: si no hay origen ni ubicacion, el mapa nunca arranca en (0,0). */
const DEFAULT_CENTER: Coordinates = { latitude: -31.4201, longitude: -64.1888 };

/** Espera tras dejar de mover el mapa antes de pedir la direccion. */
const REVERSE_DEBOUNCE_MS = 400;

/** Pasado este tiempo cargando se avisa que el servidor puede estar despertando (Render, hasta ~1 min). */
const SLOW_RESPONSE_MS = 8000;

export type MapPickerStatus = 'loading' | 'ready' | 'error';

function getReverseErrorMessage(reason: unknown): string {
  const placesMessage = getPlacesErrorMessage(reason);
  if (placesMessage) return placesMessage;

  if (reason instanceof ApiRequestError && (reason.code === CONNECTION_ERROR_CODES.NETWORK || reason.code === CONNECTION_ERROR_CODES.TIMEOUT)) {
    return 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.';
  }

  return 'No pudimos obtener la dirección de ese punto. Probá de nuevo.';
}

/**
 * Elegir el destino moviendo el mapa bajo un puntero fijo. Cada vez que el mapa
 * termina de moverse se geocodifica el centro (con debounce, descartando
 * respuestas viejas); al confirmar, el lugar se guarda como destino y el flujo
 * sigue igual que al elegir un resultado de la busqueda.
 */
export function useMapDestinationPicker() {
  const origin = useTripStore((state) => state.origin);
  const currentLocation = useTripStore((state) => state.currentLocation);
  const setDestination = useTripStore((state) => state.setDestination);
  const { addRecentPlace } = useRecentPlaces();

  // Se lee una sola vez: el mapa arranca ahi y despues lo mueve el pasajero.
  const [initialCenter] = useState<Coordinates>(
    () => origin?.coordinates ?? currentLocation ?? DEFAULT_CENTER,
  );

  const [status, setStatus] = useState<MapPickerStatus>('loading');
  const [place, setPlace] = useState<Place | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);

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

  const confirm = useCallback(() => {
    if (status !== 'ready' || !place) return;

    setDestination(place);
    void addRecentPlace(place);

    if (origin) {
      // Reemplaza este paso: "atras" desde la cotizacion vuelve a la busqueda, como al elegir un resultado.
      router.replace('/pricing');
      return;
    }
    // Sin origen no se puede cotizar: vuelve a la busqueda, que pide el punto de partida.
    router.back();
  }, [status, place, origin, setDestination, addRecentPlace]);

  return {
    initialCenter,
    status,
    place,
    errorMessage,
    isSlow,
    onCenterChange,
    resolveInitialCenter,
    retry,
    confirm,
  };
}
