import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentUserAction } from '@/core/actions/get-current-user.action';
import { getResumableTripAction } from '@/core/actions/get-resumable-trip.action';
import { refreshSessionAction } from '@/core/actions/refresh-session.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';
import {
  MAX_UNSTABLE_RESUME_ATTEMPTS,
  tripResumeAttemptStorage,
} from '@/infrastructure/storage/trip-resume-attempt-storage';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useSessionRestoreStore } from '@/presentation/store/useSessionRestoreStore';

export type SessionRestoreStatus = 'restoring' | 'retry' | 'done';

/**
 * Decide si el viaje encontrado se retoma solo o se ofrece abrir a mano.
 *
 * Cada apertura suma un intento en `tripResumeAttemptStorage` (ver ese
 * archivo). Un cierre aislado (cerrar la app a mano en los primeros segundos)
 * no impide volver al viaje: recien si la app se cerro mostrandolo
 * `MAX_UNSTABLE_RESUME_ATTEMPTS` veces seguidas se deja de navegar sola
 * (repetiria el cierre) y `crashedTripId` hace que el Home lo ofrezca.
 */
async function applyResumableTrip(tripId: string | null): Promise<void> {
  if (!tripId) {
    useSessionRestoreStore.getState().setResumeTripId(null);
    return;
  }

  const attempts = await tripResumeAttemptStorage.recordAttempt(tripId);
  if (attempts > MAX_UNSTABLE_RESUME_ATTEMPTS) {
    await tripResumeAttemptStorage.clear();
    useSessionRestoreStore.getState().setResumeTripId(null);
    useSessionRestoreStore.getState().setCrashedTripId(tripId);
    return;
  }

  useSessionRestoreStore.getState().setResumeTripId(tripId);
}

/**
 * Al abrir la app: si hay un refresh token guardado, renueva la sesion y
 * carga el perfil antes de decidir rutas publicas o privadas. Un rechazo del
 * backend (4xx: refresh token vencido o revocado, cuenta revocada o
 * eliminada) cierra la sesion local; un corte de red no, para no desloguear
 * a alguien que sigue con una sesion valida. Con la sesion restaurada,
 * tambien busca un viaje inmediato en curso (o un borrador esperando el
 * pago) para retomarlo de una, en `useSessionRestoreStore`.
 */
export function useSessionRestore() {
  const [status, setStatus] = useState<SessionRestoreStatus>('restoring');
  const isMountedRef = useRef(true);
  // Single-flight: una doble invocacion (el doble efecto de StrictMode en
  // desarrollo, o un reintento mientras el primero todavia corre) no puede
  // disparar dos renovaciones con el mismo refresh token todavia sin rotar
  // (el backend lo rota en cada uso; la segunda llegaria con uno ya usado y
  // cerraria una sesion que la primera acababa de restaurar bien).
  const inFlightRef = useRef<Promise<void> | null>(null);

  const restore = useCallback((): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current;

    if (isMountedRef.current) setStatus('restoring');

    const run = async () => {
      const refreshToken = await refreshTokenStorage.get();
      if (!refreshToken) {
        if (isMountedRef.current) setStatus('done');
        return;
      }

      try {
        const session = await refreshSessionAction(refreshToken);
        // El refresh token ya rotó del lado del backend: se persiste el
        // nuevo antes de cualquier otra cosa, incluso si el componente se
        // desmonto mientras tanto, para no quedarse con uno ya quemado.
        await useAuthStore.getState().updateTokens(session);

        // Perfil y viaje para retomar a la vez (los dos solo necesitan el token
        // nuevo): ahorra una ida y vuelta al backend en cada arranque. Un fallo del
        // viaje no bloquea el ingreso; uno del perfil si (lo maneja el catch de abajo).
        const [user, resumable] = await Promise.all([
          getCurrentUserAction(),
          getResumableTripAction().catch(() => undefined),
        ]);
        useAuthStore.getState().markAuthenticated(user);

        // `undefined`: no se pudo saber; se entra como si no hubiera viaje.
        if (resumable !== undefined) {
          await applyResumableTrip(resumable?.id ?? null);
        }

        if (isMountedRef.current) setStatus('done');
      } catch (error: unknown) {
        // El backend rechazo la renovacion o el perfil (token vencido,
        // revocado, o la cuenta ya no es valida: `SESSION_REVOKED` o
        // `ACCOUNT_DELETED`): no hay nada que reintentar.
        if (error instanceof ApiRequestError && error.status !== null && error.status < 500) {
          await refreshTokenStorage.clear();
          if (isMountedRef.current) setStatus('done');
          return;
        }

        // Sin red o el servidor no respondio: el refresh token sigue siendo
        // valido, se ofrece reintentar en vez de cerrar la sesion.
        if (isMountedRef.current) setStatus('retry');
      }
    };

    const promise = run().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void restore();

    return () => {
      isMountedRef.current = false;
    };
  }, [restore]);

  return { status, retry: restore };
}
