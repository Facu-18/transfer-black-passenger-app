import { Text, type TextProps } from 'react-native';

type TypographyWeight = 'regular' | 'medium' | 'semibold' | 'bold';
/** `inverse` es para texto sobre superficies gold o platinum. */
type TypographyTone = 'primary' | 'secondary' | 'accent' | 'inverse';

/** Jerarquia tipografica oficial: tamaño y peso por defecto de cada nivel. */
const VARIANTS = {
  h1: { size: 'text-4xl', weight: 'bold' },
  h2: { size: 'text-2xl', weight: 'bold' },
  h3: { size: 'text-lg', weight: 'semibold' },
  bodyLarge: { size: 'text-base', weight: 'medium' },
  body: { size: 'text-sm', weight: 'regular' },
  caption: { size: 'text-xs', weight: 'regular' },
} as const satisfies Record<string, { size: string; weight: TypographyWeight }>;

// Clases literales: Tailwind solo genera las clases que encuentra escritas enteras.
const WEIGHT_CLASSES: Record<TypographyWeight, string> = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const TONE_CLASSES: Record<TypographyTone, string> = {
  primary: 'text-platinum',
  secondary: 'text-ash',
  accent: 'text-gold',
  inverse: 'text-obsidian',
};

export type TypographyVariant = keyof typeof VARIANTS;

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  /** Solo para las variantes que admiten otro peso (Body Large en Bold, Caption en Medium). */
  weight?: TypographyWeight;
  tone?: TypographyTone;
}

/**
 * Texto de la app con Montserrat ya aplicada.
 *
 * Peso y color van por props y no por `className`: dos clases que pisan la misma
 * propiedad se resuelven por el orden de la hoja generada, no por el orden en
 * que se escriben, y el resultado seria impredecible.
 */
export function Typography({
  variant = 'body',
  weight,
  tone = 'primary',
  className,
  ...props
}: TypographyProps) {
  const { size, weight: defaultWeight } = VARIANTS[variant];
  const classes = [size, WEIGHT_CLASSES[weight ?? defaultWeight], TONE_CLASSES[tone], className];

  return <Text className={classes.filter(Boolean).join(' ')} {...props} />;
}
