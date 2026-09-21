import { X } from 'lucide-react-native';
import { View } from 'react-native';

import { SecondaryButton } from './SecondaryButton';
import { TripRouteCard } from './TripRouteCard';
import { Typography } from './Typography';

interface TripSearchingPanelProps {
  origin: string | null;
  destination: string | null;
  fare: string | null;
  isCancelling: boolean;
  onCancel: () => void;
}

/** Panel del radar: la busqueda en curso y la salida para cancelarla. */
export function TripSearchingPanel({ origin, destination, fare, isCancelling, onCancel }: TripSearchingPanelProps) {
  return (
    <View className="gap-5">
      <View className="items-center gap-2">
        <View className="flex-row items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            Red VIP activa
          </Typography>
        </View>
        <Typography variant="h2" className="text-center">
          Contactando choferes VIP…
        </Typography>
        <Typography tone="secondary" className="text-center leading-5">
          Le avisamos a los choferes más cercanos. Te confirmamos apenas uno acepte.
        </Typography>
      </View>

      <TripRouteCard origin={origin} destination={destination} fare={fare} />

      <SecondaryButton title="Cancelar búsqueda" icon={X} loading={isCancelling} onPress={onCancel} />
    </View>
  );
}
