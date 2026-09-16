import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';

interface RoutePreviewMapProps {
  origin: Coordinates;
  destination: Coordinates;
  /** Trazado de la ruta cotizada; vacio mientras llega la cotizacion. */
  points: Coordinates[];
  /** Alto del panel inferior, para que la ruta no quede debajo de el. */
  bottomInset: number;
}

/** Mapa oscuro con la ruta del viaje, encuadrada entre origen y destino. */
export function RoutePreviewMap({ origin, destination, points, bottomInset }: RoutePreviewMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const coordinates = points.length > 0 ? points : [origin, destination];

    // El padding inferior reserva el espacio del panel: sin esto la ruta queda tapada.
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 140, right: 64, bottom: bottomInset + 48, left: 64 },
      animated: true,
    });
  }, [points, origin, destination, bottomInset]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={darkMapStyle}
      userInterfaceStyle="dark"
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

      <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View className="h-4 w-4 rounded-full border-2 border-obsidian bg-gold" />
      </Marker>

      <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View className="h-4 w-4 border-2 border-obsidian bg-platinum" />
      </Marker>
    </MapView>
  );
}
