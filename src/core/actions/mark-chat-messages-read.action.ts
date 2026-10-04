import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { MarkChatMessagesReadBody } from '@/infrastructure/interfaces/chat-api';

export interface MarkChatMessagesReadParams {
  tripId: string;
  /** Marca como leidos todos los mensajes del otro participante hasta este id, inclusive. */
  upToMessageId: string;
}

/** Marca como leidos los mensajes del chofer hasta `upToMessageId`. Responde 204. */
export async function markChatMessagesReadAction({ tripId, upToMessageId }: MarkChatMessagesReadParams): Promise<void> {
  const body: MarkChatMessagesReadBody = { up_to_message_id: upToMessageId };
  await transferBlackApi.post(`/trips/${tripId}/messages/read`, body);
}
