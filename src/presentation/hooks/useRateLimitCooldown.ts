import { useCallback } from 'react';

import { ApiRequestError } from '@/core/api/api-request-error';
import { useCountdown } from '@/presentation/hooks/useCountdown';

/** Espera por defecto cuando el 429 no trae `Retry-After`. */
export const DEFAULT_RATE_LIMIT_SECONDS = 60;

export function isRateLimitError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.status === 429;
}

/** Texto para el usuario durante la espera; se decide por status, nunca por el texto del backend. */
export function describeRateLimit(secondsLeft: number): string {
  return `Demasiados intentos. Esperá ${secondsLeft}s para reintentar.`;
}

/**
 * Cuenta regresiva de un 429 (`RATE_LIMIT_EXCEEDED`): `start(error)` la arranca
 * con `Retry-After` y devuelve `true` si el error era un 429. Mientras corre,
 * `isCoolingDown` es `true` y `message` se actualiza cada segundo; al llegar a
 * cero se vuelve a habilitar solo y `message` queda en `null`.
 */
export function useRateLimitCooldown() {
  const countdown = useCountdown(0);
  const { restart } = countdown;

  const start = useCallback(
    (error: unknown): boolean => {
      if (!isRateLimitError(error)) return false;
      const seconds = error.retryAfterSeconds;
      restart(seconds !== null && seconds > 0 ? Math.ceil(seconds) : DEFAULT_RATE_LIMIT_SECONDS);
      return true;
    },
    [restart],
  );

  return {
    secondsLeft: countdown.secondsLeft,
    isCoolingDown: countdown.isRunning,
    message: countdown.isRunning ? describeRateLimit(countdown.secondsLeft) : null,
    start,
  };
}
