// Formas que manda el backend para el chat del viaje (seccion "Chat" del
// README). El casing es el que documenta el contrato: `snake_case` en lo que
// se envia, `camelCase` en lo que se recibe.

/** Un mensaje tal como lo devuelve el backend, tanto en `GET` como en `POST`. */
export interface ChatMessageResponse {
  id: string;
  tripId: string;
  senderId: string;
  senderRole: 'passenger' | 'provider';
  clientMessageId: string;
  content: string;
  createdAt: string;
  /** Siempre `null` hoy: el backend no lo usa todavia (ver README). */
  deliveredAt: string | null;
  readAt: string | null;
}

/**
 * `GET /trips/:tripId/messages` no envuelve en `data` como el resto de la API:
 * esta es la forma completa de la respuesta 200.
 */
export interface ChatMessagesListResponse {
  data: ChatMessageResponse[];
  next_cursor: string | null;
}

export interface SendChatMessageBody {
  client_message_id: string;
  content: string;
}

export interface MarkChatMessagesReadBody {
  up_to_message_id: string;
}

/**
 * Los errores del chat viajan en la raiz (`{ code, message }`), a diferencia
 * del resto de la API (`{ error: { code, message } }`). En `VALIDATION_ERROR`
 * `message` es un array de strings en vez de uno solo.
 */
export interface ChatErrorResponse {
  code: string;
  message: string | string[];
}
