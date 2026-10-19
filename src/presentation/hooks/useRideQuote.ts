import { useCallback, useEffect, useRef, useState } from 'react';

import { quoteRideAction } from '@/core/actions/quote-ride.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { Place } from '@/infrastructure/interfaces/places';
import type { FareOption, RideQuote } from '@/infrastructure/interfaces/trips';
import { DEFAULT_RATE_LIMIT_SECONDS, isRateLimitError, useRateLimitCooldown } from '@/presentation/hooks/useRateLimitCooldown';
import { useToast } from '@/presentation/hooks/useToast';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';
import { handleIncompleteProfile } from '@/presentation/utils/incomplete-profile';

/**
 * Espera antes de recotizar cuando cambian origen o destino. Evita una solicitud
 * por cada cambio seguido (el backend limita a 20 por minuto); la primera
 * cotizacion al entrar a la pantalla no espera.
 */
const REQUOTE_DEBOUNCE_MS = 600;

export const RATE_LIMITED_QUOTE_MESSAGE = 'Esperá unos segundos antes de recalcular la ruta.';

/** Identifica el par origen/destino de una cotizacion: dos pares con la misma clave son el mismo viaje. */
function getRouteKey(origin: Place, destination: Place): string {
  const point = (place: Place) => `${place.placeId}|${place.coordinates.latitude},${place.coordinates.longitude}`;
  return `${point(origin)}>${point(destination)}`;
}

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
  const quoteRef = useRef<RideQuote | null>(null);
  // Puntos con los que se pidio la cotizacion visible: si ya no son los actuales, esta vieja.
  const [quoteRouteKey, setQuoteRouteKey] = useState<string | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});
  // Hasta cuando el backend pidio esperar (429) y el temporizador que recotiza al cumplirse.
  const blockedUntil = useRef(0);
  const unblockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasQuotedOnce = useRef(false);
  const rateLimit = useRateLimitCooldown();
  // `start` es estable; el objeto completo cambia en cada render y recrearia `load`.
  const startRateLimit = rateLimit.start;
  const { toast, show: showToast } = useToast();

  const load = useCallback(async () => {
    if (!origin || !destination) {
      return;
    }

    // Durante la espera del 429 no se manda nada: se recotiza sola al terminar.
    const remainingBlockMs = blockedUntil.current - Date.now();
    if (remainingBlockMs > 0) {
      if (unblockTimer.current) clearTimeout(unblockTimer.current);
      unblockTimer.current = setTimeout(() => void loadRef.current(), remainingBlockMs);
      setIsLoading(false);
      return;
    }

    // Una respuesta lenta de una cotizacion anterior no debe pisar a la nueva.
    const requestRouteKey = getRouteKey(origin, destination);
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await quoteRideAction(origin, destination);
      if (currentRequest !== requestId.current) return;

      quoteRef.current = result;
      setQuote(result);
      setQuoteRouteKey(requestRouteKey);
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

      if (reason instanceof ApiRequestError && reason.code === 'PROFILE_INCOMPLETE') {
        handleIncompleteProfile();
        return;
      }

      if (isRateLimitError(reason)) {
        const waitSeconds = Math.ceil(reason.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_SECONDS);
        blockedUntil.current = Date.now() + waitSeconds * 1000;
        startRateLimit(reason);

        if (quoteRef.current) {
          // Se conserva la cotizacion anterior y se avisa; al terminar la espera se recalcula sola.
          showToast(RATE_LIMITED_QUOTE_MESSAGE);
          if (unblockTimer.current) clearTimeout(unblockTimer.current);
          unblockTimer.current = setTimeout(() => void loadRef.current(), waitSeconds * 1000);
          return;
        }

        setError(RATE_LIMITED_QUOTE_MESSAGE);
        return;
      }

      quoteRef.current = null;
      setQuote(null);
      setError(describeQuoteError(reason));
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [origin, destination, startRateLimit, showToast]);

  loadRef.current = load;

  // La clave evita recotizar si cambia la identidad de los objetos pero no los puntos.
  const routeKey = origin && destination ? getRouteKey(origin, destination) : null;

  // Cotizacion de otro viaje (un 429 o el debounce dejaron a la vista la anterior): confirmarla crearia un viaje al destino equivocado.
  const isStale = quote !== null && quoteRouteKey !== routeKey;

  useEffect(() => {
    if (!routeKey) return;

    if (!hasQuotedOnce.current) {
      hasQuotedOnce.current = true;
      void loadRef.current();
      return;
    }

    // Recotizacion por un cambio de puntos: se espera un momento por si siguen cambiando.
    // Se invalida lo que haya en vuelo para que una respuesta vieja no pise a la nueva.
    requestId.current += 1;
    setIsLoading(true);
    const timer = setTimeout(() => void loadRef.current(), REQUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [routeKey]);

  useEffect(
    () => () => {
      if (unblockTimer.current) clearTimeout(unblockTimer.current);
    },
    [],
  );

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
    // Mientras corre la espera del 429, reintentar a mano solo la prolongaria.
    isRateLimited: rateLimit.isCoolingDown,
    isStale,
    toast,
    hasTrip: origin !== null && destination !== null,
  };
}
