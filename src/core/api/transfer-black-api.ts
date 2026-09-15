import axios, { isAxiosError } from 'axios';

import type { ApiErrorResponse } from '@/infrastructure/interfaces/api-responses';

import { getApiUrl } from './api-config';
import { ApiRequestError, CONNECTION_ERROR_CODES } from './api-request-error';

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
  (error: unknown) => Promise.reject(toApiRequestError(error)),
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
