import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FINISHED_TRIP_STATUSES, type TripStatus } from '@/infrastructure/interfaces/trips';
import { PlatePill } from '@/presentation/components/PlatePill';
import { RatingStars } from '@/presentation/components/RatingStars';
import { SecondaryButton } from '@/presentation/components/SecondaryButton';
import { Skeleton } from '@/presentation/components/Skeleton';
import { TripRouteCard } from '@/presentation/components/TripRouteCard';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useCancelReservedTrip } from '@/presentation/hooks/useCancelReservedTrip';
import { useTripDetail } from '@/presentation/hooks/useTripDetail';
import { colors } from '@/presentation/theme/colors';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/presentation/utils/payment-labels';
import { contactWhatsAppToCancelReservation } from '@/presentation/utils/whatsapp-services';

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Confirmando pago',
  scheduled: 'Programado',
  searching: 'Buscando chofer',
  assigned: 'Chofer asignado',
  driver_arriving: 'Chofer en camino',
  driver_arrived: 'Chofer en el lugar',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

/** Unico motivo que la app conoce hoy; cualquier otro se omite (no hay texto para inventarle). */
const CANCELLATION_REASON_LABELS: Record<string, string> = {
  passenger_cancelled: 'Cancelado por vos',
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl border border-charcoal bg-surface p-5">
      <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
        {title}
      </Typography>
      {children}
    </View>
  );
}

function BreakdownRow({ label, value, tone = 'primary' }: { label: string; value: string; tone?: 'primary' | 'accent' }) {
  return (
    <View className="flex-row items-center justify-between">
      <Typography tone="secondary">{label}</Typography>
      <Typography weight="semibold" tone={tone}>
        {value}
      </Typography>
    </View>
  );
}

function StatusBadge({ status }: { status: TripStatus }) {
  const cancelled = status === 'cancelled';
  const completed = status === 'completed';
  const tone = cancelled ? 'danger' : completed ? 'accent' : 'secondary';
  const bg = cancelled ? 'bg-danger/15' : completed ? 'bg-gold/15' : 'bg-charcoal';

  return (
    <View className={`self-start rounded-full px-3 py-1 ${bg}`}>
      <Typography variant="caption" weight="semibold" tone={tone}>
        {STATUS_LABELS[status]}
      </Typography>
    </View>
  );
}

/**
 * Detalle de un viaje del historial: ruta, desglose de tarifa, pago y
 * calificacion. Se llega desde la lista, siempre con un `tripId` valido.
 */
export function TripDetailScreen() {
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId?: string }>();
  const tripId = tripIdParam ?? null;
  const insets = useSafeAreaInsets();

  const { trip, isLoading, error, notFound, retry } = useTripDetail(tripId);
  const { requestCancel: requestCancelReservation, isCancelling: isCancellingReservation, needsAgencyContact } =
    useCancelReservedTrip(tripId, { onCancelled: retry });

  // Sin ninguna fecha del viaje no se muestra nada: la de hoy seria un dato falso.
  const tripDate = trip ? (trip.startedAt ?? trip.finishedAt ?? trip.cancelledAt) : null;
  const breakdown = trip?.fareBreakdown ?? null;
  const finalDiffersFromBreakdown =
    breakdown !== null && trip?.formattedFinalFare !== undefined && trip.formattedFinalFare !== null
      ? trip.formattedFinalFare !== breakdown.total.formattedAmount
      : false;

  const alreadyRated = trip?.ratingGiven !== null && trip?.ratingGiven !== undefined;
  const canRate = trip?.status === 'completed' && !alreadyRated;
  const cancellationLabel = trip?.cancellationReasonCode ? CANCELLATION_REASON_LABELS[trip.cancellationReasonCode] : null;

  // Reservado todavia no activado: fecha fija de retiro, pago por adelantado
  // y, si ya hay, el chofer que la agencia le asigno (sin vehiculo/chofer
  // definitivo hasta que el sistema active el viaje).
  const isPendingReservation = trip?.bookingType === 'scheduled' && trip.status === 'scheduled';

  // Si entre la lista y este detalle el viaje ya se activo (o la app vuelve a
  // esta pantalla con eso ya pasado), el seguimiento en vivo es lo que
  // corresponde mostrar, no este detalle de "viaje terminado".
  useEffect(() => {
    if (!tripId || !trip) return;
    if (trip.bookingType !== 'scheduled') return;
    if (trip.status === 'scheduled' || FINISHED_TRIP_STATUSES.includes(trip.status)) return;
    router.replace({ pathname: '/trip/[tripId]', params: { tripId } });
  }, [tripId, trip]);

  return (
    <View className="flex-1 bg-obsidian">
      <View className="flex-row items-center gap-3 px-5" style={{ paddingTop: insets.top + 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>
        <View className="flex-1 gap-1">
          <Typography variant="h3">{trip?.publicCode ?? 'Tu viaje'}</Typography>
          {trip ? <StatusBadge status={trip.status} /> : null}
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5" contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 24 }}>
        {isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </View>
        ) : notFound ? (
          <View className="items-center gap-4 rounded-2xl border border-charcoal bg-surface px-6 py-10">
            <Typography className="text-center" tone="secondary">
              No encontramos este viaje o no tenés acceso a él.
            </Typography>
            <VIPButton title="Volver" onPress={() => router.back()} />
          </View>
        ) : error || !trip ? (
          <View className="gap-4 rounded-2xl border border-charcoal bg-surface px-6 py-10">
            <Typography tone="danger" className="text-center">
              {error ?? 'No pudimos cargar el viaje.'}
            </Typography>
            <VIPButton title="Reintentar" onPress={() => void retry()} />
          </View>
        ) : (
          <>
            {tripDate ? (
              <Typography variant="caption" tone="secondary">
                {dateTimeFormatter.format(tripDate)}
              </Typography>
            ) : null}

            <TripRouteCard
              origin={trip.pickup?.address ?? null}
              destination={trip.dropoff?.address ?? null}
              fare={trip.formattedFinalFare ?? trip.formattedFare}
            />

            {breakdown ? (
              <Section title="Desglose de la tarifa">
                <BreakdownRow label="Base" value={breakdown.base.formattedAmount} />
                <BreakdownRow label="Distancia" value={breakdown.distance.formattedAmount} />
                <BreakdownRow label="Tiempo" value={breakdown.time.formattedAmount} />
                {breakdown.discount.amount > 0 ? (
                  <BreakdownRow label="Descuento" value={`- ${breakdown.discount.formattedAmount}`} />
                ) : null}
                {breakdown.fees.amount > 0 ? <BreakdownRow label="Cargos" value={breakdown.fees.formattedAmount} /> : null}
                <View className="border-t border-charcoal pt-3">
                  <BreakdownRow label="Total cotizado" value={breakdown.total.formattedAmount} tone="accent" />
                </View>
                {finalDiffersFromBreakdown && trip.formattedFinalFare ? (
                  <>
                    <BreakdownRow label="Total cobrado" value={trip.formattedFinalFare} tone="accent" />
                    <Typography variant="caption" tone="secondary">
                      El monto cobrado puede incluir ajustes posteriores a la cotización.
                    </Typography>
                  </>
                ) : null}
              </Section>
            ) : null}

            {isPendingReservation ? (
              <Section title="Reserva">
                <BreakdownRow
                  label="Retiro"
                  value={trip.scheduledAt ? dateTimeFormatter.format(trip.scheduledAt) : '—'}
                />
                <BreakdownRow
                  label="Estado del pago"
                  value={trip.prepaidAt ? 'Pagado' : 'Pendiente de pago'}
                  tone={trip.prepaidAt ? 'accent' : 'primary'}
                />
                {trip.reservedDriver ? (
                  <View className="flex-row items-center gap-3 pt-1">
                    {trip.reservedDriver.avatarUrl ? (
                      <Image source={{ uri: trip.reservedDriver.avatarUrl }} className="h-10 w-10 rounded-full" />
                    ) : (
                      <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                        <Typography weight="bold" tone="accent">
                          {trip.reservedDriver.initials}
                        </Typography>
                      </View>
                    )}
                    <View className="flex-1">
                      <Typography weight="semibold">{trip.reservedDriver.displayName}</Typography>
                      {trip.reservedVehicle ? (
                        <Typography variant="caption" tone="secondary" numberOfLines={1}>
                          {trip.reservedVehicle.name}
                        </Typography>
                      ) : null}
                    </View>
                    {trip.reservedVehicle ? <PlatePill plate={trip.reservedVehicle.plate} /> : null}
                  </View>
                ) : (
                  <Typography tone="secondary">Se asigna un chofer antes del viaje.</Typography>
                )}
                <Typography variant="caption" tone="secondary">
                  El viaje se activa unos minutos antes del horario.
                </Typography>
              </Section>
            ) : (
              <Section title="Pago">
                <BreakdownRow
                  label="Medio de pago"
                  value={PAYMENT_METHOD_LABELS[trip.paymentMethod] ?? 'Pago'}
                />
                {trip.paymentStatus ? (
                  <BreakdownRow label="Estado del pago" value={PAYMENT_STATUS_LABELS[trip.paymentStatus]} />
                ) : null}
              </Section>
            )}

            {isPendingReservation ? (
              needsAgencyContact ? (
                <View className="gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
                  <Typography tone="secondary">
                    Para cancelar un viaje reservado, escribile a la agencia por WhatsApp.
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Escribir a la agencia por WhatsApp"
                    onPress={() => contactWhatsAppToCancelReservation(trip.publicCode)}
                    className="flex-row items-center justify-center gap-2 self-start rounded-full bg-gold px-4 py-2 active:opacity-80"
                  >
                    <MessageCircle size={16} color={colors.obsidian} />
                    <Typography variant="caption" weight="bold" tone="inverse">
                      Escribir a la agencia
                    </Typography>
                  </Pressable>
                </View>
              ) : (
                <SecondaryButton
                  title="Cancelar reserva"
                  tone="danger"
                  loading={isCancellingReservation}
                  onPress={requestCancelReservation}
                />
              )
            ) : null}

            {trip.driver ? (
              <Section title="Chofer y vehículo">
                <View className="flex-row items-center gap-3">
                  {trip.driver.avatarUrl ? (
                    <Image source={{ uri: trip.driver.avatarUrl }} className="h-12 w-12 rounded-full" />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                      <Typography weight="bold" tone="accent">
                        {trip.driver.initials}
                      </Typography>
                    </View>
                  )}
                  <View className="flex-1">
                    <Typography weight="semibold">{trip.driver.displayName}</Typography>
                    {trip.vehicle ? (
                      <Typography variant="caption" tone="secondary" numberOfLines={1}>
                        {trip.vehicle.name}
                      </Typography>
                    ) : null}
                  </View>
                  {trip.vehicle ? <PlatePill plate={trip.vehicle.plate} /> : null}
                </View>
              </Section>
            ) : null}

            {trip.status === 'cancelled' ? (
              <Section title="Cancelación">
                {trip.cancelledAt ? (
                  <Typography weight="semibold">{dateTimeFormatter.format(trip.cancelledAt)}</Typography>
                ) : null}
                {cancellationLabel ? (
                  <Typography tone="secondary">{cancellationLabel}</Typography>
                ) : null}
              </Section>
            ) : null}

            {alreadyRated ? (
              <Section title="Tu calificación">
                <RatingStars value={trip.ratingGiven ?? 0} size={24} />
              </Section>
            ) : canRate ? (
              <VIPButton
                title="Calificar viaje"
                onPress={() => router.push({ pathname: '/receipt/[tripId]', params: { tripId: trip.id } })}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
