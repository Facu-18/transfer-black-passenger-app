const { colors } = require('./src/presentation/theme/colors');

/**
 * Design Tokens de Transfer Black.
 *
 * Este archivo y `src/presentation/theme/colors.js` deben ser identicos en la
 * app de pasajeros y en la de conductores: si cambia un valor aca, cambia en las dos.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Reemplaza la paleta de Tailwind en lugar de extenderla: fuera de estos
    // colores no hay clases, asi nadie usa un `bg-red-500` por fuera del diseño.
    colors: {
      transparent: 'transparent',
      ...colors,
    },
    extend: {
      // Cada peso de Montserrat es un archivo con su propio nombre de familia
      // (el que registra `useFonts` en App.tsx). `font-bold` elige el archivo
      // Bold en vez de pedir un fontWeight: en Android un fontWeight sobre una
      // fuente custom engrosa el trazo de forma sintetica.
      fontFamily: {
        sans: ['Montserrat_400Regular'],
        regular: ['Montserrat_400Regular'],
        medium: ['Montserrat_500Medium'],
        semibold: ['Montserrat_600SemiBold'],
        bold: ['Montserrat_700Bold'],
      },
    },
  },
  corePlugins: {
    // Sin esto `font-bold` generaria ademas `font-weight: 700` (ver arriba).
    fontWeight: false,
  },
  plugins: [],
};
