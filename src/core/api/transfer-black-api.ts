import axios, { isAxiosError } from 'axios';

import type { ApiErrorResponse } from '@/infrastructure/interfaces/api-responses';

import { getApiUrl } from './api-config';
import { ApiRequestError, CONNECTION_ERROR_CODES } from './api-request-error';
import { refreshAccessToken } from './session-refresh';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** Ya se reintento con un token renovado: un segundo 401 no vuelve a renovar. */
    sessionRetried?: boolean;
  }
}

/** Ruta de renovacion: un 401 aca no dispara otra renovacion. */
export const REFRESH_PATH = '/auth/refresh';

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
  if (token && !config.headers.Authorization) {
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
      const canRetry =
        !config.sessionRetried && config.url !== REFRESH_PATH && Boolean(config.headers.Authorization);

      if (canRetry) {
        let token: string | null;
        try {
          token = await refreshAccessToken();
        } catch (refreshError: unknown) {
          // La renovacion no respondio (sin red): se informa eso, no un 401,
          // para que la pantalla no cierre una sesion que sigue siendo valida.
          return Promise.reject(
            refreshError instanceof ApiRequestError ? refreshError : toApiRequestError(refreshError),
          );
        }

        if (token) {
          config.sessionRetried = true;
          config.headers.Authorization = `Bearer ${token}`;
          return transferBlackApi(config);
        }
      }
    }

    return Promise.reject(toApiRequestError(error));
  },
);

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false;
  }

  const { error } = body;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
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

  const { status, data } = error.response;

  if (isApiErrorResponse(data)) {
    return new ApiRequestError(status, data.error.code, data.error.message, data.error.details ?? null);
  }

  return new ApiRequestError(status, CONNECTION_ERROR_CODES.UNKNOWN, `Respuesta inesperada del servidor (${status})`);
}
