import { Fragment } from 'react';
import { View } from 'react-native';

import { Typography } from './Typography';
import { GlassSurface } from './GlassSurface';

interface TripRouteCardProps {
  origin: string | null;
  destination: string | null;
  /** Paradas intermedias en orden (direcciones); vacio o ausente si el viaje es directo. */
  stops?: string[];
  fare: string | null;
}

function RoutePointLabel({ label, address }: { label: string; address: string }) {
  return (
    <View className="gap-0.5">
      <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
        {label}
      </Typography>
      <Typography weight="semibold" numberOfLines={1}>
        {address}
      </Typography>
    </View>
  );
}

/** Resumen del servicio: de donde a donde (con sus paradas) y cuanto sale. */
export function TripRouteCard({ origin, destination, stops = [], fare }: TripRouteCardProps) {
  return (
    <GlassSurface className="flex-row items-center gap-4 rounded-2xl px-4 py-3">
      <View className="items-center gap-1 self-stretch py-1.5">
        <View className="h-2.5 w-2.5 rounded-full bg-gold" />
        {stops.map((_, index) => (
          <Fragment key={index}>
            <View className="w-px flex-1 bg-charcoal" />
            <View className="h-2.5 w-2.5 rounded-full border border-gold" />
          </Fragment>
        ))}
        <View className="w-px flex-1 bg-charcoal" />
        <View className="h-2.5 w-2.5 bg-platinum" />
      </View>

      <View className="flex-1 gap-3">
        <RoutePointLabel label="Ubicación de partida" address={origin ?? 'Tu ubicación'} />
        {stops.map((stop, index) => (
          <RoutePointLabel key={index} label={`Parada ${index + 1}`} address={stop} />
        ))}
        <RoutePointLabel label="Destino" address={destination ?? '—'} />
      </View>

      {fare ? (
        <Typography variant="bodyLarge" weight="bold" tone="accent">
          {fare}
        </Typography>
      ) : null}
    </GlassSurface>
  );
}
