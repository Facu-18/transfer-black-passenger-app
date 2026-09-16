import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors } from '@/presentation/theme/colors';

interface SkeletonProps {
  className?: string;
}

/** Bloque de carga con pulso suave. El tamaño y la forma van por `className`. */
export function Skeleton({ className = '' }: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // `className` va en un View comun: NativeWind no aplica clases sobre componentes de Reanimated.
  return (
    <View accessibilityLabel="Cargando" className={`overflow-hidden rounded-lg ${className}`}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.charcoal }, pulse]} />
    </View>
  );
}
