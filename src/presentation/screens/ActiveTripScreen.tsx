import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { FINISHED_TRIP_STATUSES, type TripStatus } from '@/infrastructure/interfaces/trips';
import { ActiveTripMap } from '@/presentation/components/ActiveTripMap';
import { DriverEnRoutePanel } from '@/presentation/components/DriverEnRoutePanel';
import { OnBoardPanel } from '@/presentation/components/OnBoardPanel';
import { OnBoardTopBar } from '@/presentation/components/OnBoardTopBar';
import { RadarPulse } from '@/presentation/components/RadarPulse';
import { ReconnectingBanner } from '@/presentation/components/ReconnectingBanner';
import { TripSearchingPanel } from '@/presentation/components/TripSearchingPanel';
import { TripStatusPanel } from '@/presentation/components/TripStatusPanel';
import { useActiveTrip } from '@/presentation/hooks/useActiveTrip';
import { useAnimatedCoordinate } from '@/presentation/hooks/useAnimatedCoordinate';
import { useCancelTrip } from '@/presentation/hooks/useCancelTrip';
import { useDriverEta } from '@/presentation/hooks/useDriverEta';
import { useTripStore } from '@/presentation/store/useTripStore';

/** Alto estimado del panel hasta que se mide: evita un encuadre raro en el primer frame. */
const INITIAL_PANEL_HEIGHT = 360;
/** Lugar para la barra y el aviso de reconexion sobre el mapa. */
const TOP_BAR_HEIGHT = 64;
/** Misma referencia en cada render: un `[]` nuevo reencuadraria el mapa sin parar. */
const NO_ROUTE: Coordinates[] = [];

type TripView = 'searching' | 'enRoute' | 'arrived' | 'onBoard' | 'status';

function toView(status: TripStatus | null): TripView {
  switch (status) {
    case 'searching':
      return 'searching';
    case 'assigned':
    case 'driver_arriving':
      return 'enRoute';
    case 'driver_arrived':
      return 'arrived';
    case 'in_progress':
      return 'onBoard';
    default:
      return 'status';
  }
}

/**
 * Misma referencia mientras no cambien las coordenadas: cada consulta del viaje
 * trae un objeto nuevo, y el mapa se reencuadra cuando cambia su destino.
 */
function useStableCoordinates(source: Coordinates | null): Coordinates | null {
  const latitude = source?.latitude;
  const longitude = source?.longitude;

  return useMemo(
    () => (latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null),
    [latitude, longitude],
  );
}

/**
 * Viaje activo: radar mientras se busca chofer, seguimiento del auto hasta el
 * punto de partida y despues hasta el destino. Una sola pantalla que cambia de
 * panel segun el estado, asi las transiciones no recargan el mapa. Al terminar
 * el viaje pasa al recibo.
 */
export function ActiveTripScreen() {
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId?: string }>();
  const tripId = tripIdParam ?? null;
  const insets = useSafeAreaInsets();

  const { trip, driverLocation, connection, error, refresh } = useActiveTrip(tripId);
  const { requestCancel, isCancelling } = useCancelTrip(tripId, { onRefresh: () => void refresh() });

  // Mientras llega el detalle del viaje se usa lo que se eligio al pedirlo.
  const plannedOrigin = useTripStore((state) => state.origin);
  const plannedDestination = useTripStore((state) => state.destinationLocation);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const view = toView(trip?.status ?? null);
  const onBoard = view === 'onBoard';
  const tracking = view === 'enRoute' || view === 'arrived' || onBoard;

  const pickup = useStableCoordinates(trip?.pickup?.coordinates ?? plannedOrigin?.coordinates ?? null);
  const dropoff = useStableCoordinates(trip?.dropoff?.coordinates ?? plannedDestination?.coordinates ?? null);
  // Con el pasajero arriba, el auto va al destino.
  const target = onBoard ? dropoff : pickup;

  const animatedDriver = useAnimatedCoordinate(tracking ? (driverLocation?.coordinates ?? null) : null);
  const eta = useDriverEta(driverLocation?.coordinates ?? null, target, view === 'enRoute' || onBoard);

  const [panelHeight, setPanelHeight] = useState(INITIAL_PANEL_HEIGHT);
  const onPanelLayout = (event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height);

  const isFinished = trip ? FINISHED_TRIP_STATUSES.includes(trip.status) : false;

  // Viaje terminado: al recibo con `replace`, asi "atras" no vuelve al seguimiento.
  useEffect(() => {
    if (tripId && trip?.status === 'completed') {
      router.replace({ pathname: '/receipt/[tripId]', params: { tripId } });
    }
  }, [tripId, trip?.status]);

  const goHome = useCallback(() => {
    resetTrip();
    router.dismissTo('/home');
  }, [resetTrip]);

  // Mientras el viaje sigue, "atras" no saca de aca: se perderia el seguimiento
  // y hoy no hay otra forma de volver a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isFinished) {
          goHome();
        }
        return true;
      });
      return () => subscription.remove();
    }, [isFinished, goHome]),
  );

  if (!tripId) {
    return <Redirect href="/home" />;
  }

  const topInset = insets.top + TOP_BAR_HEIGHT;

  return (
    <View className="flex-1 bg-obsidian">
      <ActiveTripMap
        target={target}
        targetKind={onBoard ? 'dropoff' : 'pickup'}
        mode={tracking ? 'tracking' : 'searching'}
        driver={
          tracking && animatedDriver.coordinate
            ? { coordinate: animatedDriver.coordinate, rotation: animatedDriver.rotation }
            : null
        }
        routePoints={eta.route?.points ?? NO_ROUTE}
        topInset={topInset}
        bottomInset={panelHeight}
      />

      {view === 'searching' && pickup ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 items-center justify-center"
          style={{ top: topInset, bottom: panelHeight }}
        >
          <RadarPulse />
        </View>
      ) : null}

      <View className="absolute left-0 right-0 gap-2 px-5" style={{ top: insets.top + 8 }} pointerEvents="box-none">
        {onBoard ? <OnBoardTopBar destination={trip?.dropoff?.address ?? null} /> : null}
        <ReconnectingBanner visible={connection === 'reconnecting' && !isFinished} />
      </View>

      <View
        onLayout={onPanelLayout}
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-charcoal bg-obsidian px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-charcoal" />

        {/* La clave por vista hace que cada cambio de panel entre deslizandose. */}
        <Animated.View key={view} entering={FadeInDown.duration(350)}>
          {view === 'searching' ? (
            <TripSearchingPanel
              origin={trip?.pickup?.address ?? plannedOrigin?.address ?? null}
              destination={trip?.dropoff?.address ?? plannedDestination?.address ?? null}
              fare={trip?.formattedFare ?? null}
              isCancelling={isCancelling}
              onCancel={() => requestCancel(false)}
            />
          ) : (view === 'enRoute' || view === 'arrived') && trip ? (
            <DriverEnRoutePanel
              trip={trip}
              arrived={view === 'arrived'}
              etaMinutes={eta.minutes}
              distanceKm={eta.distanceKm}
              isCancelling={isCancelling}
              onCancel={() => requestCancel(true)}
            />
          ) : onBoard && trip ? (
            <OnBoardPanel trip={trip} etaMinutes={eta.minutes} />
          ) : (
            <TripStatusPanel
              status={trip?.status ?? null}
              publicCode={trip?.publicCode ?? null}
              error={error}
              {...(isFinished ? { onGoHome: goHome } : {})}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
