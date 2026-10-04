import { MessageCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import { contactWhatsAppService, WHATSAPP_SERVICES } from '@/presentation/utils/whatsapp-services';

import { Typography } from './Typography';

interface WhatsAppServicesRowProps {
  /** Nombres del recorrido elegido, para que el pedido llegue ya escrito. */
  origin?: string;
  destination?: string;
  disabled?: boolean;
}

/**
 * Servicios que se coordinan por WhatsApp (grua, colectivo, flete...): no se
 * cotizan en la app. Grilla de 4 columnas, todas visibles sin scroll
 * horizontal.
 */
export function WhatsAppServicesRow({ origin, destination, disabled = false }: WhatsAppServicesRowProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <MessageCircle size={14} color={colors.ash} />
        <Typography variant="caption" weight="semibold" tone="secondary" className="uppercase tracking-widest">
          Otros servicios · por WhatsApp
        </Typography>
      </View>

      <View className="flex-row gap-2">
        {WHATSAPP_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Pressable
              key={service.id}
              accessibilityRole="button"
              accessibilityLabel={`${service.name}, coordinar por WhatsApp`}
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => contactWhatsAppService(service, { origin, destination })}
              className={`flex-1 items-center gap-1.5 rounded-xl border border-charcoal bg-surface py-3 active:opacity-80 ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              <Icon size={18} color={colors.gold} />
              <Typography variant="caption" weight="medium" numberOfLines={1}>
                {service.name}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
