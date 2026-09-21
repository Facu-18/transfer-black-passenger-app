type SessionRefresher = () => Promise<string | null>;

let refresher: SessionRefresher | null = null;
let inFlight: Promise<string | null> | null = null;

/**
 * Registra como se renueva la sesion. Lo llama el store de sesion, igual que
 * `setAccessTokenGetter`: asi `core` no depende de la capa de presentacion.
 */
export function setSessionRefresher(fn: SessionRefresher): void {
  refresher = fn;
}

/**
 * Pide un access token nuevo.
 *
 * - Devuelve `null` si la sesion ya no se puede renovar (refresh token vencido
 *   o revocado): hay que volver a iniciar sesion.
 * - Rechaza si la renovacion no llego a responder (sin red, timeout): la sesion
 *   sigue siendo valida y conviene reintentar mas tarde, no cerrarla.
 *
 * El refresh token rota en cada uso: si dos solicitudes lo mandaran a la vez,
 * la segunda llegaria con uno ya invalidado y cerraria la sesion. Por eso todas
 * las que lleguen mientras hay una renovacion en curso esperan esa misma.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refresher) {
    return Promise.resolve(null);
  }

  inFlight ??= refresher().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
