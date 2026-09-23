import { Pencil, UserPlus, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { GuestPassenger } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface GuestPassengerChipProps {
  guest: GuestPassenger | null;
  disabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onAddGuest: () => void;
}

/** En Cotizacion: quien viaja, cuando el viaje es para un invitado. */
export function GuestPassengerChip({
  guest,
  disabled = false,
  onEdit,
  onRemove,
  onAddGuest,
}: GuestPassengerChipProps) {
  if (!guest) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onAddGuest}
        className="flex-row items-center gap-2 self-start active:opacity-80"
      >
        <UserPlus size={14} color={colors.gold} />
        <Typography variant="caption" weight="semibold" tone="accent">
          Pedir para un invitado
        </Typography>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-charcoal bg-surface px-4 py-3">
      <Typography variant="caption" weight="medium" numberOfLines={1} className="flex-1">
        Viaja: {guest.name}
      </Typography>

      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar invitado"
          disabled={disabled}
          hitSlop={8}
          onPress={onEdit}
        >
          <Pencil size={16} color={colors.ash} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitar invitado"
          disabled={disabled}
          hitSlop={8}
          onPress={onRemove}
        >
          <X size={16} color={colors.ash} />
        </Pressable>
      </View>
    </View>
  );
}
