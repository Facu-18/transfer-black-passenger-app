const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// `withSentryConfig` (de `@sentry/react-native/metro`) rompe `expo export`
// con esta combinacion de versiones de Metro/Hermes (el serializer devuelve
// el bundle sin `code`: "Cannot read properties of undefined (reading
// 'match')" en `determineDebugIdFromBundleSource`). El plugin de Expo
// (`app.config.ts`) y el SDK nativo alcanzan para capturar errores sin esto;
// solo se pierden los Debug ID automaticos en el bundle para relacionar un
// stack trace con el codigo fuente exacto.
module.exports = withNativeWind(config, { input: './global.css' });
