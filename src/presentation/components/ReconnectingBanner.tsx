import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

/**
 * Aviso de que se perdio el tiempo real. No bloquea nada: mientras tanto el
 * viaje se sigue consultando por REST.
 */
export function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInUp} accessibilityLiveRegion="polite">
      <View className="flex-row items-center gap-2 self-center rounded-full border border-charcoal bg-obsidian/90 px-4 py-2">
        <ActivityIndicator size="small" color={colors.gold} />
        <Typography variant="caption" weight="semibold">
          Reconectando…
        </Typography>
      </View>
    </Animated.View>
  );
}
