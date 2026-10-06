const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withSentryConfig } = require('@sentry/react-native/metro');

const config = getDefaultConfig(__dirname);

// Agrega Debug ID al bundle y los source maps, para que Sentry pueda
// relacionar un stack trace con el codigo fuente real.
module.exports = withSentryConfig(withNativeWind(config, { input: './global.css' }));
