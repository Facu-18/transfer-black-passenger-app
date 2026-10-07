// Monitoreo de errores con Sentry. Sin DSN (o en desarrollo, salvo que se
// pida a mano) queda desactivado: no hace falta un proyecto real de Sentry
// para desarrollar o probar la app.

import * as Sentry from '@sentry/react-native';

import { ApiRequestError, CONNECTION_ERROR_CODES } from '@/core/api/api-request-error';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
/** Via para forzar Sentry en desarrollo (probar el envio a mano), sin tocar el DSN. */
const forceInDev = process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === 'true';

export const isSentryEnabled = Boolean(dsn) && (!__DEV__ || forceInDev);

/** Se llama una sola vez, antes de montar la app (ver `src/app/_layout.tsx`). */
export function initSentry(): void {
  if (!isSentryEnabled) return;

  Sentry.init({
    dsn,
    // Solo errores por ahora: sin trazas de rendimiento ni session replay.
    tracesSampleRate: 0,
  });
}

/** Envuelve el componente raiz: captura errores de render y agrega contexto de navegacion. */
export const wrapWithSentry = Sentry.wrap;

/** Identifica al usuario en los reportes solo por id, nunca por email u otro dato personal. */
export function setSentryUser(userId: string | null): void {
  if (!isSentryEnabled) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

/**
 * Solo las fallas de servidor o con forma inesperada son un problema de la
 * app: un error de negocio (4xx, "contraseña incorrecta", "tarifa vencida"...)
 * es un flujo esperado y no tiene que llenar Sentry de ruido.
 */
export function captureUnexpectedApiError(error: unknown): void {
  if (!isSentryEnabled || !(error instanceof ApiRequestError)) return;

  const isServerFault = error.status !== null && error.status >= 500;
  const isUnexpectedShape = error.code === CONNECTION_ERROR_CODES.UNKNOWN;

  if (isServerFault || isUnexpectedShape) {
    Sentry.captureException(error);
  }
}

/**
 * Error de render atrapado por un `ErrorBoundary` de ruta (ver
 * `src/app/_layout.tsx` y `src/app/(app)/trip/[tripId].tsx`). A diferencia
 * de `captureUnexpectedApiError`, esto no filtra por tipo: si React llego a
 * tirar abajo una pantalla, siempre es un problema de la app.
 */
export function captureRenderError(error: unknown): void {
  if (!isSentryEnabled) return;
  Sentry.captureException(error);
}
