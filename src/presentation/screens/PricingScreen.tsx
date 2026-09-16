import { Redirect, router } from 'expo-router';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentMethodPills } from '@/presentation/components/PaymentMethodPills';
import { RoutePreviewMap } from '@/presentation/components/RoutePreviewMap';
import { ServiceOptionCard } from '@/presentation/components/ServiceOptionCard';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useConfirmRide } from '@/presentation/hooks/useConfirmRide';
import { useRideQuote } from '@/presentation/hooks/useRideQuote';
import { useTripStore } from '@/presentation/store/useTripStore';
import { colors } from '@/presentation/theme/colors';

/** Alto estimado del panel hasta que se mide: evita un encuadre raro en el primer frame. */
const INITIAL_PANEL_HEIGHT = 320;

export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const origin = useTripStore((state) => state.origin);
  const destination = useTripStore((state) => state.destinationLocation);

  const { quote, selectedFare, selectFare, isLoading, error, retry, hasTrip } = useRideQuote();
  const { paymentMethod, setPaymentMethod, confirm, isConfirming } = useConfirmRide({
    quote,
    selectedFare,
    onQuoteExpired: retry,
  });

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
          <Typography variant="caption" weight="semibold" numberOfLines={1}>
            {destination.name}
            {quote ? ` · ${quote.route.durationMinutes} min` : ''}
          </Typography>
        </View>
      </View>

      <View
        onLayout={onPanelLayout}
        className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-3xl border-t border-charcoal bg-obsidian px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
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
            <VIPButton title="Reintentar" onPress={() => void retry()} />
          </View>
        ) : quote ? (
          <>
            <View className="gap-3">
              {quote.options.map((option, index) => (
                <ServiceOptionCard
                  key={option.id}
                  option={option}
                  selected={option.code === selectedFare?.code}
                  durationMinutes={quote.route.durationMinutes}
                  recommended={index === 0}
                  onPress={() => selectFare(option.code)}
                />
              ))}
            </View>

            <PaymentMethodPills value={paymentMethod} disabled={isConfirming} onChange={setPaymentMethod} />

            <VIPButton
              title={confirmLabel}
              uppercase
              trailingIcon={ArrowRight}
              loading={isConfirming}
              disabled={selectedFare === null}
              onPress={() => void confirm()}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}
