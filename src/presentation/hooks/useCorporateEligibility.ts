import { useCallback, useEffect, useState } from 'react';

import { getCorporateMembershipAction } from '@/core/actions/get-corporate-membership.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { CorporateMembership } from '@/infrastructure/interfaces/corporate';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

/** Cuanto se reusa la ultima respuesta antes de volver a consultar `/corporate/membership/me`. */
const CACHE_TTL_MS = 60_000;

let cachedMembership: CorporateMembership | null = null;
let cachedAt = 0;
let inFlightRequest: Promise<CorporateMembership | null> | null = null;

// Cada hook montado se suscribe aca para volver a consultar cuando se invalida
// el cache (error al confirmar, viaje corporativo confirmado o logout).
const listeners = new Set<() => void>();

/**
 * Home ("Viaje corporativo") y Cotización (pastilla "Corporativo") necesitan
 * el mismo vínculo casi al mismo tiempo: se comparte una sola consulta con un
 * cache corto en vez de disparar una por pantalla.
 */
async function fetchMembership(forceRefresh: boolean): Promise<CorporateMembership | null> {
  const isFresh = cachedAt > 0 && Date.now() - cachedAt < CACHE_TTL_MS;
  if (!forceRefresh && isFresh) {
    return cachedMembership;
  }

  if (!inFlightRequest) {
    inFlightRequest = getCorporateMembershipAction()
      .then((membership) => {
        cachedMembership = membership;
        cachedAt = Date.now();
        return membership;
      })
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

/**
 * Descarta el cache compartido y hace que cada hook montado vuelva a
 * consultar `/corporate/membership/me`. Hay que llamarla despues de un error
 * de confirmacion corporativa (limite, empresa suspendida, etc.), despues de
 * confirmar un viaje corporativo (el remanente cambio) y en el logout, para
 * que el proximo usuario no vea el vinculo del anterior.
 */
export function invalidateCorporateEligibility(): void {
  cachedMembership = null;
  cachedAt = 0;
  listeners.forEach((notify) => notify());
}

export function useCorporateEligibility() {
  const [membership, setMembership] = useState<CorporateMembership | null>(cachedAt > 0 ? cachedMembership : null);
  const [isLoading, setIsLoading] = useState(cachedAt === 0);
  const [error, setError] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(false);

    try {
      setMembership(await fetchMembership(forceRefresh));
    } catch (err: unknown) {
      if (err instanceof ApiRequestError && err.status === 401) {
        handleExpiredSession();
        return;
      }
      // No se pudo confirmar el vinculo: se limpia para no ofrecer una opcion
      // corporativa vieja, pero se distingue de "no vinculado" con `error`
      // para que la pantalla pueda ofrecer reintentar en vez de mandar a
      // vincular una cuenta que en realidad ya esta vinculada.
      setMembership(null);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const notify = () => void load(true);
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { membership, isLoading, error, refresh };
}
