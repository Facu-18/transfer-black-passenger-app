import { CalendarClock, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import { Typography } from '@/presentation/components/Typography';
import { colors } from '@/presentation/theme/colors';
import { formatClockTime, formatReservationDate } from '@/presentation/utils/format-date';

interface UpcomingTripCardProps {
  item: TripHistoryItem;
  onPress: () => void;
}

/**
 * "Próximo viaje reservado" del Home: fecha y hora de retiro, recorrido,
 * estado del pago y el chofer reservado si ya hay uno. Compacta a propósito:
 * el detalle completo está a un toque, en `/trips/[tripId]`.
 */
export function UpcomingTripCard({ item, onPress }: UpcomingTripCardProps) {
  const paid = item.prepaidAt !== null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Próximo viaje reservado a ${item.destination ?? 'tu destino'}`}
      onPress={onPress}
      className="gap-3 rounded-2xl border border-gold/40 bg-surface p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={16} color={colors.gold} />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            Próximo viaje reservado
          </Typography>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${paid ? 'bg-gold/15' : 'bg-charcoal'}`}>
          <Typography variant="caption" weight="semibold" tone={paid ? 'accent' : 'secondary'}>
            {paid ? 'Pagado' : 'Pendiente de pago'}
          </Typography>
        </View>
      </View>

      {item.scheduledAt ? (
        <Typography weight="semibold">
          {formatReservationDate(item.scheduledAt)} · {formatClockTime(item.scheduledAt)}
        </Typography>
      ) : null}

      <View className="flex-row items-center gap-1.5">
        <MapPin size={14} color={colors.ash} />
        <Typography tone="secondary" numberOfLines={1} className="flex-1">
          {item.origin ?? 'Origen a coordinar'} → {item.destination ?? 'Destino a coordinar'}
        </Typography>
      </View>

      {item.reservedDriver ? (
        <Typography variant="caption" tone="secondary" numberOfLines={1}>
          Tu chofer: {item.reservedDriver.displayName}
          {item.reservedDriver.vehicle ? ` · ${item.reservedDriver.vehicle.name}` : ''}
        </Typography>
      ) : null}
    </Pressable>
  );
}
