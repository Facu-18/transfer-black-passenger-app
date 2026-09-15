import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface ProfileOptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  /** Opción visible pero todavía no habilitada: se muestra atenuada con esta etiqueta. */
  badge?: string;
  onPress: () => void;
}

/** Tarjeta de selección de perfil con indicador tipo radio. */
export function ProfileOptionCard({
  icon: Icon,
  title,
  description,
  selected = false,
  badge,
  onPress,
}: ProfileOptionCardProps) {
  const unavailable = badge !== undefined;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: unavailable }}
      accessibilityHint={unavailable ? badge : undefined}
      onPress={onPress}
      className={`flex-row items-center gap-4 rounded-3xl border p-4 active:opacity-80 ${
        selected ? 'border-gold/40 bg-gold/10' : 'border-charcoal bg-surface/80'
      }`}
    >
      <View
        className={`h-12 w-12 items-center justify-center rounded-2xl border ${
          selected ? 'border-gold/30 bg-obsidian/60' : 'border-charcoal bg-field'
        }`}
      >
        <Icon size={22} color={selected ? colors.gold : colors.ash} />
      </View>

      <View className={`flex-1 gap-1 ${unavailable ? 'opacity-60' : ''}`}>
        <View className="flex-row flex-wrap items-center gap-2">
          <Typography variant="bodyLarge" weight="semibold">
            {title}
          </Typography>
          {badge ? (
            <View className="rounded-full border border-gold/40 px-2 py-0.5">
              <Typography variant="caption" weight="medium" tone="accent" className="uppercase tracking-wider">
                {badge}
              </Typography>
            </View>
          ) : null}
        </View>
        <Typography variant="caption" tone="secondary" numberOfLines={1}>
          {description}
        </Typography>
      </View>

      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          selected ? 'border-gold' : 'border-charcoal'
        }`}
      >
        {selected ? <View className="h-2.5 w-2.5 rounded-full bg-gold" /> : null}
      </View>
    </Pressable>
  );
}
