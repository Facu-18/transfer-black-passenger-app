import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface SecondaryButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  icon?: LucideIcon;
  loading?: boolean;
  /** `danger` para acciones que deshacen algo, como cancelar. */
  tone?: 'default' | 'danger';
  className?: string;
}

/**
 * Botón de fricción: charcoal, sin el peso visual del gold. Para acciones que
 * no son el camino principal (cancelar, volver).
 */
export function SecondaryButton({
  title,
  icon: Icon,
  loading = false,
  tone = 'default',
  disabled,
  className,
  ...props
}: SecondaryButtonProps) {
  const isDisabled = disabled === true || loading;
  const color = tone === 'danger' ? colors.danger : colors.platinum;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-full bg-charcoal active:opacity-80 ${
        isDisabled ? 'opacity-50' : ''
      } ${className ?? ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon ? <Icon size={18} color={color} strokeWidth={2.25} /> : null}
          <Typography variant="bodyLarge" weight="semibold" tone={tone === 'danger' ? 'danger' : 'primary'}>
            {title}
          </Typography>
        </View>
      )}
    </Pressable>
  );
}
