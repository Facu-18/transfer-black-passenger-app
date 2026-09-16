import { useCallback, useEffect, useRef, useState } from 'react';

import { quoteRideAction } from '@/core/actions/quote-ride.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { FareOption, RideQuote } from '@/infrastructure/interfaces/trips';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

function describeQuoteError(error: unknown): string {
  if (error instanceof ApiRequestError && error.status === 400) {
    return 'No pudimos calcular una ruta entre esos puntos. Probá con otra dirección.';
  }

  return getApiErrorMessage(error, 'No pudimos cotizar el viaje. Intentá de nuevo.');
}

/**
 * Cotiza el viaje armado en `useTripStore` al entrar a la pantalla.
 *
 * La cotizacion vence (10 minutos por defecto): al llegar esa hora se vuelve a
 * pedir sola, porque confirmar con una tarifa vencida responde 409.
 */
export function useRideQuote() {
  const origin = useTripStore((state) => state.origin);
  const destination = useTripStore((state) => state.destinationLocation);

  const [quote, setQuote] = useState<RideQuote | null>(null);
  const [selectedFareId, setSelectedFareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!origin || !destination) {
      return;
    }

    // Una respuesta lenta de una cotizacion anterior no debe pisar a la nueva.
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await quoteRideAction(origin, destination);
      if (currentRequest !== requestId.current) return;

      setQuote(result);
      // La categoria elegida se conserva entre recotizaciones; si no, la primera.
      setSelectedFareId((previous) => {
        const stillThere = result.options.some((option) => option.code === previous);
        return stillThere ? previous : (result.options[0]?.code ?? null);
      });
    } catch (reason: unknown) {
      if (currentRequest !== requestId.current) return;

      if (reason instanceof ApiRequestError && reason.status === 401) {
        handleExpiredSession();
        return;
      }

      setQuote(null);
      setError(describeQuoteError(reason));
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [origin, destination]);

  useEffect(() => {
    void load();
  }, [load]);

  // Recotiza sola cuando vence la tarifa.
  useEffect(() => {
    if (!quote) return;

    const msToExpiry = quote.expiresAt.getTime() - Date.now();
    const timeout = setTimeout(() => void load(), Math.max(0, msToExpiry));

    return () => clearTimeout(timeout);
  }, [quote, load]);

  // Se identifica por `code` y no por `id`: al recotizar cambian los ids pero la categoria es la misma.
  const selectedFare: FareOption | null =
    quote?.options.find((option) => option.code === selectedFareId) ?? quote?.options[0] ?? null;

  return {
    quote,
    selectedFare,
    selectFare: setSelectedFareId,
    isLoading,
    error,
    retry: load,
    hasTrip: origin !== null && destination !== null,
  };
}
