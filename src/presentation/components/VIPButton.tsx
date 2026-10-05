import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface VIPButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  loading?: boolean;
  trailingIcon?: LucideIcon;
  /** Titulo en mayusculas con tracking amplio, como el CTA de selección de perfil. */
  uppercase?: boolean;
  className?: string;
}

/** Botón principal: píldora gold de 56px a todo el ancho. */
export function VIPButton({
  title,
  loading = false,
  disabled,
  trailingIcon: TrailingIcon,
  uppercase = false,
  className,
  ...props
}: VIPButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={{ elevation: 2, shadowColor: colors.charcoal, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
      className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-full border border-platinum/20 bg-gold active:opacity-80 ${
        isDisabled ? 'opacity-50' : ''
      } ${className ?? ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.obsidian} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Typography
            variant="bodyLarge"
            weight="bold"
            tone="inverse"
            className={uppercase ? 'uppercase tracking-widest' : undefined}
          >
            {title}
          </Typography>
          {TrailingIcon ? <TrailingIcon size={18} color={colors.obsidian} strokeWidth={2.5} /> : null}
        </View>
      )}
    </Pressable>
  );
}
