import { MapPin, Navigation, SlidersHorizontal, Sparkles, Star, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { Trip } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';
import { showComingSoon } from '@/presentation/utils/coming-soon';

import { PlatePill } from './PlatePill';
import { Typography } from './Typography';

interface OnBoardPanelProps {
  trip: Trip;
  /** Minutos hasta el destino; `null` mientras no hay posicion del auto. */
  etaMinutes: number | null;
}

const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

function QuickAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => showComingSoon(label)}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-charcoal bg-field py-3 active:opacity-80"
    >
      <Icon size={16} color={colors.gold} />
      <Typography variant="caption" weight="medium">
        {label}
      </Typography>
    </Pressable>
  );
}

/** Panel "a bordo": cuanto falta para llegar, a donde, y con quien. */
export function OnBoardPanel({ trip, etaMinutes }: OnBoardPanelProps) {
  const { driver, vehicle } = trip;
  const arrivalTime = etaMinutes !== null ? timeFormatter.format(new Date(Date.now() + etaMinutes * 60_000)) : null;

  return (
    <View className="gap-5">
      <View className="items-center gap-2">
        <View className="flex-row items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            En ruta al destino
          </Typography>
        </View>

        <Typography variant="h1">{etaMinutes !== null ? `${etaMinutes} min` : 'Calculando…'}</Typography>

        <View className="flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {arrivalTime ? (
            <Typography weight="semibold" tone="accent">
              Llegada {arrivalTime}
            </Typography>
          ) : null}
          <View className="flex-row items-center gap-1">
            <MapPin size={14} color={colors.ash} />
            <Typography tone="secondary" numberOfLines={1}>
              {trip.dropoff?.address ?? 'Tu destino'}
            </Typography>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-3 rounded-xl border border-charcoal bg-field p-4">
        {driver?.avatarUrl ? (
          <Image source={{ uri: driver.avatarUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <Typography weight="bold" tone="accent">
              {driver?.initials ?? '—'}
            </Typography>
          </View>
        )}

        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Typography variant="bodyLarge" weight="bold" numberOfLines={1}>
              {driver?.displayName ?? 'Tu chofer'}
            </Typography>
            {driver && driver.ratingCount > 0 ? (
              <View className="flex-row items-center gap-1">
                <Star size={12} color={colors.gold} fill={colors.gold} />
                <Typography variant="caption" weight="semibold" tone="accent">
                  {driver.ratingAverage.toFixed(2)}
                </Typography>
              </View>
            ) : null}
          </View>
          {vehicle ? (
            <Typography variant="caption" tone="secondary" numberOfLines={1}>
              {vehicle.name}
            </Typography>
          ) : null}
        </View>

        {vehicle ? <PlatePill plate={vehicle.plate} /> : null}
      </View>

      <View className="flex-row gap-2">
        <QuickAction icon={Navigation} label="Destino" />
        <QuickAction icon={SlidersHorizontal} label="Confort" />
        <QuickAction icon={Sparkles} label="Concierge" />
      </View>
    </View>
  );
}
