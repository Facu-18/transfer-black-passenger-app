import { ShieldCheck } from 'lucide-react-native';
import { Switch, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface BoardingPinToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

/** Opcion de seguridad que el pasajero decide antes de confirmar el viaje. */
export function BoardingPinToggle({ value, disabled = false, onChange }: BoardingPinToggleProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-charcoal bg-field p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
        <ShieldCheck size={22} color={colors.gold} />
      </View>

      <View className="flex-1 gap-1">
        <Typography weight="semibold">PIN de abordaje</Typography>
        <Typography variant="caption" tone="secondary" className="leading-4">
          El conductor deberá pedirte un código antes de iniciar.
        </Typography>
      </View>

      <Switch
        accessibilityLabel="Exigir PIN de abordaje"
        accessibilityHint="El conductor deberá ingresar el código que muestra la aplicación"
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.charcoal, true: colors.gold }}
        thumbColor={colors.platinum}
      />
    </View>
  );
}
