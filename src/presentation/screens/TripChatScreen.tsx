import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatMessage } from '@/infrastructure/interfaces/chat';
import type { TripStatus } from '@/infrastructure/interfaces/trips';
import { ChatBubble } from '@/presentation/components/ChatBubble';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useTripChat } from '@/presentation/hooks/useTripChat';
import { colors } from '@/presentation/theme/colors';

const MAX_MESSAGE_LENGTH = 1000;

/** Solo los estados en los que tiene sentido abrir el chat (con chofer asignado). */
const STATUS_LABELS: Partial<Record<TripStatus, string>> = {
  assigned: 'Chofer en camino',
  driver_arriving: 'Chofer en camino',
  driver_arrived: 'Tu chofer llegó',
  in_progress: 'Viaje en curso',
  completed: 'Viaje finalizado',
  cancelled: 'Viaje cancelado',
};

function ChatHeader({
  driverName,
  driverInitials,
  statusLabel,
  onBack,
}: {
  driverName: string;
  driverInitials: string;
  statusLabel: string | null;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center gap-3 border-b border-charcoal bg-obsidian px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={onBack}>
        <ChevronLeft size={24} color={colors.platinum} />
      </Pressable>

      <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
        <Typography weight="bold" tone="accent">
          {driverInitials}
        </Typography>
      </View>

      <View className="flex-1 gap-0.5">
        <Typography variant="h3" numberOfLines={1}>
          {driverName}
        </Typography>
        {statusLabel ? (
          <Typography variant="caption" tone="secondary">
            {statusLabel}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <View className="mx-4 mt-3 rounded-xl border border-charcoal bg-surface px-4 py-2.5">
      <Typography variant="caption" tone="secondary" className="text-center">
        {text}
      </Typography>
    </View>
  );
}

/**
 * Chat 1 a 1 del viaje activo con el chofer asignado.
 *
 * Lista invertida (lo mas nuevo abajo); al llegar arriba pide la pagina
 * anterior. El envio es siempre optimista, con reintento manual si falla.
 */
export function TripChatScreen() {
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId?: string }>();
  const tripId = tripIdParam ?? null;
  const insets = useSafeAreaInsets();

  const {
    driver,
    tripStatus,
    messages,
    isLoading,
    loadError,
    hasOlder,
    isLoadingOlder,
    loadOlder,
    composerText,
    setComposerText,
    send,
    retry,
    isChatClosed,
    rateLimitSecondsRemaining,
    refresh,
  } = useTripChat(tripId);

  const lastMineMessageId = messages.find((message) => message.isMine)?.id ?? null;

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View className="px-4 py-1">
        <ChatBubble
          message={item}
          showReadReceipt={item.isMine && item.id === lastMineMessageId && item.readAt !== null}
          onRetry={retry}
        />
      </View>
    ),
    [lastMineMessageId, retry],
  );

  if (!tripId) {
    return null;
  }

  const composerDisabled = isChatClosed || rateLimitSecondsRemaining !== null;
  const composerPlaceholder = isChatClosed
    ? 'El chat de este viaje está cerrado'
    : rateLimitSecondsRemaining !== null
      ? `Esperá ${rateLimitSecondsRemaining}s para volver a escribir`
      : 'Escribí un mensaje';

  return (
    <View className="flex-1 bg-obsidian">
      <ChatHeader
        driverName={driver?.displayName ?? 'Tu chofer'}
        driverInitials={driver?.initials ?? '—'}
        statusLabel={tripStatus ? (STATUS_LABELS[tripStatus] ?? null) : null}
        onBack={() => router.back()}
      />

      {tripStatus === 'in_progress' ? <Banner text="El chofer no puede responder mientras maneja." /> : null}
      {isChatClosed ? <Banner text="El chat de este viaje está cerrado." /> : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : loadError ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Typography tone="secondary" className="text-center">
              {loadError}
            </Typography>
            <VIPButton title="Reintentar" onPress={refresh} />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(item) => item.clientMessageId}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReachedThreshold={0.3}
            onEndReached={() => hasOlder && loadOlder()}
            ListFooterComponent={
              isLoadingOlder ? (
                <View className="items-center py-3">
                  <ActivityIndicator size="small" color={colors.ash} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 py-16">
                <Typography tone="secondary" className="text-center">
                  Todavía no hay mensajes. Escribile a tu chofer para coordinar el viaje.
                </Typography>
              </View>
            }
          />
        )}

        {!isChatClosed ? (
          <View
            className="flex-row items-end gap-3 border-t border-charcoal bg-obsidian px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="max-h-28 flex-1 justify-center rounded-2xl border border-charcoal bg-field px-4 py-2.5">
              <TextInput
                value={composerText}
                onChangeText={setComposerText}
                placeholder={composerPlaceholder}
                placeholderTextColor={colors.ash}
                selectionColor={colors.gold}
                cursorColor={colors.gold}
                editable={!composerDisabled}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                accessibilityLabel="Mensaje"
                className="font-regular text-sm text-platinum"
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: composerDisabled || composerText.trim().length === 0 }}
              disabled={composerDisabled || composerText.trim().length === 0}
              onPress={send}
              className={`h-11 w-11 items-center justify-center rounded-full bg-gold active:opacity-80 ${
                composerDisabled || composerText.trim().length === 0 ? 'opacity-40' : ''
              }`}
            >
              <Send size={18} color={colors.obsidian} />
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
