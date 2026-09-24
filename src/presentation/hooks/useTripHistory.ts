import { useCallback, useEffect, useRef, useState } from 'react';

import { listTripsAction } from '@/core/actions/list-trips.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { TripHistoryFilter, TripHistoryItem } from '@/infrastructure/interfaces/trips';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

const PAGE_SIZE = 20;

type LoadMode = 'initial' | 'more' | 'refresh';

interface PendingRequest {
  page: number;
  mode: LoadMode;
}

/**
 * Historial paginado a mano (sin TanStack Query, decision del ticket).
 *
 * Cambiar de filtro reinicia la lista y pide la pagina 1 de nuevo. Como cada
 * pedido puede tardar, se descarta cualquier respuesta que no sea la del
 * ultimo pedido en marcha (por ejemplo, la del filtro anterior llegando tarde).
 */
export function useTripHistory() {
  const [filter, setFilter] = useState<TripHistoryFilter>('all');
  const [items, setItems] = useState<TripHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se incrementa en cada pedido: una respuesta que llega con un id viejo es de
  // un pedido que ya no importa (filtro cambiado, refresh encima de un loadMore).
  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<PendingRequest>({ page: 1, mode: 'initial' });

  const load = useCallback(async (targetFilter: TripHistoryFilter, targetPage: number, mode: LoadMode) => {
    const requestId = ++requestIdRef.current;
    lastRequestRef.current = { page: targetPage, mode };

    if (mode === 'initial') setIsLoading(true);
    else if (mode === 'more') setIsLoadingMore(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const result = await listTripsAction({ page: targetPage, limit: PAGE_SIZE, filter: targetFilter });
      if (requestId !== requestIdRef.current) return;

      setItems((current) => (mode === 'more' ? [...current, ...result.items] : result.items));
      setPage(result.page);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch (reason: unknown) {
      if (requestId !== requestIdRef.current) return;

      if (reason instanceof ApiRequestError && reason.status === 401) {
        handleExpiredSession();
        return;
      }
      setError(getApiErrorMessage(reason, 'No pudimos cargar tus viajes.'));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(filter, 1, 'initial');
  }, [filter, load]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || isRefreshing || error || page >= totalPages) return;
    void load(filter, page + 1, 'more');
  }, [error, filter, isLoading, isLoadingMore, isRefreshing, load, page, totalPages]);

  const refresh = useCallback(() => {
    void load(filter, 1, 'refresh');
  }, [filter, load]);

  const retry = useCallback(() => {
    const pending = lastRequestRef.current;
    void load(filter, pending.page, pending.mode);
  }, [filter, load]);

  return {
    items,
    filter,
    setFilter,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore: page < totalPages,
    loadMore,
    refresh,
    retry,
  };
}
