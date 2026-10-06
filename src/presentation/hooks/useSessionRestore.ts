import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentUserAction } from '@/core/actions/get-current-user.action';
import { getResumableTripAction } from '@/core/actions/get-resumable-trip.action';
import { refreshSessionAction } from '@/core/actions/refresh-session.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useSessionRestoreStore } from '@/presentation/store/useSessionRestoreStore';

export type SessionRestoreStatus = 'restoring' | 'retry' | 'done';

/**
 * Al abrir la app: si hay un refresh token guardado, renueva la sesion y
 * carga el perfil antes de decidir rutas publicas o privadas. Un rechazo del
 * backend (4xx: refresh token vencido o revocado) cierra la sesion local; un
 * corte de red no, para no desloguear a alguien que sigue con una sesion
 * valida. Con la sesion restaurada, tambien busca un viaje inmediato en
 * curso (o un borrador esperando el pago) para retomarlo de una, en
 * `useSessionRestoreStore`.
 */
export function useSessionRestore() {
  const [status, setStatus] = useState<SessionRestoreStatus>('restoring');
  // Descarta una renovacion vieja si se pidio reintentar antes de que terminara.
  const attempt = useRef(0);

  const restore = useCallback(async () => {
    const thisAttempt = ++attempt.current;
    setStatus('restoring');

    const refreshToken = await refreshTokenStorage.get();
    if (!refreshToken) {
      if (thisAttempt === attempt.current) setStatus('done');
      return;
    }

    try {
      const session = await refreshSessionAction(refreshToken);
      await useAuthStore.getState().updateTokens(session);

      const user = await getCurrentUserAction();
      if (thisAttempt !== attempt.current) return;
      useAuthStore.getState().markAuthenticated(user);

      // Sin viaje para retomar no bloquea el ingreso: se entra igual al Home.
      try {
        const resumable = await getResumableTripAction();
        if (thisAttempt === attempt.current) {
          useSessionRestoreStore.getState().setResumeTripId(resumable?.id ?? null);
        }
      } catch {
        // No hay nada que retomar con certeza: se entra como si no hubiera viaje.
      }

      if (thisAttempt === attempt.current) setStatus('done');
    } catch (error: unknown) {
      if (thisAttempt !== attempt.current) return;

      // El backend rechazo la renovacion o el perfil (token vencido, revocado,
      // o la cuenta ya no es valida): no hay nada que reintentar.
      if (error instanceof ApiRequestError && error.status !== null && error.status < 500) {
        await refreshTokenStorage.clear();
        setStatus('done');
        return;
      }

      // Sin red o el servidor no respondio: el refresh token sigue siendo
      // valido, se ofrece reintentar en vez de cerrar la sesion.
      setStatus('retry');
    }
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  return { status, retry: restore };
}
