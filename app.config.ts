import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` sigue siendo la fuente de la config estatica: este archivo solo
 * agrega lo que depende de una variable de entorno. `EXPO_PUBLIC_*` queda
 * escrita en el bundle (nada secreto): es la key de Maps SDK for Android,
 * restringida por paquete + SHA-1 en Google Cloud Console, no la key de
 * servidor que usa el backend para Places/Routes/Geocoding.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  // `config` ya es `app.json` leido: siempre trae los campos obligatorios
  // (`name`, `slug`), el tipo de `ConfigContext` solo los marca opcionales
  // porque tambien acepta un `app.config.ts` sin `app.json` de base.
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },
});
