import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors } from '@/presentation/theme/colors';
import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

interface SkeletonProps {
  className?: string;
}

/** Bloque de carga con pulso suave. El tamaño y la forma van por `className`. */
export function Skeleton({ className = '' }: SkeletonProps) {
  const opacity = useSharedValue(0.35);
  const motionEnabled = useMotionEnabled();

  useEffect(() => {
    opacity.value = motionEnabled
      ? withRepeat(withTiming(0.9, { duration: 700, reduceMotion: ReduceMotion.Never }), -1, true, undefined, ReduceMotion.Never)
      : 0.55;
    return () => cancelAnimation(opacity);
  }, [opacity, motionEnabled]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // `className` va en un View comun: NativeWind no aplica clases sobre componentes de Reanimated.
  return (
    <View accessibilityLabel="Cargando" className={`overflow-hidden rounded-lg ${className}`}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.charcoal }, pulse]} />
    </View>
  );
}
