import { MessageCircle } from 'lucide-react-native';
import { Linking, Pressable, Share, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';
import { appAlert } from '@/presentation/utils/app-alert';

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
      appAlert('No pudimos compartir el seguimiento', 'Intentá de nuevo en unos segundos.', [{ text: 'Entendido' }]);
    }
  }
}

/**
 * Cuando el viaje es para un invitado, le recuerda al titular que es quien
 * coordina. El envio del seguimiento va aparte (`ShareTrackingButton`), bien
 * a la vista encima del panel del viaje.
 */
export function CoordinatorBanner({ guestName }: Pick<CoordinatorBannerProps, 'guestName'>) {
  return (
    <View className="flex-row items-center gap-2 self-start rounded-full border border-gold/40 bg-obsidian/80 px-3 py-1.5">
      <View className="h-1.5 w-1.5 rounded-full bg-gold" />
      <Typography variant="caption" weight="semibold" numberOfLines={1}>
        Sos el coordinador · viaja {guestName}
      </Typography>
    </View>
  );
}

/**
 * Boton principal para mandarle al invitado el link de seguimiento por
 * WhatsApp. No hay chat con el invitado (ticket aparte): el titular avisa por
 * fuera de la app. Sin `trackingUrl` (backend viejo) no se muestra.
 */
export function ShareTrackingButton({ guestName, trackingUrl, guestPhoneE164 }: CoordinatorBannerProps) {
  if (!trackingUrl) return null;
  const firstName = guestName.split(' ')[0] || guestName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Enviar el seguimiento del viaje a ${guestName} por WhatsApp`}
      onPress={() => void shareTracking(guestPhoneE164, buildTrackingMessage(guestName, trackingUrl))}
      className="flex-row items-center gap-3 rounded-2xl bg-gold px-4 py-3.5 active:opacity-80"
      style={{ boxShadow: `0px 6px 20px ${colors.gold}66` }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-obsidian">
        <MessageCircle size={20} color={colors.gold} />
      </View>
      <View className="flex-1">
        <Typography weight="bold" tone="inverse" numberOfLines={1}>
          Enviar seguimiento a {firstName}
        </Typography>
        <Typography variant="caption" tone="inverse" numberOfLines={1}>
          Por WhatsApp, para que vea el viaje en vivo
        </Typography>
      </View>
    </Pressable>
  );
}
