import { MessageCircle, Phone, Star, X, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import type { Trip } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';
import { showComingSoon } from '@/presentation/utils/coming-soon';

import { PlatePill } from './PlatePill';
import { TripRouteCard } from './TripRouteCard';
import { Typography } from './Typography';

interface DriverEnRoutePanelProps {
  trip: Trip;
  /** `true` cuando el chofer ya esta en el punto de partida. */
  arrived: boolean;
  etaMinutes: number | null;
  distanceKm: number | null;
  isCancelling: boolean;
  onCancel: () => void;
}

const countFormatter = new Intl.NumberFormat('es-AR');

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

function ActionButton({
  icon: Icon,
  label,
  loading = false,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      className="flex-1 items-center gap-2 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-charcoal">
        {loading ? <ActivityIndicator color={colors.platinum} /> : <Icon size={22} color={colors.platinum} />}
      </View>
      <Typography variant="caption" weight="medium" tone="secondary">
        {label}
      </Typography>
    </Pressable>
  );
}

/** Panel "Conductor en camino": cuanto falta, quien viene y en que auto. */
export function DriverEnRoutePanel({
  trip,
  arrived,
  etaMinutes,
  distanceKm,
  isCancelling,
  onCancel,
}: DriverEnRoutePanelProps) {
  const { driver, vehicle } = trip;

  const headline = arrived
    ? 'Tu chofer llegó'
    : etaMinutes !== null
      ? `En ${etaMinutes} ${etaMinutes === 1 ? 'minuto' : 'minutos'}`
      : 'Calculando llegada…';

  const subtitle = arrived
    ? 'Te espera en el punto de partida.'
    : distanceKm !== null
      ? `${formatDistance(distanceKm)} de distancia`
      : 'Esperando la ubicación del chofer';

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
          {arrived ? 'Punto de encuentro' : 'Conductor en camino'}
        </Typography>
        <Typography variant="h1">{headline}</Typography>
        <Typography tone="secondary">{subtitle}</Typography>
      </View>

      <View className="gap-4 rounded-xl border border-charcoal bg-field p-4">
        <View className="flex-row items-center gap-3">
          {driver?.avatarUrl ? (
            <Image source={{ uri: driver.avatarUrl }} className="h-14 w-14 rounded-full" />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Typography variant="bodyLarge" weight="bold" tone="accent">
                {driver?.initials ?? '—'}
              </Typography>
            </View>
          )}

          <View className="flex-1 gap-1">
            <Typography variant="h3" numberOfLines={1}>
              {driver?.displayName ?? 'Tu chofer'}
            </Typography>
            {driver ? (
              <View className="flex-row items-center gap-1">
                <Star size={14} color={colors.gold} fill={colors.gold} />
                {driver.ratingCount > 0 ? (
                  <Typography variant="caption" tone="secondary">
                    <Typography variant="caption" weight="semibold">
                      {driver.ratingAverage.toFixed(2)}
                    </Typography>{' '}
                    ({countFormatter.format(driver.ratingCount)} viajes)
                  </Typography>
                ) : (
                  <Typography variant="caption" tone="secondary">
                    Chofer nuevo
                  </Typography>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {vehicle ? (
          <View className="flex-row items-center justify-between gap-3 border-t border-charcoal pt-4">
            <View className="flex-1 gap-0.5">
              <Typography weight="semibold" numberOfLines={1}>
                {vehicle.name}
              </Typography>
              <Typography variant="caption" tone="secondary">
                {vehicle.color}
              </Typography>
            </View>
            <PlatePill plate={vehicle.plate} />
          </View>
        ) : null}
      </View>

      <TripRouteCard origin={trip.pickup?.address ?? null} destination={trip.dropoff?.address ?? null} fare={trip.formattedFare} />

      <View className="flex-row">
        <ActionButton icon={Phone} label="Llamar" onPress={() => showComingSoon('La llamada con tu chofer')} />
        <ActionButton icon={MessageCircle} label="Chat" onPress={() => showComingSoon('El chat con tu chofer')} />
        <ActionButton icon={X} label="Cancelar" loading={isCancelling} onPress={onCancel} />
      </View>
    </View>
  );
}
