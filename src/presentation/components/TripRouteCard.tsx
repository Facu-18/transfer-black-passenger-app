import { View } from 'react-native';

import { Typography } from './Typography';
import { GlassSurface } from './GlassSurface';

interface TripRouteCardProps {
  origin: string | null;
  destination: string | null;
  fare: string | null;
}

/** Resumen del servicio: de donde a donde y cuanto sale. */
export function TripRouteCard({ origin, destination, fare }: TripRouteCardProps) {
  return (
    <GlassSurface className="flex-row items-center gap-4 rounded-2xl px-4 py-3">
      <View className="items-center gap-1 self-stretch py-1.5">
        <View className="h-2.5 w-2.5 rounded-full bg-gold" />
        <View className="w-px flex-1 bg-charcoal" />
        <View className="h-2.5 w-2.5 bg-platinum" />
      </View>

      <View className="flex-1 gap-3">
        <View className="gap-0.5">
          <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
            Ubicación de partida
          </Typography>
          <Typography weight="semibold" numberOfLines={1}>
            {origin ?? 'Tu ubicación'}
          </Typography>
        </View>
        <View className="gap-0.5">
          <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
            Destino
          </Typography>
          <Typography weight="semibold" numberOfLines={1}>
            {destination ?? '—'}
          </Typography>
        </View>
      </View>

      {fare ? (
        <Typography variant="bodyLarge" weight="bold" tone="accent">
          {fare}
        </Typography>
      ) : null}
    </GlassSurface>
  );
}
