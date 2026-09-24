import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight, Download } from 'lucide-react-native';
import { useCallback } from 'react';
import { BackHandler, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RatingTag, Trip } from '@/infrastructure/interfaces/trips';
import { RatingStars } from '@/presentation/components/RatingStars';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useRateTrip } from '@/presentation/hooks/useRateTrip';
import { useTripReceipt } from '@/presentation/hooks/useTripReceipt';
import { useTripStore } from '@/presentation/store/useTripStore';
import { colors } from '@/presentation/theme/colors';
import { showComingSoon } from '@/presentation/utils/coming-soon';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/presentation/utils/payment-labels';

const STAR_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Muy bueno', 'Excelente servicio'];

const TAG_OPTIONS: { value: RatingTag; label: string }[] = [
  { value: 'punctuality', label: 'Puntualidad' },
  { value: 'smooth_driving', label: 'Conducción suave' },
  { value: 'clean_vehicle', label: 'Vehículo impecable' },
];

const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const kmFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** "35 min de trayecto · 14,2 km recorridos · 09:41 hs", con lo que haya. */
function tripFacts(trip: Trip): string[] {
  const facts: string[] = [];

  if (trip.startedAt && trip.finishedAt) {
    const minutes = Math.max(1, Math.round((trip.finishedAt.getTime() - trip.startedAt.getTime()) / 60_000));
    facts.push(`${minutes} min de trayecto`);
  }
  if (trip.distanceKm !== null) {
    facts.push(`${kmFormatter.format(trip.distanceKm)} km recorridos`);
  }
  if (trip.finishedAt) {
    facts.push(`${timeFormatter.format(trip.finishedAt)} hs`);
  }

  return facts;
}

function ReceiptCard({ trip }: { trip: Trip }) {
  const method = PAYMENT_METHOD_LABELS[trip.paymentMethod] ?? 'Pago';
  const status = trip.paymentStatus ? PAYMENT_STATUS_LABELS[trip.paymentStatus] : null;
  const paid = trip.paymentStatus === 'paid';

  return (
    <View className="gap-4 rounded-2xl border border-charcoal bg-surface p-5">
      <View className="flex-row items-start justify-between gap-3">
        <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
          Comprobante oficial
        </Typography>
        <View className={`rounded-md border px-2 py-1 ${paid ? 'border-gold/40 bg-gold/10' : 'border-charcoal'}`}>
          <Typography variant="caption" weight="semibold" tone={paid ? 'accent' : 'secondary'} className="uppercase">
            {status ? `${method} · ${status}` : method}
          </Typography>
        </View>
      </View>

      <View className="items-center gap-1 border-b border-charcoal pb-4">
        <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
          Monto total
        </Typography>
        {/* El elemento de mas peso de la pantalla: lo que se cobro. */}
        <Typography variant="h1" accessibilityLabel={`Monto total ${trip.formattedFinalFare ?? trip.formattedFare ?? ''}`}>
          {trip.formattedFinalFare ?? trip.formattedFare ?? '—'}
        </Typography>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <View className="mt-1.5 h-2 w-2 rounded-full bg-gold" />
          <View className="flex-1">
            <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
              Origen
            </Typography>
            <Typography weight="semibold">{trip.pickup?.address ?? '—'}</Typography>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="mt-1.5 h-2 w-2 rounded-full border border-gold" />
          <View className="flex-1">
            <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
              Destino
            </Typography>
            <Typography weight="semibold">{trip.dropoff?.address ?? '—'}</Typography>
          </View>
        </View>
      </View>

      {tripFacts(trip).length > 0 ? (
        <Typography variant="caption" tone="secondary" className="border-t border-charcoal pt-3 text-center">
          {tripFacts(trip).join('  ·  ')}
        </Typography>
      ) : null}
    </View>
  );
}

/**
 * Recibo del viaje terminado y calificacion del chofer.
 *
 * Se llega con `router.replace` desde el seguimiento: "atras" no vuelve al mapa.
 * Al calificar u omitir se limpia el viaje en armado y se vuelve al Home.
 */
export function ReceiptScreen() {
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId?: string }>();
  const tripId = tripIdParam ?? null;
  const insets = useSafeAreaInsets();

  const { trip, isLoading, error, retry } = useTripReceipt(tripId);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const goHome = useCallback(() => {
    resetTrip();
    router.dismissTo('/home');
  }, [resetTrip]);

  const { stars, selectStars, tags, toggleTag, submit, isSubmitting } = useRateTrip(tripId, { onRated: goHome });

  // "Atras" en Android equivale a omitir: no hay pantalla previa a la que volver.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goHome();
        return true;
      });
      return () => subscription.remove();
    }, [goHome]),
  );

  if (!tripId) {
    return <Redirect href="/home" />;
  }

  const alreadyRated = trip?.ratingGiven !== null && trip?.ratingGiven !== undefined;
  const driver = trip?.driver ?? null;

  return (
    <View className="flex-1 bg-obsidian">
      <ScrollView
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 24 }}
      >
        <View className="items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full border border-gold/60">
            <Check size={26} color={colors.gold} />
          </View>
          <View className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1">
            <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
              Viaje finalizado
            </Typography>
          </View>
          <Typography variant="h2" className="text-center">
            Viaje completado
          </Typography>
          <Typography variant="caption" tone="secondary" className="text-center uppercase tracking-widest">
            Transfer Black · Servicio privado
          </Typography>
        </View>

        {isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </View>
        ) : error || !trip ? (
          <View className="gap-4">
            <Typography tone="danger" className="text-center">
              {error ?? 'No pudimos cargar el comprobante.'}
            </Typography>
            <VIPButton title="Reintentar" onPress={() => void retry()} />
          </View>
        ) : (
          <>
            <ReceiptCard trip={trip} />

            <View className="gap-5 rounded-2xl border border-charcoal bg-surface p-5">
              <View className="flex-row items-center gap-3 border-b border-charcoal pb-4">
                {driver?.avatarUrl ? (
                  <Image source={{ uri: driver.avatarUrl }} className="h-12 w-12 rounded-full" />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                    <Typography weight="bold" tone="accent">
                      {driver?.initials ?? '—'}
                    </Typography>
                  </View>
                )}
                <View className="flex-1">
                  <Typography variant="bodyLarge" weight="bold">
                    {driver?.displayName ?? 'Tu chofer'}
                  </Typography>
                  {trip.vehicle ? (
                    <Typography variant="caption" tone="secondary" numberOfLines={1}>
                      {trip.vehicle.name} · Chofer VIP
                    </Typography>
                  ) : null}
                </View>
              </View>

              {alreadyRated ? (
                <View className="items-center gap-3">
                  <Typography weight="semibold">¡Gracias por calificar!</Typography>
                  <RatingStars value={trip.ratingGiven ?? 0} size={28} />
                </View>
              ) : (
                <View className="items-center gap-4">
                  <Typography weight="semibold">¿Cómo calificarías tu experiencia?</Typography>
                  <RatingStars value={stars} onChange={selectStars} />
                  <Typography weight="semibold" tone={stars > 0 ? 'accent' : 'secondary'}>
                    {stars > 0 ? `${STAR_LABELS[stars]} · ${stars}.0` : 'Tocá una estrella'}
                  </Typography>

                  <View className="flex-row flex-wrap justify-center gap-2">
                    {TAG_OPTIONS.map((tag) => {
                      const selected = tags.includes(tag.value);
                      return (
                        <Pressable
                          key={tag.value}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          onPress={() => toggleTag(tag.value)}
                          className={`rounded-full border px-3 py-1.5 active:opacity-80 ${
                            selected ? 'border-gold/60 bg-gold/15' : 'border-charcoal'
                          }`}
                        >
                          <Typography variant="caption" weight="medium" tone={selected ? 'accent' : 'secondary'}>
                            {tag.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View className="gap-3 border-t border-charcoal px-5 pt-4" style={{ paddingBottom: insets.bottom + 12 }}>
        {alreadyRated || error ? (
          <VIPButton title="Volver al inicio" onPress={goHome} />
        ) : (
          <>
            <VIPButton
              title="Calificar y finalizar"
              trailingIcon={ChevronRight}
              loading={isSubmitting}
              disabled={stars === 0 || !trip}
              onPress={() => void submit()}
            />
            <Pressable accessibilityRole="button" hitSlop={8} onPress={goHome} disabled={isSubmitting} className="items-center">
              <Typography tone="secondary" weight="medium">
                Omitir
              </Typography>
            </Pressable>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => showComingSoon('El comprobante en PDF')}
          className="flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <Download size={14} color={colors.ash} />
          <Typography variant="caption" tone="secondary">
            Descargar comprobante en PDF
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
