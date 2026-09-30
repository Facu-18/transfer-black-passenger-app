// Modelo de chat que usa la app. La respuesta cruda del backend no llega a
// los componentes: se mapea a esto antes (`infrastructure/mappers/chat.mapper.ts`).

/**
 * `sending`: recien se mando, esperando confirmacion. `sent`: confirmado por
 * el backend (REST o socket). `failed`: no se pudo mandar; se reintenta con el
 * mismo `clientMessageId`, que evita duplicarlo si el backend si lo recibio.
 */
export type ChatMessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  /** Id del backend; mientras esta `sending` o `failed` es el `clientMessageId`. */
  id: string;
  clientMessageId: string;
  tripId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  /** `null` mientras el otro participante no lo leyo. */
  readAt: Date | null;
  /** `true` si lo mando el usuario de la sesion actual. */
  isMine: boolean;
  status: ChatMessageStatus;
}

export interface ChatMessagesPage {
  items: ChatMessage[];
  nextCursor: string | null;
}
