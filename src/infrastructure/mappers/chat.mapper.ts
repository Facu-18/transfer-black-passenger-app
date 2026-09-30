import type { ChatMessage, ChatMessagesPage } from '@/infrastructure/interfaces/chat';
import type { ChatMessageResponse, ChatMessagesListResponse } from '@/infrastructure/interfaces/chat-api';

/** Convierte los mensajes del backend al modelo que usa la app. */
export const ChatMapper = {
  toMessage(response: ChatMessageResponse, currentUserId: string): ChatMessage {
    return {
      id: response.id,
      clientMessageId: response.clientMessageId,
      tripId: response.tripId,
      senderId: response.senderId,
      content: response.content,
      createdAt: new Date(response.createdAt),
      readAt: response.readAt ? new Date(response.readAt) : null,
      isMine: response.senderId === currentUserId,
      status: 'sent',
    };
  },

  toPage(response: ChatMessagesListResponse, currentUserId: string): ChatMessagesPage {
    return {
      items: response.data.map((message) => ChatMapper.toMessage(message, currentUserId)),
      nextCursor: response.next_cursor,
    };
  },
};
