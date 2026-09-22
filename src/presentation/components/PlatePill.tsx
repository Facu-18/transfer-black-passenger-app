import { View } from 'react-native';

import { Typography } from './Typography';

/** Patente con el formato de la chapa argentina: "ARG" arriba y el numero abajo. */
export function PlatePill({ plate }: { plate: string }) {
  return (
    <View
      accessibilityLabel={`Patente ${plate}`}
      className="items-center rounded-md border border-charcoal bg-obsidian px-3 py-1"
    >
      <Typography variant="caption" tone="secondary" className="tracking-widest">
        ARG
      </Typography>
      <Typography weight="bold" className="tracking-widest">
        {plate}
      </Typography>
    </View>
  );
}
