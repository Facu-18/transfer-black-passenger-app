import { router } from 'expo-router';
import { ChevronLeft, MapPin, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

import { SecondaryButton } from '@/presentation/components/SecondaryButton';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useMapDestinationPicker } from '@/presentation/hooks/useMapDestinationPicker';
import { colors } from '@/presentation/theme/colors';
import { darkMapStyle } from '@/presentation/theme/map-style';
import { useSafeInsets } from '@/presentation/hooks/useSafeInsets';

const MAP_ZOOM = 16;
const PIN_SIZE = 44;

/**
 * "Elegir en el mapa": el pasajero mueve el mapa bajo un puntero fijo y la
 * direccion del centro pasa a ser el destino. Solo al pedir un viaje; no hay
 * endpoint para cambiar el destino de uno en curso.
 *
 * Sin `mapPadding` ni camara programatica: en Android el padding aplicado antes
 * de `onMapReady` cierra la app, y aca el puntero queda justo en el centro de
 * la vista (la tarjeta inferior solo lo tapa si la pantalla es muy baja).
 */
export function MapDestinationScreen() {
  const insets = useSafeInsets();
  const picker = useMapDestinationPicker();
  // Alto de la tarjeta de abajo: el mapa termina donde empieza, asi el logo de
  // Google queda a la vista (es obligatorio) y el puntero marca su centro real.
  const [cardHeight, setCardHeight] = useState(0);

  return (
    <View className="flex-1 bg-obsidian">
      <MapView
        style={{ flex: 1, marginBottom: cardHeight }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={darkMapStyle}
        userInterfaceStyle="dark"
        initialCamera={{ center: picker.initialCenter, zoom: MAP_ZOOM, heading: 0, pitch: 0 }}
        onMapReady={picker.resolveInitialCenter}
        onRegionChangeComplete={(region) =>
          picker.onCenterChange({ latitude: region.latitude, longitude: region.longitude })
        }
        rotateEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterests={false}
        showsCompass={false}
        toolbarEnabled={false}
      />

      {/* Puntero fijo: la punta queda en el centro del mapa (el relleno inferior sube el icono). */}
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 items-center justify-center"
        style={{ bottom: cardHeight, paddingBottom: PIN_SIZE }}
      >
        <MapPin size={PIN_SIZE} color={colors.gold} fill={colors.obsidian} strokeWidth={2} />
      </View>

      <View className="absolute left-5" style={{ top: insets.top + 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-3xl border border-charcoal bg-surface px-5 pt-5"
        style={{ paddingBottom: insets.bottom + 16 }}
        onLayout={(event) => setCardHeight(Math.round(event.nativeEvent.layout.height))}
      >
        <Typography variant="caption" weight="semibold" tone="secondary" className="uppercase tracking-widest">
          {picker.targetLabel}
        </Typography>

        {picker.status === 'error' ? (
          <View className="gap-3" accessibilityLiveRegion="polite">
            <Typography tone="danger">{picker.errorMessage}</Typography>
            <SecondaryButton title="Reintentar" icon={RefreshCw} onPress={picker.retry} accessibilityLabel="Reintentar" />
          </View>
        ) : picker.status === 'loading' ? (
          <View className="gap-1" accessibilityLiveRegion="polite">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator size="small" color={colors.gold} />
              <Typography tone="secondary">Buscando la dirección…</Typography>
            </View>
            {picker.isSlow ? (
              <Typography variant="caption" tone="secondary">
                El servidor está despertando, puede tardar hasta un minuto.
              </Typography>
            ) : null}
          </View>
        ) : picker.place ? (
          <View className="gap-0.5" accessibilityLiveRegion="polite">
            <Typography variant="bodyLarge" weight="semibold" numberOfLines={1}>
              {picker.place.name}
            </Typography>
            {picker.place.detail ? (
              <Typography variant="caption" tone="secondary" numberOfLines={1}>
                {picker.place.detail}
              </Typography>
            ) : null}
            {picker.blockedMessage ? (
              <Typography tone="accent" className="mt-1">
                {picker.blockedMessage}
              </Typography>
            ) : null}
          </View>
        ) : null}

        <VIPButton
          title={`Confirmar ${picker.targetLabel.toLowerCase()}`}
          accessibilityLabel={`Confirmar ${picker.targetLabel.toLowerCase()}`}
          disabled={picker.status !== 'ready' || picker.isConfirming || picker.blockedMessage !== null}
          onPress={picker.confirm}
        />
      </View>
    </View>
  );
}
