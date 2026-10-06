import { isCancel } from 'axios';
import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';

import { MIN_SEARCH_LENGTH, searchPlacesAction } from '@/core/actions/search-places.action';
import type { Coordinates, PlaceSuggestion } from '@/infrastructure/interfaces/places';
import { getPlacesErrorMessage } from '@/presentation/utils/places-error-message';

/** Espera tras la ultima tecla antes de consultar: evita una solicitud por letra. */
const DEBOUNCE_MS = 350;

/**
 * Autocompletado con debounce. Cada busqueda nueva cancela la anterior, asi una
 * respuesta lenta de "Av. Col" no pisa los resultados de "Av. Colon".
 *
 * Mientras el campo tiene texto activo, todas las teclas comparten un mismo
 * `sessionToken` (sesion de Places): Google no cobra por tecla dentro de la
 * sesion, solo al cerrarla con el detalle que elige el usuario. Una sesion
 * nueva se arma al empezar a escribir y se descarta al borrar el campo o al
 * elegir una sugerencia (quien la usa es quien la cierra).
 */
export function usePlaceSearch(query: string, near: Coordinates | null) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // En un ref: la busqueda usa la posicion mas reciente sin relanzarse cada vez que el GPS cambia.
  const nearRef = useRef(near);
  nearRef.current = near;

  const trimmed = query.trim();
  const isActive = trimmed.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!isActive) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setSessionToken(null);
      return;
    }

    // Primera tecla de la busqueda: abre la sesion que agrupa el resto.
    const token = sessionToken ?? Crypto.randomUUID();
    if (!sessionToken) setSessionToken(token);

    const controller = new AbortController();
    setIsLoading(true);

    const timeout = setTimeout(() => {
      searchPlacesAction(trimmed, { near: nearRef.current, sessionToken: token, signal: controller.signal })
        .then((suggestions) => {
          setResults(suggestions);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (isCancel(reason)) return;
          setResults([]);
          setError(getPlacesErrorMessage(reason) ?? 'No pudimos buscar direcciones. Revisa tu conexión e intenta de nuevo.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // No depende de `sessionToken`: crearlo adentro dispara un `setState` que
    // ya alcanza para que la proxima tecla (otro `trimmed`) lo reuse via closure.
  }, [trimmed, isActive]);

  return { results, isLoading, error, isActive, sessionToken };
}
