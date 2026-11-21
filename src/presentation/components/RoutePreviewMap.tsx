import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { StopMarkerBadge } from '@/presentation/components/StopMarkerBadge';
import { ViewMarker } from '@/presentation/components/ViewMarker';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';

interface RoutePreviewMapProps {
  origin: Coordinates;
  destination: Coordinates;
  /** Paradas intermedias en orden; se marcan numeradas. */
  stops?: Coordinates[];
  /** Trazado de la ruta cotizada; vacio mientras llega la cotizacion. */
  points: Coordinates[];
  /** Alto del panel inferior, para que la ruta no quede debajo de el. */
  bottomInset: number;
}

/** Mapa oscuro con la ruta del viaje, encuadrada entre origen y destino. */
export function RoutePreviewMap({ origin, destination, stops = [], points, bottomInset }: RoutePreviewMapProps) {
  const mapRef = useRef<MapView>(null);
  // En Android, `mapPadding` antes de `onMapReady` cierra la app.
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const coordinates = points.length > 0 ? points : [origin, ...stops, destination];

    // El padding inferior reserva el espacio del panel: sin esto la ruta queda tapada.
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 140, right: 64, bottom: bottomInset + 48, left: 64 },
      animated: true,
    });
    // `stops` solo cuenta sin ruta todavia (llega en cada render como array nuevo): no se
    // pone como dependencia para no reencuadrar en cada render; la ruta nueva ya las incluye.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, origin, destination, bottomInset]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={darkMapStyle}
      userInterfaceStyle="dark"
      // El panel inferior tapa el borde del mapa: el padding sube el logo de Google (obligatorio que se vea).
      mapPadding={mapReady ? { top: 0, right: 0, bottom: bottomInset, left: 0 } : undefined}
      onMapReady={() => setMapReady(true)}
      initialRegion={{
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {points.length > 0 ? (
        <Polyline coordinates={points} strokeColor={colors.gold} strokeWidth={4} />
      ) : null}

      {/* Partida con halo: se distingue de las paradas numeradas. */}
      <ViewMarker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-gold/25">
          <View className="h-3.5 w-3.5 rounded-full border-2 border-obsidian bg-gold" />
        </View>
      </ViewMarker>

      {stops.map((stop, index) => (
        <ViewMarker key={`stop-${index}`} coordinate={stop} anchor={{ x: 0.5, y: 0.5 }} redrawKey={index}>
          <StopMarkerBadge number={index + 1} />
        </ViewMarker>
      ))}

      <ViewMarker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
        <View className="h-4 w-4 border-2 border-obsidian bg-platinum" />
      </ViewMarker>
    </MapView>
  );
}
