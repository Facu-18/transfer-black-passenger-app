import { ApiRequestError, CONNECTION_ERROR_CODES } from '@/core/api/api-request-error';

/**
 * Mensaje para el usuario ante un error sin tratamiento propio en la pantalla
 * (conexion, timeout, validacion). `fallback` describe la operacion que fallo.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  switch (error.code) {
    case CONNECTION_ERROR_CODES.NETWORK:
      return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
    case CONNECTION_ERROR_CODES.TIMEOUT:
      return 'El servidor está tardando en responder. Intenta de nuevo en unos segundos.';
    case 'VALIDATION_ERROR':
      return 'Revisa los datos ingresados.';
    default:
      return fallback;
  }
}
