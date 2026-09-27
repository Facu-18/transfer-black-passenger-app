import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface BoardingPinCardProps {
  pin: string;
}

/** Codigo que el pasajero dicta en persona; nunca se envia al conductor desde esta app. */
export function BoardingPinCard({ pin }: BoardingPinCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={`PIN de abordaje ${pin.split('').join(' ')}`}
      className="gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-4"
    >
      <View className="flex-row items-center gap-2">
        <ShieldCheck size={20} color={colors.gold} />
        <Typography weight="semibold" tone="accent">
          PIN de abordaje
        </Typography>
      </View>

      <Typography variant="h1" weight="bold" tone="accent" className="text-center text-4xl tracking-[12px]">
        {pin}
      </Typography>

      <Typography variant="caption" tone="secondary" className="text-center leading-4">
        Mostralo al conductor cuando el pasajero esté dentro del vehículo. No lo compartas antes.
      </Typography>
    </View>
  );
}
