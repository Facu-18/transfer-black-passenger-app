import { Check, CheckCheck, RotateCw } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { ChatMessage } from '@/infrastructure/interfaces/chat';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

interface ChatBubbleProps {
  message: ChatMessage;
  /** Solo se muestra "Leído" en el ultimo mensaje propio que ya se leyo, no en todos. */
  showReadReceipt: boolean;
  onRetry: (clientMessageId: string) => void;
}

/** Un mensaje del chat, propio (dorado, a la derecha) o del chofer (charcoal, a la izquierda). */
export function ChatBubble({ message, showReadReceipt, onRetry }: ChatBubbleProps) {
  const { isMine, status } = message;

  const bubbleClass = isMine
    ? 'self-end rounded-2xl rounded-br-sm bg-gold/15 border border-gold/30'
    : 'self-start rounded-2xl rounded-bl-sm border border-charcoal bg-field';

  if (status === 'failed') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mensaje no enviado. Tocá para reintentar."
        onPress={() => onRetry(message.clientMessageId)}
        className={`max-w-[80%] gap-1 px-4 py-2.5 ${bubbleClass} border-danger/50 opacity-80`}
      >
        <Typography>{message.content}</Typography>
        <View className="flex-row items-center gap-1">
          <RotateCw size={12} color={colors.danger} />
          <Typography variant="caption" tone="danger">
            No se pudo enviar. Tocá para reintentar.
          </Typography>
        </View>
      </Pressable>
    );
  }

  return (
    <View className={`max-w-[80%] gap-1 px-4 py-2.5 ${bubbleClass}`}>
      <Typography>{message.content}</Typography>
      <View className="flex-row items-center justify-end gap-1">
        {status === 'sending' ? (
          <ActivityIndicator size={10} color={colors.ash} />
        ) : (
          <Typography variant="caption" tone="secondary">
            {timeFormatter.format(message.createdAt)}
          </Typography>
        )}
        {isMine && showReadReceipt ? <CheckCheck size={14} color={colors.gold} /> : null}
        {isMine && status === 'sent' && !showReadReceipt ? <Check size={14} color={colors.ash} /> : null}
      </View>
    </View>
  );
}
