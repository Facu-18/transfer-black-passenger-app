import { MessageCircle } from 'lucide-react-native';
import { Alert, Linking, Pressable, Share, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface CoordinatorBannerProps {
  guestName: string;
  /** Solo lo trae el titular que pidio el viaje; `null` con un backend que todavia no lo manda. */
  trackingUrl: string | null;
  guestPhoneE164: string;
}

function buildTrackingMessage(guestName: string, trackingUrl: string): string {
  return `Hola ${guestName}! Así podés seguir tu viaje de Transfer Black en vivo: ${trackingUrl}`;
}

async function shareTracking(phoneE164: string, message: string): Promise<void> {
  // wa.me abre la app si esta instalada y, si no, WhatsApp Web: no hace falta canOpenURL.
  const number = phoneE164.replace('+', '');
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  try {
    await Linking.openURL(url);
  } catch {
    // Sin WhatsApp, la hoja de compartir del sistema deja mandar el mismo
    // mensaje (con el link) por SMS, mail o copiarlo.
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('No pudimos compartir el seguimiento', 'Intentá de nuevo en unos segundos.', [{ text: 'Entendido' }]);
    }
  }
}

/**
 * Cuando el viaje es para un invitado, le recuerda al titular que es quien
 * coordina y le deja mandar el link de seguimiento por WhatsApp. No hay chat
 * (ticket aparte): el titular avisa por fuera de la app.
 */
export function CoordinatorBanner({ guestName, trackingUrl, guestPhoneE164 }: CoordinatorBannerProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2 self-start rounded-full border border-gold/40 bg-obsidian/80 px-3 py-1.5">
        <View className="h-1.5 w-1.5 rounded-full bg-gold" />
        <Typography variant="caption" weight="semibold" numberOfLines={1}>
          Sos el coordinador · viaja {guestName}
        </Typography>
      </View>

      {trackingUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar seguimiento por WhatsApp"
          onPress={() => void shareTracking(guestPhoneE164, buildTrackingMessage(guestName, trackingUrl))}
          className="flex-row items-center justify-center gap-2 self-start rounded-full bg-gold px-4 py-2 active:opacity-80"
        >
          <MessageCircle size={16} color={colors.obsidian} />
          <Typography variant="caption" weight="bold" tone="inverse">
            Enviar seguimiento por WhatsApp
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}
