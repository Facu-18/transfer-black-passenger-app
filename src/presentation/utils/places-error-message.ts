import { ApiRequestError } from '@/core/api/api-request-error';

/** Mensaje para un error de autocompletado o geocodificacion, o `null` si no es uno de estos. */
export function getPlacesErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiRequestError)) {
    return null;
  }

  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED': {
      const seconds = error.retryAfterSeconds;
      const wait = seconds
        ? ` Esperá ${seconds} segundo${seconds === 1 ? '' : 's'} e intentá de nuevo.`
        : ' Intentá de nuevo en un momento.';
      return `Hiciste demasiadas búsquedas seguidas.${wait}`;
    }
    case 'PLACES_PROVIDER_UNAVAILABLE':
      return 'El buscador de direcciones no está disponible. Probá de nuevo en un momento.';
    default:
      return null;
  }
}
