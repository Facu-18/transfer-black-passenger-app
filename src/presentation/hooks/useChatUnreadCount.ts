import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listChatMessagesAction } from '@/core/actions/list-chat-messages.action';
import { useAuthStore } from '@/presentation/store/useAuthStore';

/** Poll liviano del contador de chat sin leer: no hace falta tiempo real para un numero en un badge. */
const POLL_INTERVAL_MS = 10_000;
/** Alcanza con la pagina mas reciente: un no leido mas viejo que esto ya se vio igual al entrar al chat. */
const PAGE_SIZE = 30;

/**
 * Mensajes del chofer sin leer, para el badge del boton de chat del viaje
 * activo. Solo consulta mientras `enabled` (chofer asignado) y la pantalla
 * que lo pide esta enfocada.
 */
export function useChatUnreadCount(tripId: string | null, enabled: boolean): number {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [count, setCount] = useState(0);

  const check = useCallback(async () => {
    if (!tripId || !currentUserId) return;
    try {
      const page = await listChatMessagesAction({ tripId, currentUserId, limit: PAGE_SIZE });
      setCount(page.items.filter((message) => !message.isMine && message.readAt === null).length);
    } catch {
      // Un fallo puntual no rompe el badge: se reintenta en el proximo ciclo.
    }
  }, [tripId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !tripId) {
        setCount(0);
        return;
      }

      void check();
      const timer = setInterval(() => void check(), POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [enabled, tripId, check]),
  );

  return count;
}
