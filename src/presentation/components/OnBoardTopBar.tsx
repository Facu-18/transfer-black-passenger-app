import { BedDouble, Share, ShieldCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import { showComingSoon } from '@/presentation/utils/coming-soon';

import { Typography } from './Typography';

/** Barra sobre el mapa durante el viaje: seguridad, destino y compartir la llegada. */
export function OnBoardTopBar({ destination }: { destination: string | null }) {
  return (
    <View className="flex-row items-center gap-2" pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seguridad"
        onPress={() => showComingSoon('El centro de seguridad')}
        className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-obsidian/90 active:opacity-80"
      >
        <ShieldCheck size={20} color={colors.gold} />
      </Pressable>

      <View className="flex-1 flex-row items-center gap-2 rounded-full border border-charcoal bg-obsidian/90 px-4 py-2.5">
        <BedDouble size={16} color={colors.gold} />
        <Typography variant="caption" weight="semibold" className="flex-1 uppercase" numberOfLines={1}>
          {destination ?? 'Destino'}
        </Typography>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Compartir ETA"
        onPress={() => showComingSoon('Compartir tu llegada')}
        className="flex-row items-center gap-2 rounded-full border border-charcoal bg-obsidian/90 px-4 py-2.5 active:opacity-80"
      >
        <Share size={16} color={colors.gold} />
        <Typography variant="caption" weight="semibold">
          Compartir ETA
        </Typography>
      </Pressable>
    </View>
  );
}
