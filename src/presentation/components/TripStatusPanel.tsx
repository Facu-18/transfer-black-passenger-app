import { CarFront, CheckCircle2, CircleSlash, Clock, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import type { TripStatus } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';
import { VIPButton } from './VIPButton';

interface StatusCopy {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Mientras el estado puede cambiar solo, se muestra el indicador de actividad. */
  waiting: boolean;
}

function describe(status: TripStatus | null): StatusCopy {
  switch (status) {
    case 'draft':
      return {
        icon: Clock,
        title: 'Confirmando tu pago',
        description: 'Cuando Mercado Pago acredite el pago empezamos a buscar tu chofer.',
        waiting: true,
      };
    case 'scheduled':
      return {
        icon: Clock,
        title: 'Viaje programado',
        description: 'Te avisamos cuando asignemos a tu chofer.',
        waiting: false,
      };
    case 'in_progress':
      return {
        icon: CarFront,
        title: 'Viaje en curso',
        description: 'Que disfrutes el viaje.',
        waiting: false,
      };
    case 'completed':
      return {
        icon: CheckCircle2,
        title: 'Llegaste a destino',
        description: 'Gracias por viajar con Transfer Black.',
        waiting: false,
      };
    case 'cancelled':
      return {
        icon: CircleSlash,
        title: 'El viaje se canceló',
        // El backend todavia no reembolsa solo al cancelar: no prometer una devolucion automatica.
        description: 'Si ya habías pagado, contactanos para gestionar la devolución.',
        waiting: false,
      };
    default:
      return {
        icon: CarFront,
        title: 'Cargando tu viaje',
        description: 'Estamos consultando el estado de tu viaje.',
        waiting: true,
      };
  }
}

interface TripStatusPanelProps {
  status: TripStatus | null;
  publicCode: string | null;
  error: string | null;
  /** Solo en los estados finales: mientras el viaje sigue, no se sale de aca. */
  onGoHome?: () => void;
}

/** Estados sin mapa de seguimiento: pago pendiente, en curso, finalizado o cancelado. */
export function TripStatusPanel({ status, publicCode, error, onGoHome }: TripStatusPanelProps) {
  const { icon: Icon, title, description, waiting } = describe(status);

  return (
    <View className="gap-5">
      <View className="items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <Icon size={30} color={status === 'cancelled' ? colors.ash : colors.gold} strokeWidth={1.75} />
        </View>

        <View className="items-center gap-2">
          <Typography variant="h2" className="text-center">
            {title}
          </Typography>
          <Typography tone="secondary" className="text-center leading-5">
            {description}
          </Typography>
          {publicCode ? (
            <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
              Viaje {publicCode}
            </Typography>
          ) : null}
        </View>

        {waiting ? <ActivityIndicator color={colors.gold} /> : null}

        {error ? (
          <Typography variant="caption" tone="danger" className="text-center">
            {error}
          </Typography>
        ) : null}
      </View>

      {onGoHome ? <VIPButton title="Volver al inicio" onPress={onGoHome} /> : null}
    </View>
  );
}
