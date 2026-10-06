import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Defs, FeDropShadow, Filter, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { useAnimatedCoordinate } from '@/presentation/hooks/useAnimatedCoordinate';
import { useMotionEnabled } from '@/presentation/hooks/useMotionEnabled';

interface DriverCarMarkerProps {
  coordinate: Coordinates;
}

const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;

/** Sedan dorado cenital, centrado en (60, 100) para rotar sobre su propio eje. */
function CarShape() {
  return (
    <Svg width={CAR_WIDTH} height={CAR_HEIGHT} viewBox="0 0 120 200">
      <Defs>
        <Filter id="car-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <FeDropShadow dx={0} dy={6} stdDeviation={5} floodColor="#000000" floodOpacity={0.45} />
        </Filter>

        <LinearGradient id="gold-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#8A5A00" />
          <Stop offset="15%" stopColor="#D4AF37" />
          <Stop offset="50%" stopColor="#FFF0A5" />
          <Stop offset="85%" stopColor="#D4AF37" />
          <Stop offset="100%" stopColor="#8A5A00" />
        </LinearGradient>

        <LinearGradient id="gold-roof" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#B8860B" />
          <Stop offset="30%" stopColor="#E5C158" />
          <Stop offset="50%" stopColor="#FFF7C2" />
          <Stop offset="70%" stopColor="#E5C158" />
          <Stop offset="100%" stopColor="#B8860B" />
        </LinearGradient>

        <LinearGradient id="windshield-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#1B242A" />
          <Stop offset="70%" stopColor="#2C3E50" />
          <Stop offset="100%" stopColor="#1A252F" />
        </LinearGradient>

        <LinearGradient id="glass-specular" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>

        <LinearGradient id="headlight-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#FFEAA7" />
          <Stop offset="100%" stopColor="#FFFFFF" />
        </LinearGradient>
      </Defs>

      <G fill="#1A1A1A">
        <Rect x={25} y={48} width={6} height={22} rx={3} />
        <Rect x={89} y={48} width={6} height={22} rx={3} />
        <Rect x={25} y={128} width={6} height={22} rx={3} />
        <Rect x={89} y={128} width={6} height={22} rx={3} />
      </G>

      <Path
        filter="url(#car-shadow)"
        fill="url(#gold-body)"
        d="M60 22 C74 22 84 28 87 42 C89 52 88 68 89 84 C90 105 91 126 89 146 C88 162 82 174 60 174 C38 174 32 162 31 146 C29 126 30 105 31 84 C32 68 31 52 33 42 C36 28 46 22 60 22Z"
      />

      <G fill="#B8860B">
        <Path d="M31 64 C23 62 21 68 22 72 C24 75 30 73 31 70Z" />
        <Path d="M89 64 C97 62 99 68 98 72 C96 75 90 73 89 70Z" />
      </G>

      <G>
        <Path fill="url(#windshield-grad)" d="M41 56 C49 53 71 53 79 56 C82 60 83 72 84 77 C68 74 52 74 36 77 C37 72 38 60 41 56Z" />
        <Path fill="url(#glass-specular)" d="M42 56 L56 54 L46 76 L37 76Z" />
        <Path fill="#1A252F" d="M35 80 C35 90 35 115 34 124 C37 123 38 110 38 98 C38 87 37 81 35 80Z" />
        <Path fill="#1A252F" d="M85 80 C85 90 85 115 86 124 C83 123 82 110 82 98 C82 87 83 81 85 80Z" />
        <Path fill="url(#windshield-grad)" d="M37 128 C52 131 68 131 83 128 C82 136 80 146 76 149 C67 151 53 151 44 149 C40 146 38 136 37 128Z" />
        <Path fill="url(#gold-roof)" d="M40 78 C52 76 68 76 80 78 C82 92 82 114 80 126 C68 128 52 128 40 126 C38 114 38 92 40 78Z" />
        <Rect x={45} y={86} width={30} height={32} rx={4} fill="#141E24" opacity={0.85} />
        <Line x1={47} y1={88} x2={73} y2={88} stroke="#FFFFFF" strokeWidth={0.8} opacity={0.4} />
      </G>

      <Path fill="url(#headlight-grad)" d="M37 28 C41 27 46 29 47 31 C43 33 39 33 36 32Z" />
      <Path fill="url(#headlight-grad)" d="M83 28 C79 27 74 29 73 31 C77 33 81 33 84 32Z" />
      <Path fill="#FF1A1A" d="M36 168 C42 169 47 168 49 166 C45 164 40 165 37 166Z" />
      <Path fill="#FF1A1A" d="M84 168 C78 169 73 168 71 166 C75 164 80 165 83 166Z" />
      <Line x1={51} y1={166} x2={69} y2={166} stroke="#C0392B" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// GPS interpolation must not redraw the static SVG on each frame.
const StaticCarShape = memo(CarShape);

/** Interpolation is local to the marker, not the entire trip screen. */
export function DriverCarMarker({ coordinate }: DriverCarMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const motionEnabled = useMotionEnabled();
  const animated = useAnimatedCoordinate(coordinate, 3_000, motionEnabled);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={animated.coordinate ?? coordinate}
      rotation={animated.rotation}
      flat
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={2}
      accessibilityLabel="Tu chofer"
    >
      <View style={{ width: CAR_WIDTH, height: CAR_HEIGHT }}>
        <StaticCarShape />
      </View>
    </Marker>
  );
}
