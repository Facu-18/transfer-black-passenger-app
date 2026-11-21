import { View } from 'react-native';

import { Typography } from '@/presentation/components/Typography';

interface StopMarkerBadgeProps {
  /** Numero de la parada en el recorrido (1, 2...). */
  number: number;
}

/** Parada intermedia en un mapa: circulo gold con su numero de orden. */
export function StopMarkerBadge({ number }: StopMarkerBadgeProps) {
  return (
    <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-obsidian bg-gold">
      <Typography variant="caption" weight="bold" tone="inverse">
        {number}
      </Typography>
    </View>
  );
}
