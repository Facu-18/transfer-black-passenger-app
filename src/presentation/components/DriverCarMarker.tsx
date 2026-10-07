import { Marker } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { useAnimatedCoordinate } from '@/presentation/hooks/useAnimatedCoordinate';
import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

interface DriverCarMarkerProps {
  coordinate: Coordinates;
}

/**
 * Sedan dorado cenital ya renderizado a bitmap (ver `assets/images/driver-car*.png`),
 * en vez del mismo dibujo armado con `react-native-svg` dentro del `Marker`.
 *
 * Un `<Svg>` con un filtro (`FeDropShadow`) como hijo custom de un `Marker` de
 * Google Maps se vio crasheando la app en Android en un build de release justo
 * al pasar a `assigned` (cuando este marcador aparece por primera vez): un PNG
 * con la sombra ya "horneada" no depende de ese camino de renderizado nativo.
 * De paso, sin vista custom no hace falta `tracksViewChanges` prendido ni un
 * timeout para apagarlo: una imagen no necesita una primera pasada de medicion.
 */
export function DriverCarMarker({ coordinate }: DriverCarMarkerProps) {
  const motionEnabled = useMotionEnabled();
  const animated = useAnimatedCoordinate(coordinate, 3_000, motionEnabled);

  return (
    <Marker
      coordinate={animated.coordinate ?? coordinate}
      rotation={animated.rotation}
      flat
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      zIndex={2}
      accessibilityLabel="Tu chofer"
      image={require('../../../assets/images/driver-car.png')}
    />
  );
}
