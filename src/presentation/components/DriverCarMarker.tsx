import { Navigation2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { colors } from '@/presentation/theme/colors';

interface DriverCarMarkerProps {
  coordinate: Coordinates;
  /** Rumbo en grados, 0 = norte. */
  rotation: number;
}

/**
 * Auto del chofer: flecha gold que apunta hacia donde va.
 *
 * El giro va por la prop `rotation` del marcador y no rotando la vista: en
 * Android el marcador es una imagen de la vista, y redibujarla en cada cuadro
 * es caro y parpadea.
 */
export function DriverCarMarker({ coordinate, rotation }: DriverCarMarkerProps) {
  // Android necesita un momento para capturar la vista la primera vez.
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
      accessibilityLabel="Tu chofer"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-gold bg-obsidian">
        <Navigation2 size={20} color={colors.gold} fill={colors.gold} strokeWidth={1.5} />
      </View>
    </Marker>
  );
}
