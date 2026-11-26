import { Redirect, router } from 'expo-router';
import { ArrowRight, ChevronLeft, Pencil, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { GuestPassengerChip } from '@/presentation/components/GuestPassengerChip';
import { BoardingPinToggle } from '@/presentation/components/BoardingPinToggle';
import { PaymentMethodPills, type CorporatePaymentOption } from '@/presentation/components/PaymentMethodPills';
import { RoutePreviewMap } from '@/presentation/components/RoutePreviewMap';
import { SecondaryButton } from '@/presentation/components/SecondaryButton';
import { ServiceOptionCard } from '@/presentation/components/ServiceOptionCard';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Toast } from '@/presentation/components/Toast';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { WhatsAppServicesRow } from '@/presentation/components/WhatsAppServicesRow';
import { useConfirmRide } from '@/presentation/hooks/useConfirmRide';
import { useCorporateEligibility } from '@/presentation/hooks/useCorporateEligibility';
import { useRideQuote } from '@/presentation/hooks/useRideQuote';
import { stopField } from '@/presentation/hooks/usePlanTrip';
import { MAX_TRIP_STOPS, useTripStore } from '@/presentation/store/useTripStore';
import { colors } from '@/presentation/theme/colors';
import { useSafeInsets } from '@/presentation/hooks/useSafeInsets';
import {
  exceedsCompanyBalance,
  getCorporateRemainingMessage,
} from '@/presentation/utils/corporate-eligibility-copy';

/** Alto estimado del panel hasta que se mide: evita un encuadre raro en el primer frame. */
const INITIAL_PANEL_HEIGHT = 400;
/** Lugar para la barra superior (volver + destino), asi la hoja nunca la tapa. */
const TOP_BAR_SPACE = 72;

export function PricingScreen() {
  const insets = useSafeInsets();
  const { height: windowHeight } = useWindowDimensions();
  const origin = useTripStore((state) => state.origin);
  const destination = useTripStore((state) => state.destinationLocation);
  const stopSlots = useTripStore((state) => state.stops);
  const addStop = useTripStore((state) => state.addStop);
  // Solo las paradas con direccion: las mismas que se cotizaron.
  const stops = useMemo(() => stopSlots.filter((stop) => stop !== null), [stopSlots]);
  const guestPassenger = useTripStore((state) => state.guestPassenger);
  const clearGuestPassenger = useTripStore((state) => state.clearGuestPassenger);

  const { quote, selectedFare, selectFare, isLoading, error, retry, hasTrip, isRateLimited, isStale, toast } = useRideQuote();
  const { paymentOption, setPaymentOption, requirePin, setRequirePin, confirm, isConfirming } = useConfirmRide({
    // Una cotizacion vieja no se confirma: su borrador es del viaje anterior.
    quote: isStale ? null : quote,
    selectedFare: isStale ? null : selectedFare,
    onQuoteExpired: retry,
  });
  const { membership: corporateMembership } = useCorporateEligibility();

  // El saldo alcanzaba cuando se consulto membership/me, pero esta tarifa en
  // particular puede superarlo: se avisa y se deshabilita la pastilla solo para ella.
  const fareExceedsCompanyBalance =
    corporateMembership && selectedFare ? exceedsCompanyBalance(corporateMembership, selectedFare.totalAmount) : false;

  // "Corporativo" solo aparece si el pasajero puede viajar a cuenta de su
  // empresa. Si puede pero esta tarifa supera el saldo, se ve deshabilitada
  // y al tocarla explica por que.
  const corporateOption: CorporatePaymentOption | null = corporateMembership?.canRideOnAccount
    ? {
        companyName: corporateMembership.company.tradeName ?? corporateMembership.company.legalName,
        enabled: !fareExceedsCompanyBalance,
        disabledReason: fareExceedsCompanyBalance ? 'El saldo de tu empresa no alcanza para este viaje.' : undefined,
        remainingMessage: getCorporateRemainingMessage(corporateMembership),
      }
    : null;

  const [panelHeight, setPanelHeight] = useState(INITIAL_PANEL_HEIGHT);
  const onPanelLayout = (event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height);

  // Sin origen y destino no hay nada que cotizar: se vuelve a elegirlos.
  if (!hasTrip || !origin || !destination) {
    return <Redirect href="/search" />;
  }

  const confirmLabel = selectedFare ? `Confirmar viaje · ${selectedFare.formattedTotal}` : 'Confirmar viaje';

  return (
    <View className="flex-1 bg-obsidian">
      <RoutePreviewMap
        origin={origin.coordinates}
        destination={destination.coordinates}
        stops={stops.map((stop) => stop.coordinates)}
        points={quote?.route.points ?? []}
        bottomInset={panelHeight}
      />

      <View
        className="absolute left-0 right-0 flex-row items-center gap-3 px-5"
        style={{ top: insets.top + 8 }}
        pointerEvents="box-none"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-obsidian/80 active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>

        <View className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-charcoal bg-obsidian/80 px-4 py-2">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          {/* El nombre se corta solo; paradas y minutos quedan siempre a la vista. */}
          <Typography variant="caption" weight="semibold" numberOfLines={1} className="shrink">
            {destination.name}
          </Typography>
          {stops.length > 0 || quote ? (
            <Typography variant="caption" tone="secondary">
              {[
                stops.length > 0 ? `${stops.length} ${stops.length === 1 ? 'parada' : 'paradas'}` : null,
                quote ? `${quote.route.durationMinutes} min` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          ) : null}
        </View>

        {stopSlots.length < MAX_TRIP_STOPS ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar parada"
            hitSlop={8}
            onPress={() => {
              // Casillero nuevo al final; la busqueda vuelve aca al completarlo.
              const field = stopField(stopSlots.length);
              addStop();
              router.push({ pathname: '/search', params: { field, returnTo: 'pricing' } });
            }}
            className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-obsidian/80 active:opacity-80"
          >
            <Plus size={20} color={colors.gold} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        onLayout={onPanelLayout}
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-charcoal bg-obsidian"
        style={{ maxHeight: windowHeight - insets.top - TOP_BAR_SPACE }}
        contentContainerClassName="gap-4 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-1 w-10 self-center rounded-full bg-charcoal" />

        {isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-14 w-full rounded-full" />
          </View>
        ) : error ? (
          <View className="gap-4">
            <Typography tone="danger" className="text-center">
              {error}
            </Typography>
            <VIPButton title="Reintentar" disabled={isRateLimited} onPress={() => void retry()} />
            {/* Si la ruta no existe (por ejemplo, dos puntos iguales), reintentar no alcanza. */}
            <SecondaryButton
              title="Cambiar recorrido"
              icon={Pencil}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/search'))}
            />
            <WhatsAppServicesRow origin={origin.name} destination={destination.name} />
          </View>
        ) : quote ? (
          <>
            {isStale ? (
              <Typography tone="accent" weight="semibold" accessibilityLiveRegion="polite" className="text-center">
                Recalculando la ruta…
              </Typography>
            ) : null}

            <View className={`gap-3 ${isStale ? 'opacity-50' : ''}`} pointerEvents={isStale ? 'none' : 'auto'}>
              {quote.options.map((option, index) => (
                <ServiceOptionCard
                  key={option.id}
                  option={option}
                  selected={option.code === selectedFare?.code}
                  durationMinutes={quote.route.durationMinutes}
                  // Con una sola categoria (hoy, Prioridad) no hay nada que recomendar.
                  recommended={index === 0 && quote.options.length > 1}
                  onPress={() => selectFare(option.code)}
                />
              ))}
            </View>

            <WhatsAppServicesRow origin={origin.name} destination={destination.name} disabled={isConfirming} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reservar este viaje para más tarde"
              disabled={isConfirming}
              onPress={() => router.push('/reserve')}
              className={`flex-row items-center justify-center gap-1.5 py-1 active:opacity-70 ${isConfirming ? 'opacity-50' : ''}`}
            >
              <Typography variant="caption" tone="secondary">
                ¿Es para más tarde?
              </Typography>
              <Typography variant="caption" weight="semibold" tone="accent">
                Reservar viaje
              </Typography>
            </Pressable>

            <GuestPassengerChip
              guest={guestPassenger}
              disabled={isConfirming || isStale}
              onEdit={() => router.push('/guest')}
              onRemove={clearGuestPassenger}
              onAddGuest={() => router.push('/guest')}
            />

            <PaymentMethodPills
              value={paymentOption}
              disabled={isConfirming || isStale}
              corporateOption={corporateOption}
              onChange={setPaymentOption}
            />

            <BoardingPinToggle value={requirePin} disabled={isConfirming || isStale} onChange={setRequirePin} />

            <VIPButton
              title={confirmLabel}
              uppercase
              trailingIcon={ArrowRight}
              loading={isConfirming}
              disabled={selectedFare === null || isStale}
              onPress={() => void confirm()}
            />
          </>
        ) : null}
      </ScrollView>

      <Toast toast={toast} bottomOffset={panelHeight} />
    </View>
  );
}
