import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

import { Typography } from './Typography';

/** Cuanto hay que arrastrar para que cuente como swipe y no como un tap que se movio un poco. */
const DRAG_TRIGGER_PX = 36;
/** Tope de cuanto "sigue" el panel al dedo mientras se arrastra: solo es una referencia visual del gesto. */
const DRAG_FOLLOW_LIMIT_PX = 80;

interface CollapsibleTripPanelProps {
  /** Texto de una linea para el estado minimizado, por ejemplo "Buscando chofer…". */
  summary: string;
  /** Cambia con cada estado del viaje: al cambiar, el panel se expande solo para mostrar el estado nuevo. */
  stateKey: string;
  /** Alto visible actual, para que el mapa y el radar se acomoden detras. */
  onHeightChange: (height: number) => void;
  /** Alto de la zona segura inferior del dispositivo. */
  bottomInset: number;
  children: ReactNode;
}

/**
 * Panel inferior del viaje activo, minimizable como una hoja a media altura
 * ("bottom sheet"): la manija se puede arrastrar o tocar para mostrar/ocultar
 * el detalle sin dejar de ver el mapa. Minimizado, queda la manija mas un
 * resumen de una linea con el estado actual.
 */
export function CollapsibleTripPanel({
  summary,
  stateKey,
  onHeightChange,
  bottomInset,
  children,
}: CollapsibleTripPanelProps) {
  const motionEnabled = useMotionEnabled();
  const [expanded, setExpanded] = useState(true);
  const dragY = useSharedValue(0);
  const lastStateKey = useRef(stateKey);

  // Un cambio de estado del viaje siempre se tiene que ver: si estaba minimizado, se abre solo.
  useEffect(() => {
    if (lastStateKey.current !== stateKey) {
      lastStateKey.current = stateKey;
      setExpanded(true);
    }
  }, [stateKey]);

  const toggle = () => setExpanded((current) => !current);

  // `activeOffsetY` deja pasar un toque chico (un tap) al `Pressable` de abajo:
  // el gesto de arrastre solo se activa a partir de unos pixels de movimiento vertical.
  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onUpdate((event) => {
      if (!motionEnabled) return;
      dragY.value = Math.max(-DRAG_FOLLOW_LIMIT_PX, Math.min(DRAG_FOLLOW_LIMIT_PX, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > DRAG_TRIGGER_PX) {
        runOnJS(setExpanded)(false);
      } else if (event.translationY < -DRAG_TRIGGER_PX) {
        runOnJS(setExpanded)(true);
      }
      dragY.value = motionEnabled ? withSpring(0, { damping: 18, stiffness: 180 }) : withTiming(0, { duration: 0 });
    });

  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));

  return (
    <Animated.View
      layout={motionEnabled ? LinearTransition.damping(18).stiffness(180) : undefined}
      onLayout={(event: LayoutChangeEvent) => onHeightChange(event.nativeEvent.layout.height)}
      className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-charcoal bg-obsidian px-5 pt-3"
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={dragStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mostrar u ocultar detalles del viaje"
            onPress={toggle}
            className="items-center gap-2 pb-3"
          >
            <View className="h-1 w-10 rounded-full bg-charcoal" />
            {!expanded ? (
              <Typography variant="caption" weight="medium" tone="secondary" numberOfLines={1}>
                {summary}
              </Typography>
            ) : null}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {expanded ? <View style={{ paddingBottom: bottomInset + 16 }}>{children}</View> : <View style={{ height: bottomInset }} />}
    </Animated.View>
  );
}
