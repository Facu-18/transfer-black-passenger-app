import { ChevronDown, ChevronUp } from 'lucide-react-native';
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
import { colors } from '@/presentation/theme/colors';

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
      // Borde gold y sombra hacia arriba: el panel se despega del mapa y se
      // entiende que es una hoja aparte que se puede bajar.
      className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-x border-t-2 border-gold/50 bg-obsidian px-5 pt-2"
      style={{ boxShadow: `0px -10px 28px ${colors.obsidian}, 0px -2px 14px ${colors.gold}33` }}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={dragStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mostrar u ocultar detalles del viaje"
            onPress={toggle}
            hitSlop={{ top: 12, bottom: 4 }}
            className="items-center gap-1.5 pb-3 pt-1"
          >
            <View className="h-1.5 w-14 rounded-full bg-gold" />
            <View className="flex-row items-center gap-1">
              {expanded ? <ChevronDown size={14} color={colors.gold} /> : <ChevronUp size={14} color={colors.gold} />}
              <Typography variant="caption" weight="semibold" tone="accent">
                {expanded ? 'Deslizá para ocultar' : 'Deslizá para ver el detalle'}
              </Typography>
            </View>
            {!expanded ? (
              <Typography weight="semibold" numberOfLines={1}>
                {summary}
              </Typography>
            ) : null}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Minimizado, el contenido sigue montado (conserva su estado y no repite la animacion de entrada): solo se oculta. */}
      <View
        style={expanded ? { paddingBottom: bottomInset + 16 } : { height: 0, overflow: 'hidden', opacity: 0 }}
        pointerEvents={expanded ? 'auto' : 'none'}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!expanded}
      >
        {children}
      </View>
      {!expanded ? <View style={{ height: bottomInset }} /> : null}
    </Animated.View>
  );
}
