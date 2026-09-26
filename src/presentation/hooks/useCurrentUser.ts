import { useCallback, useEffect, useState } from 'react';

import { getCurrentUserAction } from '@/core/actions/get-current-user.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/**
 * Trae el perfil actualizado al entrar al Home. Mientras carga, `isLoading`
 * permite mostrar el skeleton del saludo; los datos quedan en `useAuthStore`.
 */
export function useCurrentUser(enabled = true) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => setRequestVersion((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setHasError(false);

    getCurrentUserAction()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          handleExpiredSession();
          return;
        }
        // Sin perfil actualizado se sigue con el que vino del login: el saludo no bloquea el Home.
        setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, requestVersion, setUser]);

  return { user, isLoading, hasError, retry };
}
