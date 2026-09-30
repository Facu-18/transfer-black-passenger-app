import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ChatMessagesListResponse } from '@/infrastructure/interfaces/chat-api';
import type { ChatMessagesPage } from '@/infrastructure/interfaces/chat';
import { ChatMapper } from '@/infrastructure/mappers/chat.mapper';

export interface ListChatMessagesParams {
  tripId: string;
  /** Id del usuario de la sesion actual, para marcar `isMine` en el mapeo. */
  currentUserId: string;
  limit?: number;
  /** Cursor para pedir mensajes mas viejos (scroll hacia arriba). No se manda junto con `after`. */
  before?: string;
  /** Id de un mensaje ya conocido: trae solo los mas nuevos (catch-up). No se manda junto con `before`. */
  after?: string;
}

/**
 * Mensajes del chat del viaje, mas nuevos primero (`createdAt DESC`).
 *
 * A diferencia del resto de la API, esta respuesta no viene envuelta en
 * `data`: el cuerpo ya es `{ data, next_cursor }`.
 */
export async function listChatMessagesAction({
  tripId,
  currentUserId,
  limit,
  before,
  after,
}: ListChatMessagesParams): Promise<ChatMessagesPage> {
  const { data } = await transferBlackApi.get<ChatMessagesListResponse>(`/trips/${tripId}/messages`, {
    params: { limit, before, after },
  });

  return ChatMapper.toPage(data, currentUserId);
}
