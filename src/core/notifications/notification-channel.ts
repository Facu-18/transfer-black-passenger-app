// Canal de notificaciones de Android. Crearlo es idempotente (llamarlo de
// nuevo con los mismos datos no hace nada), asi que se puede invocar tanto al
// arrancar la app como al sincronizar el registro push sin duplicar logica.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DEFAULT_CHANNEL_ID = 'default';

/**
 * Crea (o actualiza) el canal `default` en Android. Se llama al arrancar la
 * app, sin importar si hay sesion, porque un aviso push puede llegar antes
 * de iniciar sesion y Android necesita el canal creado para mostrarlo: sin
 * el, `expo-notifications` no tiene adonde resolver el icono/color y el
 * proceso puede terminar en una excepcion nativa al postear la notificacion.
 */
export async function ensureDefaultNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Notificaciones de viajes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C9A85C',
  });
}
