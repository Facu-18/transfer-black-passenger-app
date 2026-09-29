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

export function useCorporateEligibility() {
  const [membership, setMembership] = useState<CorporateMembership | null>(cachedAt > 0 ? cachedMembership : null);
  const [isLoading, setIsLoading] = useState(cachedAt === 0);

  const load = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);

    try {
      setMembership(await fetchMembership(forceRefresh));
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }
      // Sin vinculo confirmado no se ofrece la opcion corporativa: fallar en
      // silencio es preferible a bloquear Home o Cotizacion por esto.
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { membership, isLoading, refresh };
}
