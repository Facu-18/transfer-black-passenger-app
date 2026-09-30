import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getTripAction } from '@/core/actions/get-trip.action';
import { listChatMessagesAction } from '@/core/actions/list-chat-messages.action';
import { markChatMessagesReadAction } from '@/core/actions/mark-chat-messages-read.action';
import { sendChatMessageAction } from '@/core/actions/send-chat-message.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { realtimeClient } from '@/core/api/realtime-client';
import type { ChatMessage } from '@/infrastructure/interfaces/chat';
import { ChatMapper } from '@/infrastructure/mappers/chat.mapper';
import type { TripDriver, TripStatus } from '@/infrastructure/interfaces/trips';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

const MESSAGES_PAGE_SIZE = 30;
/** Poll rapido mientras no hay tiempo real: mismo orden que un chat en vivo. */
const POLLING_INTERVAL_MS = 4_000;
/** Con tiempo real el socket avisa solo; esto es red de seguridad por si se pierde un evento. */
const REALTIME_SAFETY_POLL_MS = 30_000;
/** Sin tiempo real, `after` no trae de vuelta el `readAt` de los mensajes propios ya cargados. */
const READ_STATE_REFRESH_MS = 15_000;
/** Espera antes de marcar como leido: evita mandar una solicitud por cada mensaje que llega junto. */
const MARK_READ_DEBOUNCE_MS = 1_200;

export type ChatConnectionMode = 'connecting' | 'realtime' | 'polling';

/** Mezcla mensajes nuevos con los existentes, mas nuevos primero, sin duplicar. */
function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;

  const byKey = new Map<string, ChatMessage>();
  // Los que llegan ahora pisan a los que ya estaban (traen el readAt al dia).
  for (const message of current) byKey.set(message.clientMessageId, message);
  for (const message of incoming) byKey.set(message.clientMessageId, message);

  return Array.from(byKey.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Id del mensaje mas nuevo ya confirmado por el backend (no uno optimista todavia `sending`/`failed`). */
function newestServerId(messages: ChatMessage[]): string | null {
  return messages.find((message) => message.status === 'sent')?.id ?? null;
}

/**
 * Chat del viaje: carga y pagina el historial, manda mensajes de forma
 * optimista y se mantiene al dia por socket (si el backend confirma la sala)
 * o por polling (si no, hoy el caso real: ver README).
 */
export function useTripChat(tripId: string | null) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const [driver, setDriver] = useState<TripDriver | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [isThirdParty, setIsThirdParty] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const [composerText, setComposerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [rateLimitSecondsRemaining, setRateLimitSecondsRemaining] = useState<number | null>(null);

  const [connectionMode, setConnectionMode] = useState<ChatConnectionMode>('connecting');

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const isFocusedRef = useRef(true);
  const lastMarkedReadIdRef = useRef<string | null>(null);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionExpiredRef = useRef(false);

  const expireSession = useCallback(() => {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true;
    handleExpiredSession();
  }, []);

  // Cabecera: chofer y estado del viaje. Los cambios en vivo los muestra
  // ActiveTripScreen; aca solo hace falta tenerlos al abrir y al volver.
  const loadHeader = useCallback(async () => {
    if (!tripId) return;
    try {
      const trip = await getTripAction(tripId);
      setDriver(trip.driver);
      setTripStatus(trip.status);
      setIsThirdParty(trip.thirdParty !== null);
    } catch (reason: unknown) {
      if (reason instanceof ApiRequestError && reason.status === 401) {
        expireSession();
      }
      // Sin cabecera la pantalla sigue siendo util (el historial no depende de esto).
    }
  }, [tripId, expireSession]);

  const loadInitial = useCallback(async () => {
    if (!tripId || !currentUserId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const page = await listChatMessagesAction({ tripId, currentUserId, limit: MESSAGES_PAGE_SIZE });
      // No pisa lo que todavia no tiene id de servidor (un envio en curso o
      // fallido): se pierde el boton de reintento y la recuperacion de
      // CURSOR_NOT_FOUND si esto reemplaza la lista entera.
      setMessages((current) => mergeMessages(current, page.items));
      setNextCursor(page.nextCursor);
    } catch (reason: unknown) {
      if (reason instanceof ApiRequestError && reason.status === 401) {
        expireSession();
        return;
      }
      setLoadError(getApiErrorMessage(reason, 'No pudimos cargar el chat.'));
    } finally {
      setIsLoading(false);
    }
  }, [tripId, currentUserId, expireSession]);

  const loadOlder = useCallback(() => {
    if (!tripId || !currentUserId || !nextCursor || isLoadingOlder) return;

    setIsLoadingOlder(true);
    listChatMessagesAction({ tripId, currentUserId, limit: MESSAGES_PAGE_SIZE, before: nextCursor })
      .then((page) => {
        setMessages((current) => mergeMessages(current, page.items));
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        // Un fallo cargando historial viejo no bloquea el chat: se puede reintentar
        // volviendo a llegar arriba de la lista.
      })
      .finally(() => setIsLoadingOlder(false));
  }, [tripId, currentUserId, nextCursor, isLoadingOlder]);

  // Trae solo lo nuevo desde el ultimo mensaje confirmado (catch-up / poll rapido).
  const syncNew = useCallback(async () => {
    if (!tripId || !currentUserId) return;
    const after = newestServerId(messagesRef.current);

    try {
      const page = await listChatMessagesAction(
        after ? { tripId, currentUserId, after } : { tripId, currentUserId, limit: MESSAGES_PAGE_SIZE },
      );
      setMessages((current) => mergeMessages(current, page.items));
    } catch (reason: unknown) {
      if (reason instanceof ApiRequestError && reason.status === 401) {
        expireSession();
        return;
      }
      if (reason instanceof ApiRequestError && reason.code === 'CURSOR_NOT_FOUND') {
        // El mensaje de referencia ya no existe (no deberia pasar, pero no se pierde el chat).
        void loadInitial();
      }
      // Un poll que falla se reintenta solo en el proximo ciclo.
    }
  }, [tripId, currentUserId, expireSession, loadInitial]);

  // Refresca la pagina mas reciente completa: la unica forma de enterarse de
  // que el chofer leyo mensajes propios cuando no hay tiempo real.
  const syncReadState = useCallback(async () => {
    if (!tripId || !currentUserId) return;
    try {
      const page = await listChatMessagesAction({ tripId, currentUserId, limit: MESSAGES_PAGE_SIZE });
      setMessages((current) => mergeMessages(current, page.items));
    } catch {
      // Se reintenta en el proximo ciclo.
    }
  }, [tripId, currentUserId]);

  useEffect(() => {
    void loadHeader();
    void loadInitial();
  }, [loadHeader, loadInitial]);

  // Tiempo real: se intenta `chat.join`; si nadie confirma en el timeout, polling.
  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;
    setConnectionMode('connecting');

    realtimeClient.joinChat(tripId).then((ok) => {
      if (cancelled) return;
      setConnectionMode(ok ? 'realtime' : 'polling');
    });

    return () => {
      cancelled = true;
      realtimeClient.leaveChat(tripId);
    };
  }, [tripId]);

  // Eventos del socket: solo importan en modo tiempo real.
  useEffect(() => {
    if (!tripId || !currentUserId || connectionMode !== 'realtime') return;

    const unsubscribeCreated = realtimeClient.onChatMessageCreated((payload) => {
      if (payload.tripId !== tripId) return;
      setMessages((current) => mergeMessages(current, [ChatMapper.toMessage(payload, currentUserId)]));
    });

    const unsubscribeRead = realtimeClient.onChatMessageRead((event) => {
      if (event.trip_id !== tripId || event.reader_id === currentUserId) return;
      const readAt = new Date(event.read_at);
      setMessages((current) =>
        current.map((message) =>
          message.isMine && message.status === 'sent' && message.createdAt <= readAt && message.readAt === null
            ? { ...message, readAt }
            : message,
        ),
      );
    });

    return () => {
      unsubscribeCreated();
      unsubscribeRead();
    };
  }, [tripId, currentUserId, connectionMode]);

  // Reconexion del socket: lo que paso mientras estuvo caido no llego por evento.
  useEffect(() => {
    if (!tripId || connectionMode !== 'realtime') return;
    let wasDisconnected = false;

    return realtimeClient.onConnectionStateChange((state) => {
      if (state === 'reconnecting' || state === 'unauthorized') {
        wasDisconnected = true;
      } else if (state === 'connected' && wasDisconnected) {
        wasDisconnected = false;
        void realtimeClient.joinChat(tripId).then((ok) => setConnectionMode(ok ? 'realtime' : 'polling'));
        void syncNew();
      }
    });
  }, [tripId, connectionMode, syncNew]);

  // Poll rapido: solo mientras no hay tiempo real, y solo con la pantalla enfocada.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      void syncNew();

      return () => {
        isFocusedRef.current = false;
      };
    }, [syncNew]),
  );

  useEffect(() => {
    if (connectionMode !== 'polling') return;
    const timer = setInterval(() => {
      if (isFocusedRef.current) void syncNew();
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connectionMode, syncNew]);

  useEffect(() => {
    if (connectionMode !== 'realtime') return;
    const timer = setInterval(() => {
      if (isFocusedRef.current) void syncNew();
    }, REALTIME_SAFETY_POLL_MS);
    return () => clearInterval(timer);
  }, [connectionMode, syncNew]);

  // Estado de lectura de los mensajes propios: solo hace falta a mano sin tiempo real.
  useEffect(() => {
    if (connectionMode !== 'polling') return;
    const timer = setInterval(() => {
      if (isFocusedRef.current) void syncReadState();
    }, READ_STATE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [connectionMode, syncReadState]);

  // Al volver del segundo plano se pudo perder algun aviso.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isFocusedRef.current) void syncNew();
    });
    return () => subscription.remove();
  }, [syncNew]);

  // Marca como leidos los mensajes del chofer, con un debounce para no mandar
  // una solicitud por cada mensaje que llega junto.
  useEffect(() => {
    if (!tripId) return;
    const newestUnread = messages.find((message) => !message.isMine && message.readAt === null);
    if (!newestUnread || newestUnread.status !== 'sent') return;
    if (newestUnread.id === lastMarkedReadIdRef.current) return;

    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      if (!isFocusedRef.current) return;
      lastMarkedReadIdRef.current = newestUnread.id;
      markChatMessagesReadAction({ tripId, upToMessageId: newestUnread.id }).catch(() => {
        // Se reintenta solo: si sigue sin marcar, el proximo mensaje nuevo dispara este efecto de nuevo.
        lastMarkedReadIdRef.current = null;
      });
    }, MARK_READ_DEBOUNCE_MS);

    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [tripId, messages]);

  // Cuenta regresiva del 429: cuando llega a cero, se puede volver a intentar.
  useEffect(() => {
    if (rateLimitSecondsRemaining === null) return;
    if (rateLimitSecondsRemaining <= 0) {
      setRateLimitSecondsRemaining(null);
      return;
    }
    const timer = setTimeout(() => setRateLimitSecondsRemaining((value) => (value !== null ? value - 1 : null)), 1_000);
    return () => clearTimeout(timer);
  }, [rateLimitSecondsRemaining]);

  const submit = useCallback(
    (content: string, clientMessageId: string) => {
      if (!tripId || !currentUserId) return;

      const optimistic: ChatMessage = {
        id: clientMessageId,
        clientMessageId,
        tripId,
        senderId: currentUserId,
        content,
        createdAt: new Date(),
        readAt: null,
        isMine: true,
        status: 'sending',
      };

      setMessages((current) => mergeMessages(current, [optimistic]));

      sendChatMessageAction({ tripId, currentUserId, clientMessageId, content })
        .then((sent) => {
          setMessages((current) => mergeMessages(current, [sent]));
        })
        .catch((reason: unknown) => {
          if (reason instanceof ApiRequestError && reason.status === 401) {
            expireSession();
            return;
          }
          if (reason instanceof ApiRequestError && reason.code === 'CHAT_CLOSED') {
            setIsChatClosed(true);
          }
          if (reason instanceof ApiRequestError && reason.status === 429) {
            setRateLimitSecondsRemaining(reason.retryAfterSeconds ?? 30);
          }
          setMessages((current) =>
            current.map((message) => (message.clientMessageId === clientMessageId ? { ...message, status: 'failed' } : message)),
          );
        });
    },
    [tripId, currentUserId, expireSession],
  );

  const send = useCallback(() => {
    const content = composerText.trim();
    // El 429 tiene que respetarse tambien aca: el boton ya queda deshabilitado
    // en la pantalla, pero esto es lo que de verdad evita mandar de mas.
    if (!content || isSubmitting || rateLimitSecondsRemaining !== null) return;

    setComposerText('');
    setIsSubmitting(true);
    const clientMessageId = Crypto.randomUUID();
    submit(content, clientMessageId);
    // El envio es optimista: no hace falta esperar la respuesta para volver a escribir.
    setIsSubmitting(false);
  }, [composerText, isSubmitting, rateLimitSecondsRemaining, submit]);

  const retry = useCallback(
    (clientMessageId: string) => {
      // Mientras corre la cuenta regresiva del 429, reintentar solo lo prolongaria.
      if (rateLimitSecondsRemaining !== null) return;
      const failed = messagesRef.current.find((message) => message.clientMessageId === clientMessageId);
      if (!failed) return;
      submit(failed.content, clientMessageId);
    },
    [rateLimitSecondsRemaining, submit],
  );

  return {
    driver,
    tripStatus,
    isThirdParty,
    messages,
    isLoading,
    loadError,
    hasOlder: nextCursor !== null,
    isLoadingOlder,
    loadOlder,
    composerText,
    setComposerText,
    send,
    retry,
    isChatClosed,
    rateLimitSecondsRemaining,
    connectionMode,
    refresh: loadInitial,
  };
}
