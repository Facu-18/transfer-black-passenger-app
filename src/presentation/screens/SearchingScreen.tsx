import { router, useLocalSearchParams } from 'expo-router';
import { CarFront, CheckCircle2, CircleSlash, Clock } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import type { TripStatus } from '@/infrastructure/interfaces/trips';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useTripStatus } from '@/presentation/hooks/useTripStatus';
import { colors } from '@/presentation/theme/colors';

interface StatusCopy {
  title: string;
  description: string;
  /** Mientras algo puede cambiar solo, se muestra el indicador de actividad. */
  waiting: boolean;
}

function describeStatus(status: TripStatus | null, paymentPending: boolean): StatusCopy {
  switch (status) {
    case 'draft':
      return {
        title: 'Confirmando tu pago',
        description: 'Cuando Mercado Pago acredite el pago empezamos a buscar tu conductor.',
        waiting: true,
      };
    case 'searching':
      return {
        title: 'Buscando conductor',
        description: 'Estamos avisando a los conductores cercanos. Te confirmamos en un momento.',
        waiting: true,
      };
    case 'assigned':
    case 'driver_arriving':
    case 'driver_arrived':
      return {
        title: '¡Conductor asignado!',
        description: 'Un conductor aceptó tu viaje y está en camino.',
        waiting: false,
      };
    case 'cancelled':
      return {
        title: 'El viaje se canceló',
        description: 'Si el pago se acreditó, se devuelve automáticamente.',
        waiting: false,
      };
    default:
      return {
        title: paymentPending ? 'Confirmando tu pago' : 'Buscando conductor',
        description: 'Estamos verificando el estado de tu viaje.',
        waiting: true,
      };
  }
}

function StatusIcon({ status, waiting }: { status: TripStatus | null; waiting: boolean }) {
  if (status === 'cancelled') {
    return <CircleSlash size={44} color={colors.ash} strokeWidth={1.75} />;
  }

  if (!waiting) {
    return <CheckCircle2 size={44} color={colors.gold} strokeWidth={1.75} />;
  }

  return status === 'draft' ? (
    <Clock size={44} color={colors.gold} strokeWidth={1.75} />
  ) : (
    <CarFront size={44} color={colors.gold} strokeWidth={1.75} />
  );
}

/** Espera tras confirmar: sigue el estado real del viaje hasta que haya conductor. */
export function SearchingScreen() {
  const { tripId, paymentPending } = useLocalSearchParams<{ tripId?: string; paymentPending?: string }>();
  const { trip, isLoading, error } = useTripStatus(tripId ?? null);

  const copy = describeStatus(trip?.status ?? null, paymentPending === '1');

  return (
    <Screen contentClassName="justify-center gap-8">
      <View className="items-center gap-6">
        <View className="h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <StatusIcon status={trip?.status ?? null} waiting={copy.waiting} />
        </View>

        <View className="items-center gap-3">
          <Typography variant="h2" className="text-center">
            {copy.title}
          </Typography>
          <Typography tone="secondary" className="text-center leading-6">
            {copy.description}
          </Typography>
          {trip ? (
            <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
              Viaje {trip.publicCode}
            </Typography>
          ) : null}
        </View>

        {copy.waiting || isLoading ? <ActivityIndicator color={colors.gold} /> : null}

        {error ? (
          <Typography variant="caption" tone="danger" className="text-center">
            {error}
          </Typography>
        ) : null}
      </View>

      <VIPButton title="Volver al inicio" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
