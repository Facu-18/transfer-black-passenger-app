import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

interface MotionPressableProps extends PressableProps {
  children: ReactNode;
  className?: string;
}

/** Short transform-only feedback without recalculating layout on each frame. */
export function MotionPressable({ children, onPressIn, onPressOut, disabled, ...props }: MotionPressableProps) {
  const scale = useSharedValue(1);
  const motionEnabled = useMotionEnabled();
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (disabled || !motionEnabled) scale.value = 1;
    return () => cancelAnimation(scale);
  }, [disabled, motionEnabled, scale]);

  return (
    <Animated.View style={motion}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          scale.value = motionEnabled ? withTiming(0.98, { duration: 90, reduceMotion: ReduceMotion.Never }) : 1;
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = motionEnabled ? withTiming(1, { duration: 160, reduceMotion: ReduceMotion.Never }) : 1;
          onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
