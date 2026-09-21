import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/presentation/theme/colors';

const RING_COUNT = 3;
const CYCLE_MS = 2_400;
const RING_SIZE = 220;

function Ring({ progress }: { progress: SharedValue<number> }) {
  // Cada onda nace en el centro y se desvanece al abrirse.
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 0.15 + progress.value * 0.85 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 1.5,
          borderColor: colors.gold,
          backgroundColor: `${colors.gold}14`,
        },
        style,
      ]}
    />
  );
}

/**
 * Pulso de radar sobre el punto de partida mientras se busca chofer: tres ondas
 * gold escalonadas que se abren y se apagan en bucle.
 */
export function RadarPulse() {
  const first = useSharedValue(0);
  const second = useSharedValue(0);
  const third = useSharedValue(0);

  useEffect(() => {
    [first, second, third].forEach((progress, index) => {
      progress.value = withDelay(
        (CYCLE_MS / RING_COUNT) * index,
        withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.out(Easing.quad) }), -1, false),
      );
    });
  }, [first, second, third]);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ring progress={first} />
      <Ring progress={second} />
      <Ring progress={third} />
      <View className="h-8 w-8 items-center justify-center rounded-full bg-gold/25">
        <View className="h-4 w-4 rounded-full border-2 border-obsidian bg-gold" />
      </View>
    </View>
  );
}
