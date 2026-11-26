import * as Haptics from 'expo-haptics';
import { GripVertical } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';
import { colors } from '@/presentation/theme/colors';

/** Duracion del corrimiento de las filas mientras se arrastra otra. */
const SHIFT_MS = 180;

interface ReorderableListProps {
  /** Cantidad de filas. La clave de cada fila es su posicion: lo que se mueve es su contenido. */
  count: number;
  /** Separacion vertical entre filas (la misma que usa el contenedor). */
  gap: number;
  /** Si la fila `index` se puede arrastrar (una parada sin direccion, no). */
  canDrag: (index: number) => boolean;
  /** Al soltar en otra posicion. */
  onMove: (from: number, to: number) => void;
  /** Nombre de la fila para lectores de pantalla, por ejemplo "Parada 1". */
  labelOf: (index: number) => string;
  /** La fila, con la manija de arrastre ya armada para ubicarla donde vaya. */
  renderRow: (index: number, handle: ReactNode) => ReactNode;
}

interface DragState {
  activeIndex: SharedValue<number>;
  targetIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  pitch: SharedValue<number>;
}

/**
 * Lista que se reordena arrastrando la manija de cada fila: la fila sigue al
 * dedo, las demas se corren para hacerle lugar y al soltar queda en su nuevo
 * lugar. Para lectores de pantalla, cada manija ofrece "mover arriba/abajo".
 */
export function ReorderableList({ count, gap, canDrag, onMove, labelOf, renderRow }: ReorderableListProps) {
  const activeIndex = useSharedValue(-1);
  const targetIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const pitch = useSharedValue(0);
  const state: DragState = { activeIndex, targetIndex, dragY, pitch };

  // Al confirmar un movimiento, las filas vuelven a su lugar recien cuando
  // React ya pinto el orden nuevo: si se soltaran antes, la fila arrastrada
  // saltaria un instante a su posicion vieja.
  const pendingReset = useRef(false);
  const resetDrag = () => {
    activeIndex.value = -1;
    targetIndex.value = -1;
    dragY.value = 0;
  };
  useEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      resetDrag();
    }
  });

  const commit = (from: number, to: number) => {
    if (from === to) {
      resetDrag();
      return;
    }
    pendingReset.current = true;
    onMove(from, to);
  };

  return (
    <View style={{ gap }}>
      {Array.from({ length: count }, (_, index) => (
        <ReorderableRow
          key={index}
          index={index}
          count={count}
          gap={gap}
          state={state}
          draggable={canDrag(index)}
          label={labelOf(index)}
          onCommit={commit}
          renderRow={renderRow}
        />
      ))}
    </View>
  );
}

interface ReorderableRowProps {
  index: number;
  count: number;
  gap: number;
  state: DragState;
  draggable: boolean;
  label: string;
  onCommit: (from: number, to: number) => void;
  renderRow: (index: number, handle: ReactNode) => ReactNode;
}

function selectionFeedback() {
  void Haptics.selectionAsync();
}

function pickupFeedback() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

function ReorderableRow({ index, count, gap, state, draggable, label, onCommit, renderRow }: ReorderableRowProps) {
  const motionEnabled = useMotionEnabled();
  const { activeIndex, targetIndex, dragY, pitch } = state;

  const onLayout = (event: LayoutChangeEvent) => {
    if (index === 0) pitch.value = event.nativeEvent.layout.height + gap;
  };

  const pan = Gesture.Pan()
    .enabled(draggable && count > 1)
    .minDistance(2)
    .onStart(() => {
      activeIndex.value = index;
      targetIndex.value = index;
      dragY.value = 0;
      runOnJS(pickupFeedback)();
    })
    .onUpdate((event) => {
      const step = pitch.value || 1;
      dragY.value = Math.max(-index * step, Math.min((count - 1 - index) * step, event.translationY));
      const next = Math.max(0, Math.min(count - 1, Math.round(index + dragY.value / step)));
      if (next !== targetIndex.value) {
        targetIndex.value = next;
        runOnJS(selectionFeedback)();
      }
    })
    .onEnd(() => {
      const to = targetIndex.value;
      const finalY = (to - index) * pitch.value;
      if (motionEnabled) {
        dragY.value = withTiming(finalY, { duration: 140 }, () => {
          runOnJS(onCommit)(index, to);
        });
      } else {
        dragY.value = finalY;
        runOnJS(onCommit)(index, to);
      }
    });

  const rowStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;
    if (active === index) {
      return {
        zIndex: 10,
        transform: [{ translateY: dragY.value }, { scale: withTiming(1.03, { duration: 120 }) }],
        opacity: 0.97,
      };
    }

    let shift = 0;
    const target = targetIndex.value;
    if (active >= 0) {
      if (active < target && index > active && index <= target) shift = -pitch.value;
      if (active > target && index < active && index >= target) shift = pitch.value;
    }
    return {
      zIndex: 0,
      transform: [
        { translateY: motionEnabled && active >= 0 ? withTiming(shift, { duration: SHIFT_MS }) : shift },
        { scale: 1 },
      ],
      opacity: 1,
    };
  });

  const moveBy = (delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= count) return;
    onCommit(index, to);
  };

  const handle = draggable && count > 1 ? (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Reordenar ${label.toLowerCase()}`}
        accessibilityHint="Arrastrá para cambiar el orden del recorrido"
        accessibilityActions={[
          { name: 'increment', label: 'Mover abajo' },
          { name: 'decrement', label: 'Mover arriba' },
        ]}
        onAccessibilityAction={(event) => moveBy(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        hitSlop={10}
        className="h-9 w-8 items-center justify-center rounded-lg bg-field"
      >
        <GripVertical size={18} color={colors.gold} />
      </View>
    </GestureDetector>
  ) : null;

  return (
    <Animated.View
      onLayout={onLayout}
      style={rowStyle}
      layout={motionEnabled ? LinearTransition.duration(200) : undefined}
    >
      {renderRow(index, handle)}
    </Animated.View>
  );
}
