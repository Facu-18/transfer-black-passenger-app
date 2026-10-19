import { useEffect } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/presentation/components/Typography';
import type { ToastState } from '@/presentation/hooks/useToast';
import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

interface ToastProps {
  toast: ToastState | null;
  /** Distancia al borde inferior (sin contar la zona segura), para quedar por encima de un panel. */
  bottomOffset?: number;
}

/**
 * Aviso efimero anclado abajo: no bloquea toques (`pointerEvents="none"`) y se
 * anuncia a los lectores de pantalla. Los tiempos los maneja `useToast`.
 */
export function Toast({ toast, bottomOffset = 16 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const motionEnabled = useMotionEnabled();

  // `accessibilityLiveRegion` no existe en iOS: ahi se anuncia a mano.
  useEffect(() => {
    if (toast && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.message);
  }, [toast]);

  return (
    <View
      className="absolute left-0 right-0 items-center px-5"
      style={{ bottom: insets.bottom + bottomOffset }}
      pointerEvents="none"
    >
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={motionEnabled ? FadeInDown.duration(200) : undefined}
          exiting={motionEnabled ? FadeOutDown.duration(160) : undefined}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="rounded-2xl border border-gold/40 bg-surface px-4 py-3"
          style={{ elevation: 4 }}
        >
          <Typography weight="medium" className="text-center">
            {toast.message}
          </Typography>
        </Animated.View>
      ) : null}
    </View>
  );
}
