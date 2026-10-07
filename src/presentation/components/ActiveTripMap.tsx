import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';
import { trimRouteFromPosition } from '@/presentation/utils/geo';

import { DriverCarMarker } from './DriverCarMarker';

/** Zoom del radar: unas pocas cuadras alrededor del punto de partida. */
const SEARCH_ZOOM = 15.5;

interface ActiveTripMapProps {
  /**
   * Hacia donde va el auto: el punto de partida mientras viene a buscar al
   * pasajero, el destino final cuando ya lo lleva.
   */
  target: Coordinates | null;
  /** Solo cambia el marcador: circulo gold para el origen, cuadrado para el destino. */
  targetKind: 'pickup' | 'dropoff';
  /**
   * `searching`: mapa fijo y centrado en el origen, para que el radar que va
   * encima no se desalinee. `tracking`: el pasajero puede moverlo libremente.
   */
  mode: 'searching' | 'tracking';
  driver: { coordinate: Coordinates } | null;
  /** Ruta del auto a `target`; cambia cada ~30 s y ahi se reencuadra. */
  routePoints: Coordinates[];
  /** Espacio que tapan los paneles: el centro del mapa es el del area visible. */
  topInset: number;
  bottomInset: number;
}

export function ActiveTripMap({
  target,
  targetKind,
  mode,
  driver,
  routePoints,
  topInset,
  bottomInset,
}: ActiveTripMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasDriver = driver !== null;
  // En Android, react-native-maps le aplica `mapPadding` al GoogleMap nativo
  // apenas cambia la prop; si el mapa todavia no termino de cargar ese objeto
  // es null y la app se cierra (NullPointerException en `setPadding`). Pasa
  // al cambiar de estado el viaje, porque cambia la altura del panel. Ni el
  // padding ni la camara se tocan hasta `onMapReady`.
  const [mapReady, setMapReady] = useState(false);

  // Radar: el origen en el centro del area visible.
  useEffect(() => {
    if (!mapReady || mode !== 'searching' || !target) return;
    mapRef.current?.animateCamera({ center: target, zoom: SEARCH_ZOOM }, { duration: 600 });
  }, [mapReady, mode, target, bottomInset]);

  // Seguimiento: auto y destino a la vista. Solo al aparecer el auto, al cambiar
  // el destino y al recalcularse la ruta; no en cada posicion, porque entonces
  // el mapa no se dejaria mover.
  useEffect(() => {
    if (!mapReady || mode !== 'tracking' || !target) return;

    const coordinates = routePoints.length > 1 ? routePoints : driver ? [driver.coordinate, target] : [target];

    if (coordinates.length === 1) {
      mapRef.current?.animateCamera({ center: target, zoom: SEARCH_ZOOM }, { duration: 600 });
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 48, right: 56, bottom: 48, left: 56 },
      animated: true,
    });
    // `driver` cambia cada 3 s: solo interesa si hay auto, no donde esta.
  }, [mapReady, mode, target, routePoints, hasDriver, bottomInset]);

  const locked = mode === 'searching';

  // El tramo ya recorrido no se dibuja: se recorta la polilinea desde el punto
  // de la ruta mas cercano a donde esta el auto ahora.
  const driverLatitude = driver?.coordinate.latitude;
  const driverLongitude = driver?.coordinate.longitude;
  const visibleRoute = useMemo(() => {
    if (driverLatitude === undefined || driverLongitude === undefined || routePoints.length < 2) {
      return routePoints;
    }
    return trimRouteFromPosition(routePoints, { latitude: driverLatitude, longitude: driverLongitude });
  }, [routePoints, driverLatitude, driverLongitude]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={darkMapStyle}
      userInterfaceStyle="dark"
      mapPadding={mapReady ? { top: topInset, right: 0, bottom: bottomInset, left: 0 } : undefined}
      onMapReady={() => setMapReady(true)}
      initialCamera={target ? { center: target, zoom: SEARCH_ZOOM, heading: 0, pitch: 0 } : undefined}
      scrollEnabled={!locked}
      zoomEnabled={!locked}
      rotateEnabled={false}
      pitchEnabled={false}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {mode === 'tracking' && visibleRoute.length > 1 ? (
        <Polyline coordinates={visibleRoute} strokeColor={colors.gold} strokeWidth={4} zIndex={1} />
      ) : null}

      {/* Durante la busqueda el origen lo dibuja el radar, encima del mapa. */}
      {mode === 'tracking' && target ? (
        <Marker
          key={targetKind}
          coordinate={target}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          {targetKind === 'pickup' ? (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-gold/25">
              <View className="h-3.5 w-3.5 rounded-full border-2 border-obsidian bg-gold" />
            </View>
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-obsidian">
              <View className="h-3 w-3 bg-gold" />
            </View>
          )}
        </Marker>
      ) : null}

      {mode === 'tracking' && driver ? (
        <DriverCarMarker coordinate={driver.coordinate} />
      ) : null}
    </MapView>
  );
}
