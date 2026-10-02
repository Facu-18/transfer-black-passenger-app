import { BedDouble } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

/** Barra sobre el mapa durante el viaje: destino. */
export function OnBoardTopBar({ destination }: { destination: string | null }) {
  return (
    <View className="flex-row items-center gap-2" pointerEvents="box-none">
      <View className="flex-1 flex-row items-center gap-2 rounded-full border border-charcoal bg-obsidian/90 px-4 py-2.5">
        <BedDouble size={16} color={colors.gold} />
        <Typography variant="caption" weight="semibold" className="flex-1 uppercase" numberOfLines={1}>
          {destination ?? 'Destino'}
        </Typography>
      </View>
    </View>
  );
}
