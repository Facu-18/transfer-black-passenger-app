import { View } from 'react-native';

import { Typography } from './Typography';

interface BoardingPinCardProps {
  pin: string;
}

/** Codigo que el pasajero dicta en persona; nunca se envia al conductor desde esta app. */
export function BoardingPinCard({ pin }: BoardingPinCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={`PIN de abordaje ${pin.split('').join(' ')}`}
      className="gap-2.5 rounded-2xl border border-charcoal bg-obsidian p-4"
    >
      <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
        PIN de abordaje
      </Typography>

      <View className="flex-row justify-center gap-2">
        {pin.split('').map((digit, index) => (
          <View
            // El PIN no cambia de posicion: el indice alcanza como clave.
            key={index}
            className="h-11 w-9 items-center justify-center rounded-lg bg-field"
          >
            <Typography variant="h2" weight="bold">
              {digit}
            </Typography>
          </View>
        ))}
      </View>

      <Typography variant="caption" tone="secondary" className="text-center leading-4">
        Mostralo al conductor cuando el pasajero esté dentro del vehículo.
      </Typography>
    </View>
  );
}
