import { CarFront } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { FareOption } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface ServiceOptionCardProps {
  option: FareOption;
  selected: boolean;
  /** Minutos estimados del viaje, iguales para todas las categorias. */
  durationMinutes: number;
  /** Etiqueta "Recomendado" para la primera opcion de la lista. */
  recommended?: boolean;
  onPress: () => void;
}

/** Tarjeta de categoría: seleccionada con borde gold de 2px y fondo más claro. */
export function ServiceOptionCard({
  option,
  selected,
  durationMinutes,
  recommended = false,
  onPress,
}: ServiceOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.name}, ${option.formattedTotal}`}
      onPress={onPress}
      className={`w-full flex-row items-center gap-3 rounded-2xl p-4 active:opacity-80 ${
        selected ? 'border-2 border-gold bg-field' : 'border border-charcoal bg-surface'
      }`}
    >
      <View
        className={`h-12 w-12 items-center justify-center rounded-xl border ${
          selected ? 'border-gold/40 bg-obsidian/60' : 'border-charcoal bg-field'
        }`}
      >
        <CarFront size={22} color={selected ? colors.gold : colors.ash} />
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Typography variant="bodyLarge" weight="bold">
            {option.name}
          </Typography>
          {recommended ? (
            <View className="rounded-full bg-gold/15 px-2 py-0.5">
              <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-wider">
                Recomendado
              </Typography>
            </View>
          ) : null}
        </View>
        <Typography variant="caption" tone="secondary">
          Llega en ~{durationMinutes} min
        </Typography>
      </View>

      <View className="items-end">
        <Typography variant="h3" weight="bold">
          {option.formattedTotal}
        </Typography>
        <Typography variant="caption" tone="secondary" className="uppercase tracking-wider">
          Fija
        </Typography>
      </View>
    </Pressable>
  );
}
