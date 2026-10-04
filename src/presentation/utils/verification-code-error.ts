import { ApiRequestError } from '@/core/api/api-request-error';
import type { VerificationErrorDetails } from '@/infrastructure/interfaces/auth-api';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';

/** Lee un detalle numerico de un error de PIN (`attempts_remaining`, `retry_in_seconds`). */
export function readVerificationCodeDetail(error: ApiRequestError, key: keyof VerificationErrorDetails): number | null {
  const details = error.details;
  if (typeof details !== 'object' || details === null || !(key in details)) {
    return null;
  }
  const value = (details as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : null;
}

/**
 * Mensaje para los errores `VERIFICATION_CODE_*`: los comparten la
 * verificacion de email y la recuperacion de contraseña, que usan el mismo
 * PIN de 6 digitos y los mismos codigos de error.
 */
export function describeVerificationCodeError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case 'VERIFICATION_CODE_INVALID': {
        const remaining = readVerificationCodeDetail(error, 'attempts_remaining');
        return remaining === null
          ? 'El código no es correcto.'
          : `El código no es correcto. Te ${remaining === 1 ? 'queda 1 intento' : `quedan ${remaining} intentos`}.`;
      }
      case 'VERIFICATION_CODE_LOCKED':
        return 'Superaste los intentos permitidos. Pedí un código nuevo.';
      case 'VERIFICATION_CODE_EXPIRED':
        return 'El código venció. Pedí uno nuevo.';
    }
  }

  return getApiErrorMessage(error, fallback);
}
