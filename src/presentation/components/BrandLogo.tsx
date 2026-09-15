import { Image } from 'react-native';

const LOGO = require('../../../assets/Logo.jpeg');

const SIZES = {
  md: 'h-20 w-20 rounded-2xl',
  lg: 'h-28 w-28 rounded-3xl',
} as const;

interface BrandLogoProps {
  size?: keyof typeof SIZES;
}

/** Sello de Transfer Black con marco dorado. */
export function BrandLogo({ size = 'lg' }: BrandLogoProps) {
  return (
    <Image
      source={LOGO}
      accessibilityRole="image"
      accessibilityLabel="Sello de Transfer Black"
      resizeMode="cover"
      className={`border border-gold/40 ${SIZES[size]}`}
    />
  );
}
