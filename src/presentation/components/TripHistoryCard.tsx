import { CarFront, Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { TripHistoryItem } from '@/infrastructure/interfaces/trips';
import { Typography } from '@/presentation/components/Typography';
import { colors } from '@/presentation/theme/colors';
import { formatClockTime, formatReservationDate, formatTripDate } from '@/presentation/utils/format-date';

interface TripHistoryCardProps {
  item: TripHistoryItem;
  /** Para las fechas relativas; se pasa desde afuera para que un tick del reloj no repinte toda la lista. */
  now: Date;
  onPress: () => void;
}

/** Un renglon del historial: servicio, destino, fecha, estado y tarifa. */
export function TripHistoryCard({ item, now, onPress }: TripHistoryCardProps) {
  const isCancelled = item.status === 'cancelled';
  const isCompleted = item.status === 'completed';
  // Reservado sin activar: todavia no hay nada "en curso" que mostrar.
  const isScheduled = item.status === 'scheduled';
  const isActive = !isCancelled && !isCompleted && !isScheduled;
  const destinationLabel = item.destination ?? item.origin ?? 'Viaje';
  // Un reservado muestra la hora de retiro pedida, no cuando se armo el viaje.
  const dateLabel =
    isScheduled && item.scheduledAt
      ? `${formatReservationDate(item.scheduledAt)} · ${formatClockTime(item.scheduledAt)}`
      : formatTripDate(item.date, now);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Viaje a ${destinationLabel}, ${dateLabel}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-platinum/10 bg-surface/85 p-4 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-obsidian">
        <CarFront size={20} color={colors.ash} />
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Typography weight="semibold" numberOfLines={1} className="flex-1">
            {destinationLabel}
          </Typography>
          {isCompleted ? <Check size={14} color={colors.gold} /> : null}
        </View>

        <Typography variant="caption" tone="secondary">
          {dateLabel}
        </Typography>

        {item.isThirdParty && item.thirdPartyName ? (
          <Typography variant="caption" tone="secondary" numberOfLines={1}>
            Para {item.thirdPartyName}
          </Typography>
        ) : null}

        {isCancelled || isActive || isScheduled ? (
          <View className={`self-start rounded-full px-2 py-0.5 ${isCancelled ? 'bg-danger/15' : 'bg-gold/15'}`}>
            <Typography variant="caption" weight="semibold" tone={isCancelled ? 'danger' : 'accent'}>
              {isCancelled ? 'Cancelado' : isScheduled ? 'Reservado' : 'En curso'}
            </Typography>
          </View>
        ) : null}
      </View>

      <Typography variant="bodyLarge" weight="bold">
        {item.formattedFare ?? '—'}
      </Typography>
    </Pressable>
  );
}
