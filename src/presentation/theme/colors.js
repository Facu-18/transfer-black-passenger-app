/**
 * Paleta oficial de Transfer Black: unica fuente de los valores de color.
 *
 * La consumen `tailwind.config.js` (para las clases `bg-gold`, `text-ash`...) y
 * los componentes que reciben el color como prop en lugar de `className`
 * (iconos, `placeholderTextColor`, `ActivityIndicator`). Esta en JavaScript y
 * CommonJS porque `tailwind.config.js` la carga con `require`.
 *
 * Debe ser identica en la app de conductores.
 */
const colors = {
  // Paleta base
  obsidian: '#0A0A0C',
  gold: '#D4AF37',
  platinum: '#E4E4E5',
  ash: '#8E8E93',
  charcoal: '#2C2C2E',

  // Superficies y estados
  surface: '#141416',
  field: '#1A1A1C',
  danger: '#F87171',
};

module.exports = { colors };
