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
    // `google-services.json` (Firebase/push) esta en .gitignore y EAS Build solo
    // sube lo trackeado por git: en EAS llega como variable de tipo archivo
    // (`GOOGLE_SERVICES_JSON`, cuyo valor es la ruta del archivo en el builder).
    // En local se sigue usando el archivo de la raiz.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },
});
