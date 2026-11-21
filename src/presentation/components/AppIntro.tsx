import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Typography } from '@/presentation/components/Typography';

const SPLASH_ICON = require('../../../assets/splash-icon.png');

/** Mismo ancho que `imageWidth` del plugin `expo-splash-screen` en `app.json`: arranca calcado. */
const ICON_SIZE = 200;
const EASE_OUT = Easing.out(Easing.cubic);

interface AppIntroProps {
  onFinish: () => void;
}

/**
 * Animacion de apertura. Arranca igual que la splash nativa (fondo obsidian y
 * el mismo mapa centrado), asi el relevo no se nota: el mapa late, aparece la
 * marca debajo, y todo se desvanece agrandandose para dejar ver la app, que ya
 * esta montada detras. Con "reducir movimiento" activado solo se desvanece.
 */
export function AppIntro({ onFinish }: AppIntroProps) {
  const reduceMotion = useReducedMotion();

  const iconScale = useSharedValue(1);
  const brandOpacity = useSharedValue(0);
  const brandOffset = useSharedValue(12);
  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);

  useEffect(() => {
    const finish = (done?: boolean) => {
      'worklet';
      if (done) runOnJS(onFinish)();
    };

    if (reduceMotion) {
      overlayOpacity.value = withDelay(300, withTiming(0, { duration: 250 }, finish));
      return;
    }

    iconScale.value = withSequence(
      withTiming(1.08, { duration: 380, easing: EASE_OUT }),
      withTiming(1, { duration: 320, easing: Easing.inOut(Easing.cubic) }),
    );
    brandOpacity.value = withDelay(250, withTiming(1, { duration: 450, easing: EASE_OUT }));
    brandOffset.value = withDelay(250, withTiming(0, { duration: 450, easing: EASE_OUT }));
    overlayScale.value = withDelay(1100, withTiming(1.15, { duration: 450, easing: Easing.in(Easing.cubic) }));
    overlayOpacity.value = withDelay(1100, withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }, finish));
  }, [brandOffset, brandOpacity, iconScale, onFinish, overlayOpacity, overlayScale, reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandOffset.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="bg-obsidian"
      style={[StyleSheet.absoluteFill, overlayStyle]}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.Image source={SPLASH_ICON} style={[{ width: ICON_SIZE, height: ICON_SIZE }, iconStyle]} />
      </View>
      {/* Fuera del flujo: el mapa queda exactamente donde lo dejo la splash nativa. */}
      <Animated.View
        className="absolute left-0 right-0 items-center"
        style={[{ top: '50%', marginTop: ICON_SIZE / 2 + 8 }, brandStyle]}
      >
        <Typography variant="h3" tone="accent" className="tracking-[6px]">
          TRANSFER BLACK
        </Typography>
      </Animated.View>
    </Animated.View>
  );
}
