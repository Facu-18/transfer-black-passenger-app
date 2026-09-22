import { Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

interface RatingStarsProps {
  value: number;
  /** Sin `onChange` las estrellas solo muestran el valor. */
  onChange?: (value: number) => void;
  size?: number;
}

const STARS = [1, 2, 3, 4, 5];

/** Cinco estrellas gold: rellenas hasta el valor elegido, solo contorno el resto. */
export function RatingStars({ value, onChange, size = 36 }: RatingStarsProps) {
  return (
    <View className="flex-row items-center justify-center gap-4" accessibilityRole={onChange ? 'adjustable' : 'text'} accessibilityValue={{ min: 0, max: 5, now: value }}>
      {STARS.map((star) => {
        const active = star <= value;
        const icon = <Star size={size} color={colors.gold} fill={active ? colors.gold : 'transparent'} strokeWidth={1.5} />;

        return onChange ? (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            accessibilityState={{ selected: active }}
            hitSlop={6}
            onPress={() => onChange(star)}
            className="active:opacity-70"
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}
