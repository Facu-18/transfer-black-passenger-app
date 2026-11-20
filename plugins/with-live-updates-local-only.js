const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

/**
 * `expo-live-updates` declara su propio `FirebaseMessagingService` con
 * prioridad 0, y el de `expo-notifications` tiene prioridad -1. Android le
 * entrega cada mensaje de FCM a un solo servicio: el de la libreria se
 * quedaria con todos los push de Expo (que llegan como mensajes de datos) y
 * los descartaria por no traer `event`, asi que dejarian de verse las
 * notificaciones de siempre.
 *
 * Este plugin saca ese servicio del manifest. Tiene que ir ANTES de
 * `expo-live-updates` en la lista de `app.json`: los mods del manifest corren
 * en orden inverso, asi que se ejecuta despues de que la libreria lo agrega
 * (verificado con `npx expo config --type introspect`). la Live Update se inicia, actualiza y cierra desde
 * la app (con la app viva) y las notificaciones normales siguen como antes.
 */
const LIVE_UPDATES_SERVICE = 'expo.modules.liveupdates.FirebaseService';

module.exports = function withLiveUpdatesLocalOnly(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(configWithManifest.modResults);
    application.service = (application.service ?? []).filter(
      (service) => service.$?.['android:name'] !== LIVE_UPDATES_SERVICE,
    );
    return configWithManifest;
  });
};
