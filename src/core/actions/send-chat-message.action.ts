import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ChatMessage } from '@/infrastructure/interfaces/chat';
import type { ChatMessageResponse, SendChatMessageBody } from '@/infrastructure/interfaces/chat-api';
import { ChatMapper } from '@/infrastructure/mappers/chat.mapper';

export interface SendChatMessageParams {
  tripId: string;
  currentUserId: string;
  /** UUID generado en el dispositivo: identifica el intento, no el mensaje. */
  clientMessageId: string;
  content: string;
}

/**
 * Manda un mensaje (siempre por REST, nunca por socket).
 *
 * 201 es un mensaje nuevo y 200 es el mismo `clientMessageId` ya recibido
 * antes (idempotente): en los dos casos el cuerpo es el mensaje, sin `data`.
 * Reintentar un envio fallido con el mismo `clientMessageId` nunca lo duplica.
 */
export async function sendChatMessageAction({
  tripId,
  currentUserId,
  clientMessageId,
  content,
}: SendChatMessageParams): Promise<ChatMessage> {
  const body: SendChatMessageBody = { client_message_id: clientMessageId, content };
  const { data } = await transferBlackApi.post<ChatMessageResponse>(`/trips/${tripId}/messages`, body);

  return ChatMapper.toMessage(data, currentUserId);
}
