import { isCancel } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { MIN_SEARCH_LENGTH, searchPlacesAction } from '@/core/actions/search-places.action';
import type { Coordinates, Place } from '@/infrastructure/interfaces/places';

/** Espera tras la ultima tecla antes de consultar: evita una solicitud por letra. */
const DEBOUNCE_MS = 350;

/**
 * Autocompletado con debounce. Cada busqueda nueva cancela la anterior, asi una
 * respuesta lenta de "Av. Col" no pisa los resultados de "Av. Colon".
 */
export function usePlaceSearch(query: string, near: Coordinates | null) {
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timeout = setTimeout(() => {
      searchPlacesAction(trimmed, { near: nearRef.current, signal: controller.signal })
        .then((places) => {
          setResults(places);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (isCancel(reason)) return;
          setResults([]);
          setError('No pudimos buscar direcciones. Revisa tu conexión e intenta de nuevo.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, isActive]);

  return { results, isLoading, error, isActive };
}
