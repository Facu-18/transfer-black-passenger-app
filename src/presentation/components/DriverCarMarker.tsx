import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { colors } from '@/presentation/theme/colors';

interface DriverCarMarkerProps {
  coordinate: Coordinates;
  /** Rumbo en grados, 0 = norte. */
  rotation: number;
}

const CAR_WIDTH = 34;
const CAR_HEIGHT = 60;

/**
 * Auto visto desde arriba, con volumen por gradiente y sombra: carroceria,
 * parabrisas y luneta, con filos gold. Pocas formas, para que sea barato de
 * dibujar en cada fotograma mientras `tracksViewChanges` sigue activo.
 */
function CarShape() {
  return (
    <Svg width={CAR_WIDTH} height={CAR_HEIGHT} viewBox="0 0 34 60">
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.charcoal} />
          <Stop offset="0.5" stopColor={colors.obsidian} />
          <Stop offset="1" stopColor={colors.charcoal} />
        </LinearGradient>
        <LinearGradient id="hoodShine" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.platinum} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colors.platinum} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Sombra proyectada, da sensacion de altura respecto del mapa. */}
      <Ellipse cx={17} cy={54} rx={13} ry={5.5} fill={colors.obsidian} opacity={0.35} />

      {/* Carroceria. */}
      <Rect x={3} y={4} width={28} height={50} rx={11} fill="url(#body)" stroke={colors.gold} strokeWidth={0.75} />

      {/* Brillo del capot (nariz hacia el norte). */}
      <Rect x={8} y={7} width={18} height={10} rx={5} fill="url(#hoodShine)" />

      {/* Parabrisas. */}
      <Rect x={6.5} y={15} width={21} height={11} rx={4} fill={colors.obsidian} opacity={0.9} />

      {/* Techo: filo gold central. */}
      <Rect x={16.25} y={15} width={1.5} height={30} fill={colors.gold} opacity={0.55} />

      {/* Luneta trasera. */}
      <Rect x={7.5} y={38} width={19} height={9} rx={4} fill={colors.obsidian} opacity={0.9} />

      {/* Espejos. */}
      <Rect x={0.5} y={17} width={3} height={5} rx={1.2} fill={colors.charcoal} stroke={colors.gold} strokeWidth={0.4} />
      <Rect x={30.5} y={17} width={3} height={5} rx={1.2} fill={colors.charcoal} stroke={colors.gold} strokeWidth={0.4} />

      {/* Faros delanteros. */}
      <Circle cx={9} cy={7} r={1.4} fill={colors.gold} />
      <Circle cx={25} cy={7} r={1.4} fill={colors.gold} />
    </Svg>
  );
}

/**
 * Auto del chofer, visto desde arriba, con volumen.
 *
 * El giro va por la prop `rotation` del marcador (`flat`) y no rotando la
 * vista: en Android el marcador es una imagen de la vista, y redibujarla en
 * cada cuadro es caro y parpadea. `tracksViewChanges` solo queda activo hasta
 * que el SVG termina de capturarse por primera vez.
 */
export function DriverCarMarker({ coordinate, rotation }: DriverCarMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      rotation={rotation}
      flat
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={2}
      accessibilityLabel="Tu chofer"
    >
      <View style={{ width: CAR_WIDTH, height: CAR_HEIGHT }}>
        <CarShape />
      </View>
    </Marker>
  );
}
