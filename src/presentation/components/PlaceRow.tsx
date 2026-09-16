import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface PlaceRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  /** Sin separador superior: para la primera fila de la lista. */
  isFirst?: boolean;
}

/** Fila de lugar (reciente o sugerencia) con ícono, dos líneas y chevron. */
export function PlaceRow({ icon: Icon, title, subtitle, onPress, isFirst = false }: PlaceRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      className={`flex-row items-center gap-4 px-4 py-3.5 active:bg-field ${isFirst ? '' : 'border-t border-charcoal'}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-charcoal bg-field">
        <Icon size={18} color={colors.ash} />
      </View>
      <View className="flex-1 gap-0.5">
        <Typography variant="bodyLarge" weight="semibold" numberOfLines={1}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" tone="secondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.ash} />
    </Pressable>
  );
}
