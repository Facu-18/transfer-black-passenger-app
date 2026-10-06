import { ChevronRight, Star, UserRound } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { AuthUser } from '@/infrastructure/interfaces/auth';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface ProfileSummaryCardProps {
  user: AuthUser;
  onEdit: () => void;
}

/** Acceso principal a los datos personales y la reputacion del pasajero. */
export function ProfileSummaryCard({ user, onEdit }: ProfileSummaryCardProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Tu perfil';
  const rating = user.ratingCount > 0 ? user.ratingAverage.toFixed(1) : 'Nuevo';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={user.profileComplete ? 'Personalizar datos personales' : 'Completar datos personales'}
      onPress={onEdit}
      className="overflow-hidden rounded-3xl border border-gold/25 bg-surface active:opacity-90"
    >
      <View className="h-1 bg-gold" />
      <View className="flex-row items-center gap-4 p-5">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-gold/60 bg-gold/10">
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <UserRound size={36} color={colors.gold} strokeWidth={1.7} />
          )}
        </View>

        <View className="flex-1 gap-2">
          <View className="gap-0.5">
            <Typography variant="h3" numberOfLines={1}>{fullName}</Typography>
            <Typography variant="caption" tone="secondary" numberOfLines={1}>{user.email}</Typography>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Star size={16} color={colors.gold} fill={user.ratingCount > 0 ? colors.gold : 'transparent'} />
            <Typography weight="bold" tone="accent">{rating}</Typography>
            <Typography variant="caption" tone="secondary">
              {user.ratingCount > 0 ? `(${user.ratingCount} viajes)` : 'Sin calificaciones'}
            </Typography>
          </View>
        </View>
        <ChevronRight size={22} color={colors.ash} />
      </View>

      <View className="flex-row items-center justify-between border-t border-charcoal px-5 py-3.5">
        <Typography weight="semibold" tone="accent">
          {user.profileComplete ? 'Personalizar datos' : 'Completar mis datos'}
        </Typography>
        <Typography variant="caption" tone="secondary">Ver formulario</Typography>
      </View>
    </Pressable>
  );
}
