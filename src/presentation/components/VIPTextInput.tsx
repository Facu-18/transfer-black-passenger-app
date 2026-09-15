import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface VIPTextInputProps extends TextInputProps {
  label: string;
  icon: LucideIcon;
  error?: string | undefined;
}

/**
 * Campo oscuro con etiqueta e ícono. Si recibe `secureTextEntry` agrega el
 * botón para revelar la contraseña.
 */
export function VIPTextInput({
  label,
  icon: Icon,
  error,
  secureTextEntry = false,
  onFocus,
  onBlur,
  ...props
}: VIPTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderClass = error ? 'border-danger' : focused ? 'border-gold/60' : 'border-charcoal';
  const iconColor = error ? colors.danger : focused ? colors.gold : colors.ash;

  return (
    <View className="gap-2">
      <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-widest">
        {label}
      </Typography>

      <View className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 ${borderClass}`}>
        <Icon size={18} color={iconColor} />
        <TextInput
          className="flex-1 font-regular text-sm text-platinum"
          placeholderTextColor={colors.ash}
          selectionColor={colors.gold}
          cursorColor={colors.gold}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={12}
            onPress={() => setRevealed((value) => !value)}
          >
            {revealed ? <EyeOff size={18} color={colors.ash} /> : <Eye size={18} color={colors.ash} />}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Typography variant="caption" tone="danger">
          {error}
        </Typography>
      ) : null}
    </View>
  );
}
