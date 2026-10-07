import axios, { isAxiosError } from 'axios';

import { captureUnexpectedApiError } from '@/core/monitoring/sentry';
import type { ApiErrorResponse, ApiValidationIssue } from '@/infrastructure/interfaces/api-responses';
import type { ChatErrorResponse } from '@/infrastructure/interfaces/chat-api';

import { getApiUrl } from './api-config';
import { ApiRequestError, CONNECTION_ERROR_CODES } from './api-request-error';
import { refreshAccessToken } from './session-refresh';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Rutas publicas que no deben enviar ni intentar renovar la sesion actual. */
    skipAuth?: boolean;
  }

  interface InternalAxiosRequestConfig {
    /** Ya se reintento con un token renovado: un segundo 401 no vuelve a renovar. */
    sessionRetried?: boolean;
    /** Rutas publicas que no deben enviar ni intentar renovar la sesion actual. */
    skipAuth?: boolean;
  }
}

/** Ruta de renovacion: un 401 aca no dispara otra renovacion. */
export const REFRESH_PATH = '/auth/refresh';

/**
 * 401 que ya significan que la cuenta no tiene (ni va a tener) una sesion
 * valida: la cuenta fue revocada o eliminada. Ningun refresh la reactiva, asi
 * que intentarlo solo gasta una llamada a `/auth/refresh` (que vuelve a
 * fallar con el mismo motivo) antes de llegar al mismo resultado.
 */
const TERMINATED_SESSION_CODES = new Set(['SESSION_REVOKED', 'ACCOUNT_DELETED']);

// El backend en Render se duerme sin trafico y la primera solicitud puede tardar
// casi un minuto en despertarlo: un timeout corto lo haria fallar siempre.
const REQUEST_TIMEOUT_MS = 60_000;

export const transferBlackApi = axios.create({
  baseURL: getApiUrl(),
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

let getAccessToken: () => string | null = () => null;

/**
 * Registra de donde sale el access token. Lo llama el store de sesion: asi
 * `core` no depende de la capa de presentacion.
 */
export function setAccessTokenGetter(getter: () => string | null): void {
  getAccessToken = getter;
}

/** Access token vigente, para quien no pasa por Axios (el socket). */
export function getCurrentAccessToken(): string | null {
  return getAccessToken();
}

transferBlackApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  // Una solicitud que ya trae su propio Authorization lo conserva.
  if (token && !config.skipAuth && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

transferBlackApi.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // Access token vencido (dura 15 minutos): se renueva una vez y se repite la
    // solicitud, sin que la pantalla se entere. Si no se puede renovar, el 401
    // sigue su camino y la pantalla cierra la sesion como siempre.
    if (isAxiosError(error) && error.response?.status === 401 && error.config) {
      const config = error.config;
      const data = error.response.data;
      const isTerminatedSession = isApiErrorResponse(data) && TERMINATED_SESSION_CODES.has(data.error.code);
      const canRetry =
        !config.sessionRetried &&
        config.url !== REFRESH_PATH &&
        Boolean(config.headers.Authorization) &&
        !isTerminatedSession;

      if (canRetry) {
        let token: string | null;
        try {
          token = await refreshAccessToken();
        } catch (refreshError: unknown) {
          // La renovacion no respondio (sin red): se informa eso, no un 401,
          // para que la pantalla no cierre una sesion que sigue siendo valida.
          return rejectAsApiError(refreshError instanceof ApiRequestError ? refreshError : toApiRequestError(refreshError));
        }

        if (token) {
          config.sessionRetried = true;
          config.headers.Authorization = `Bearer ${token}`;
          return transferBlackApi(config);
        }
      }
    }

    return rejectAsApiError(toApiRequestError(error));
  },
);

/** Un error de servidor o con forma inesperada va a Sentry; uno de negocio (4xx) no. */
function rejectAsApiError(error: ApiRequestError): Promise<never> {
  captureUnexpectedApiError(error);
  return Promise.reject(error);
}

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false;
  }

  const { error } = body;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/**
 * Compatibilidad con un backend del chat todavia no redesplegado: antes
 * mandaba los errores en la raiz (`{ code, message }`) en vez de envueltos en
 * `error` como el resto de la API. Desde `e0a5f77` el chat tambien envuelve,
 * pero esta rama se deja por si algun ambiente sigue en la version vieja. Se
 * descarta cualquier cuerpo que ya haya matcheado `isApiErrorResponse` para no
 * confundir una forma con la otra.
 */
function isChatErrorResponse(body: unknown): body is ChatErrorResponse {
  if (typeof body !== 'object' || body === null || 'error' in body) {
    return false;
  }

  return 'code' in body && 'message' in body && typeof (body as { code: unknown }).code === 'string';
}

/** El backend del chat manda el numero de segundos en `Retry-After` (429). */
function getRetryAfterSeconds(headers: Record<string, unknown> | undefined): number | null {
  const raw = headers?.['retry-after'];
  const seconds = typeof raw === 'string' ? Number(raw) : null;
  return seconds !== null && Number.isFinite(seconds) ? seconds : null;
}

/**
 * En `VALIDATION_ERROR` el backend manda un array de `issues` de Zod en vez de
 * un solo texto: se junta en una sola linea para que `ApiRequestError.message`
 * sea siempre un string, sin importar que endpoint respondio.
 */
function joinValidationMessage(message: string | ApiValidationIssue[]): string {
  if (!Array.isArray(message)) return message;

  return message
    .map((issue) => (typeof issue === 'object' && issue !== null ? issue.message : String(issue)))
    .join(' ');
}

function toApiRequestError(error: unknown): ApiRequestError {
  if (!isAxiosError(error)) {
    return new ApiRequestError(null, CONNECTION_ERROR_CODES.UNKNOWN, 'Error inesperado');
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiRequestError(null, CONNECTION_ERROR_CODES.TIMEOUT, 'El servidor no respondio a tiempo');
  }

  if (!error.response) {
    return new ApiRequestError(null, CONNECTION_ERROR_CODES.NETWORK, 'No se pudo conectar con el servidor');
  }

  const { status, data, headers } = error.response;
  const retryAfterSeconds = getRetryAfterSeconds(headers as Record<string, unknown> | undefined);

  if (isApiErrorResponse(data)) {
    return new ApiRequestError(
      status,
      data.error.code,
      joinValidationMessage(data.error.message),
      data.error.details ?? null,
      retryAfterSeconds,
    );
  }

  if (isChatErrorResponse(data)) {
    // En VALIDATION_ERROR el backend manda un array de issues en vez de un solo texto.
    const message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    return new ApiRequestError(status, data.code, message, null, retryAfterSeconds);
  }

  return new ApiRequestError(
    status,
    CONNECTION_ERROR_CODES.UNKNOWN,
    `Respuesta inesperada del servidor (${status})`,
    null,
    retryAfterSeconds,
  );
}
