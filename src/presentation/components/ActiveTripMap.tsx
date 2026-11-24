import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';
import { distanceMeters, trimRouteAhead } from '@/presentation/utils/geo';

import { DriverCarMarker } from './DriverCarMarker';
import { StopMarkerBadge } from './StopMarkerBadge';
import { ViewMarker } from './ViewMarker';

/** A esta distancia de la ruta, el auto se dibuja sobre la linea. */
const SNAP_TO_ROUTE_METERS = 40;

/** Zoom del radar: unas pocas cuadras alrededor del punto de partida. */
const SEARCH_ZOOM = 15.5;

/** Zoom al centrar el mapa en el destino a pedido del pasajero. */
const FOCUS_ZOOM = 16;

/** Si `onMapLoaded` no llega (por ejemplo, sin red para las teselas), la camara se mueve igual. */
const CAMERA_READY_FALLBACK_MS = 1500;

/**
 * Centro de Cordoba: si al retomar un viaje activo (la app se cerro y se
 * reabrio) todavia no llego el origen/destino ni la ubicacion del usuario,
 * esto evita que `initialCamera` quede sin centro. Sin un centro valido,
 * Google Maps en Android arranca en (0,0) (el Golfo de Guinea, frente a
 * Africa) y, como `initialCamera` solo se lee una vez al montar el mapa,
 * se queda ahi hasta el primer `animateCamera` de los efectos de abajo.
 */
const DEFAULT_CENTER: Coordinates = { latitude: -31.4201, longitude: -64.1888 };

/** Misma referencia en cada render cuando no hay paradas. */
const NO_STOPS: Coordinates[] = [];

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
  /**
   * Pedido de centrar el mapa en `focusPoint`: cada vez que sube el contador se
   * anima la camara (0 = ninguno). Un contador y no un booleano, asi se puede
   * pedir de nuevo despues de mover el mapa a mano.
   */
  focusRequest?: number;
  focusPoint?: Coordinates | null;
  /** Paradas intermedias en orden: se marcan numeradas con el pasajero a bordo. */
  stops?: Coordinates[];
}

export function ActiveTripMap({
  target,
  targetKind,
  mode,
  driver,
  routePoints,
  topInset,
  bottomInset,
  focusRequest = 0,
  focusPoint = null,
  stops = NO_STOPS,
}: ActiveTripMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasDriver = driver !== null;
  // En Android, react-native-maps le aplica `mapPadding` al GoogleMap nativo
  // apenas cambia la prop; si el mapa todavia no termino de cargar ese objeto
  // es null y la app se cierra (NullPointerException en `setPadding`). Pasa
  // al cambiar de estado el viaje, porque cambia la altura del panel. Ni el
  // padding ni la camara se tocan hasta `onMapReady`.
  const [mapReady, setMapReady] = useState(false);
  // `onMapReady` llega antes de que el mapa tenga tamaño: un `fitToCoordinates`
  // en ese momento se pierde sin error. Al retomar un viaje a bordo la ruta
  // cotizada ya esta y no cambia mas, asi que el mapa quedaba en la camara
  // inicial sin encuadrar nunca la ruta. El encuadre automatico espera a
  // `onMapLoaded` (mapa ya dibujado), con un respaldo por si no llega.
  const [cameraReady, setCameraReady] = useState(false);
  useEffect(() => {
    if (!mapReady || cameraReady) return undefined;
    const fallback = setTimeout(() => setCameraReady(true), CAMERA_READY_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [mapReady, cameraReady]);

  // Radar: el origen en el centro del area visible.
  useEffect(() => {
    if (!cameraReady || mode !== 'searching' || !target) return;
    mapRef.current?.animateCamera({ center: target, zoom: SEARCH_ZOOM }, { duration: 600 });
  }, [cameraReady, mode, target, bottomInset]);

  // Seguimiento: auto y destino a la vista. Solo al aparecer el auto, al cambiar
  // el destino y al recalcularse la ruta; no en cada posicion, porque entonces
  // el mapa no se dejaria mover.
  useEffect(() => {
    if (!cameraReady || mode !== 'tracking' || !target) return;

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
  }, [cameraReady, mode, target, routePoints, hasDriver, bottomInset]);

  // Centrar en un punto a pedido (boton "Destino"). Solo reacciona al contador:
  // si `focusPoint` cambia solo, el mapa no se mueve. Mismo guard `mapReady`
  // que el resto de la camara (ver arriba).
  const focusPointRef = useRef(focusPoint);
  focusPointRef.current = focusPoint;
  const handledFocusRequest = useRef(0);
  useEffect(() => {
    if (!mapReady || focusRequest === handledFocusRequest.current) return;
    handledFocusRequest.current = focusRequest;
    const point = focusPointRef.current;
    if (!point) return;
    mapRef.current?.animateCamera({ center: point, zoom: FOCUS_ZOOM }, { duration: 600 });
  }, [mapReady, focusRequest]);

  const locked = mode === 'searching';

  // El tramo ya recorrido no se dibuja: se recorta la polilinea desde donde
  // esta el auto, avanzando sobre la ruta (ver `trimRouteAhead`). El progreso se
  // guarda por ruta: con otra ruta se vuelve a empezar desde el principio.
  const driverLatitude = driver?.coordinate.latitude;
  const driverLongitude = driver?.coordinate.longitude;
  const progress = useRef<{ route: Coordinates[]; segment: number }>({ route: routePoints, segment: 0 });
  const visibleRoute = useMemo(() => {
    if (driverLatitude === undefined || driverLongitude === undefined || routePoints.length < 2) {
      return routePoints;
    }
    if (progress.current.route !== routePoints) progress.current = { route: routePoints, segment: 0 };
    const trimmed = trimRouteAhead(
      routePoints,
      { latitude: driverLatitude, longitude: driverLongitude },
      progress.current.segment,
    );
    progress.current.segment = trimmed.segment;
    return trimmed.points;
  }, [routePoints, driverLatitude, driverLongitude]);

  // El GPS del chofer oscila unos metros a los costados de la calle: si esta
  // cerca de la ruta, el auto se dibuja sobre ella (el primer punto de la ruta
  // recortada es su proyeccion), asi no se ve "afuera" de la linea.
  const carCoordinate = useMemo(() => {
    if (!driver) return null;
    const projected = visibleRoute.length > 1 ? visibleRoute[0] : undefined;
    if (projected && distanceMeters(driver.coordinate, projected) <= SNAP_TO_ROUTE_METERS) return projected;
    return driver.coordinate;
  }, [driver, visibleRoute]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={darkMapStyle}
      userInterfaceStyle="dark"
      mapPadding={mapReady ? { top: topInset, right: 0, bottom: bottomInset, left: 0 } : undefined}
      onMapReady={() => setMapReady(true)}
      onMapLoaded={() => setCameraReady(true)}
      initialCamera={{ center: target ?? DEFAULT_CENTER, zoom: SEARCH_ZOOM, heading: 0, pitch: 0 }}
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

      {/* A bordo, las paradas del recorrido en orden, ademas del destino. */}
      {mode === 'tracking' && targetKind === 'dropoff'
        ? stops.map((stop, index) => (
            <ViewMarker key={`stop-${index}`} coordinate={stop} anchor={{ x: 0.5, y: 0.5 }} redrawKey={index}>
              <StopMarkerBadge number={index + 1} />
            </ViewMarker>
          ))
        : null}

      {/* Durante la busqueda el origen lo dibuja el radar, encima del mapa. */}
      {mode === 'tracking' && target ? (
        <ViewMarker key={targetKind} coordinate={target} anchor={{ x: 0.5, y: 0.5 }} redrawKey={targetKind}>
          {targetKind === 'pickup' ? (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-gold/25">
              <View className="h-3.5 w-3.5 rounded-full border-2 border-obsidian bg-gold" />
            </View>
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-obsidian">
              <View className="h-3 w-3 bg-gold" />
            </View>
          )}
        </ViewMarker>
      ) : null}

      {/*
        Tambien detras de `mapReady`: en Android, un Marker con `image` y
        `tracksViewChanges={false}` (ver DriverCarMarker) que se agrega a un
        GoogleMap nativo todavia no adjunto a veces no llega a dibujarse, y
        como no vuelve a repintarse solo, el auto queda invisible el resto
        de la pantalla. Pasa justo al retomar un viaje ya asignado: la
        primera posicion del chofer por socket puede llegar casi al mismo
        tiempo que `onMapReady`, y sin esta condicion el Marker se montaba
        sin esperarlo.
      */}
      {mapReady && mode === 'tracking' && carCoordinate ? <DriverCarMarker coordinate={carCoordinate} /> : null}
    </MapView>
  );
}
