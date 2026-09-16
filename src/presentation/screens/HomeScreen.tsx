import { router } from 'expo-router';
import { Bell, BriefcaseBusiness, Clock, MapPin, Search, ShieldCheck, UserPlus, UserRound } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Place } from '@/infrastructure/interfaces/places';
import { PlaceRow } from '@/presentation/components/PlaceRow';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Typography } from '@/presentation/components/Typography';
import { useCurrentUser } from '@/presentation/hooks/useCurrentUser';
import { useLocationPermissions, type LocationStatus } from '@/presentation/hooks/useLocationPermissions';
import { useRecentPlaces } from '@/presentation/hooks/useRecentPlaces';
import { useTripStore } from '@/presentation/store/useTripStore';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';

/** Centro de Córdoba: se muestra hasta tener la ubicación del usuario (o si no la comparte). */
const DEFAULT_REGION = { latitude: -31.4201, longitude: -64.1888, latitudeDelta: 0.05, longitudeDelta: 0.05 };

/** Espacio que ocupa la barra de navegación flotante sobre el contenido. */
const TAB_BAR_SPACE = 112;

const GPS_LABELS: Record<LocationStatus, string> = {
  checking: 'Buscando ubicación…',
  granted: 'GPS activo',
  denied: 'Activar ubicación',
  unavailable: 'GPS sin señal · Reintentar',
};

function showComingSoon(feature: string) {
  Alert.alert(feature, 'Esta opción estará disponible pronto.', [{ text: 'Entendido' }]);
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);

  const { user, isLoading: isLoadingUser } = useCurrentUser();
  const { status: gpsStatus, currentLocation, retry: retryLocation } = useLocationPermissions();
  const { recentPlaces } = useRecentPlaces();
  const origin = useTripStore((state) => state.origin);
  const setDestination = useTripStore((state) => state.setDestination);

  // Centra el mapa cada vez que llega una posición nueva, con inclinación para la vista 3D.
  useEffect(() => {
    if (!currentLocation) return;
    mapRef.current?.animateCamera({ center: currentLocation, zoom: 16, pitch: 45 }, { duration: 800 });
  }, [currentLocation]);

  const startSearch = () => {
    setDestination(null);
    router.push('/search');
  };

  const selectRecent = (place: Place) => {
    setDestination(place);
    // Sin origen (no hay ubicación) se completa en la búsqueda; con origen se pasa directo a cotizar.
    router.push(origin ? '/pricing' : '/search');
  };

  const firstName = user?.firstName?.trim();
  const canRetryGps = gpsStatus === 'denied' || gpsStatus === 'unavailable';

  return (
    <View className="flex-1 bg-obsidian">
      <View style={{ height: height * 0.42 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={darkMapStyle}
          userInterfaceStyle="dark"
          initialRegion={DEFAULT_REGION}
          showsPointsOfInterests={false}
          showsBuildings
          showsCompass={false}
          toolbarEnabled={false}
          pitchEnabled
        >
          {currentLocation ? (
            <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-gold/25">
                <View className="h-3.5 w-3.5 rounded-full border-2 border-obsidian bg-gold" />
              </View>
            </Marker>
          ) : null}
        </MapView>

        <View className="absolute left-0 right-0 top-0 gap-3 px-4" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-center justify-between rounded-3xl border border-charcoal bg-obsidian/80 px-4 py-3">
            <View className="flex-1 flex-row items-center gap-3">
              <ShieldCheck size={22} color={colors.gold} />
              <View className="flex-1 gap-1">
                <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
                  Inicio
                </Typography>
                {isLoadingUser && !firstName ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <Typography variant="h3" numberOfLines={1}>
                    {firstName ? `Hola, ${firstName}` : 'Hola'}
                  </Typography>
                )}
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notificaciones"
                onPress={() => showComingSoon('Notificaciones')}
                className="h-10 w-10 items-center justify-center rounded-full bg-field active:opacity-80"
              >
                <Bell size={18} color={colors.platinum} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mi cuenta"
                onPress={() => router.navigate('/account')}
                className="h-10 w-10 items-center justify-center rounded-full bg-gold active:opacity-80"
              >
                <UserRound size={18} color={colors.obsidian} />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole={canRetryGps ? 'button' : 'text'}
            disabled={!canRetryGps}
            onPress={retryLocation}
            className="flex-row items-center gap-2 self-start rounded-full border border-charcoal bg-obsidian/80 px-3 py-1.5"
          >
            <View className={`h-2 w-2 rounded-full ${gpsStatus === 'granted' ? 'bg-gold' : 'bg-ash'}`} />
            <Typography variant="caption" weight="medium" tone={canRetryGps ? 'accent' : 'primary'}>
              {GPS_LABELS[gpsStatus]}
            </Typography>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="-mt-6 flex-1 rounded-t-3xl bg-obsidian"
        contentContainerClassName="gap-5 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-1 w-10 self-center rounded-full bg-charcoal" />

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="¿A dónde vamos? Buscar destino"
          onPress={startSearch}
          className="flex-row items-center gap-3 rounded-2xl border border-charcoal bg-surface px-4 py-4 active:opacity-80"
        >
          <Search size={20} color={colors.gold} />
          <Typography variant="bodyLarge" weight="semibold" className="flex-1">
            ¿A dónde vamos?
          </Typography>
          <View className="h-6 w-px bg-charcoal" />
          <Clock size={16} color={colors.ash} />
          <Typography variant="caption" tone="secondary">
            Ahora
          </Typography>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => showComingSoon('Viaje corporativo')}
            className="flex-row items-center gap-2 rounded-full border border-charcoal bg-surface px-4 py-2.5 active:opacity-80"
          >
            <BriefcaseBusiness size={16} color={colors.gold} />
            <Typography weight="medium">Viaje corporativo</Typography>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => showComingSoon('Viaje para un invitado')}
            className="flex-row items-center gap-2 rounded-full border border-charcoal bg-surface px-4 py-2.5 active:opacity-80"
          >
            <UserPlus size={16} color={colors.gold} />
            <Typography weight="medium">Para un invitado</Typography>
          </Pressable>
        </ScrollView>

        <View className="gap-3">
          <Typography variant="caption" weight="semibold" tone="secondary" className="uppercase tracking-widest">
            Destinos recientes
          </Typography>

          {recentPlaces.length > 0 ? (
            <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
              {recentPlaces.map((place, index) => (
                <PlaceRow
                  key={place.placeId}
                  icon={MapPin}
                  title={place.name}
                  subtitle={place.detail}
                  isFirst={index === 0}
                  onPress={() => selectRecent(place)}
                />
              ))}
            </View>
          ) : (
            <View className="items-center gap-1 rounded-2xl border border-charcoal bg-surface px-4 py-6">
              <Typography weight="medium">Todavía no tienes destinos recientes</Typography>
              <Typography variant="caption" tone="secondary" className="text-center">
                Los lugares a los que viajes aparecerán acá para pedirlos más rápido.
              </Typography>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
