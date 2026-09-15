/**
 * Codigos que no vienen del backend sino de la conexion: la solicitud no llego
 * o no hubo respuesta a tiempo.
 */
export const CONNECTION_ERROR_CODES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const;

/**
 * Unico tipo de error que sale de `transferBlackApi`. Las pantallas deciden que
 * mostrar mirando `status` y `code`, nunca el error crudo de Axios.
 */
export class ApiRequestError extends Error {
  /** `null` cuando no hubo respuesta HTTP (sin conexion, timeout). */
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number | null, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
