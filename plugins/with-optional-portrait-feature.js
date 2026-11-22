const { withAndroidManifest } = require('expo/config-plugins');

/**
 * `"orientation": "portrait"` (app.json) pone `android:screenOrientation="portrait"`
 * en la actividad, y Google Play deduce de eso que la app REQUIERE la funcion
 * `android.hardware.screen.portrait`: deja afuera a los equipos que no la
 * declaran (tablets, Chromebooks, Android XR) y la consola bloquea el envio a
 * revision ("Las declaraciones de funciones de hardware obligatorias
 * restringen la disponibilidad de tu app").
 *
 * Este plugin la declara como opcional. La app sigue bloqueada en vertical;
 * solo deja de excluir dispositivos.
 */
const PORTRAIT_FEATURE = 'android.hardware.screen.portrait';

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const manifest = configWithManifest.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];

    const existing = features.find((feature) => feature.$?.['android:name'] === PORTRAIT_FEATURE);
    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      features.push({ $: { 'android:name': PORTRAIT_FEATURE, 'android:required': 'false' } });
    }

    manifest['uses-feature'] = features;
    return configWithManifest;
  });
};
