import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography, type TypographyVariant } from './Typography';

const COLOR_SWATCHES = [
  { name: 'obsidian', className: 'bg-obsidian' },
  { name: 'gold', className: 'bg-gold' },
  { name: 'platinum', className: 'bg-platinum' },
  { name: 'ash', className: 'bg-ash' },
  { name: 'charcoal', className: 'bg-charcoal' },
] as const;

const TYPE_SCALE: readonly { variant: TypographyVariant; label: string }[] = [
  { variant: 'h1', label: 'H1 · 36px Bold' },
  { variant: 'h2', label: 'H2 · 24px Bold' },
  { variant: 'h3', label: 'H3 · 18px SemiBold' },
  { variant: 'bodyLarge', label: 'Body Large · 16px Medium' },
  { variant: 'body', label: 'Body Regular · 14px Regular' },
  { variant: 'caption', label: 'Caption · 12px Regular' },
];

/**
 * Prueba visual de la configuracion: paleta, Montserrat y jerarquia tipografica.
 * No es un componente de producto; se reemplaza cuando exista la primera pantalla.
 */
export function DesignSystemTest() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerClassName="gap-8 px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="gap-2">
        <Typography variant="caption" tone="accent" weight="medium">
          TRANSFER BLACK
        </Typography>
        <Typography variant="h2">Sistema de diseño</Typography>
        <Typography tone="secondary">
          Si ves Montserrat sobre fondo obsidian, NativeWind y los tokens funcionan.
        </Typography>
      </View>

      <View className="gap-3">
        <Typography variant="h3">Colores</Typography>
        <View className="flex-row flex-wrap gap-3">
          {COLOR_SWATCHES.map((swatch) => (
            <View key={swatch.name} className="items-center gap-1">
              <View className={`h-14 w-14 rounded-xl border border-charcoal ${swatch.className}`} />
              <Typography variant="caption" tone="secondary">
                {swatch.name}
              </Typography>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-3 rounded-xl border border-charcoal p-4">
        <Typography variant="h3">Tipografía</Typography>
        {TYPE_SCALE.map(({ variant, label }) => (
          <Typography key={variant} variant={variant}>
            {label}
          </Typography>
        ))}
        <Typography variant="bodyLarge" weight="bold">
          Body Large · 16px Bold
        </Typography>
        <Typography variant="caption" weight="medium" tone="secondary">
          Caption · 12px Medium · texto secundario ash
        </Typography>
      </View>

      <View className="gap-3">
        <Typography variant="h3">Acciones</Typography>
        <Pressable className="items-center rounded-xl bg-gold py-4 active:opacity-80">
          <Typography variant="bodyLarge" weight="bold" tone="inverse">
            Acción principal
          </Typography>
        </Pressable>
        <Pressable className="items-center rounded-xl border border-charcoal py-4 active:opacity-80">
          <Typography variant="bodyLarge" tone="accent">
            Acción secundaria
          </Typography>
        </Pressable>
      </View>
    </ScrollView>
  );
}
