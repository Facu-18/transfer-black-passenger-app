import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/**
 * ExpoPushToken de este dispositivo. Lo usan el registro de notificaciones
 * (`POST /devices`) y el seguimiento en vivo de Android
 * (`PUT /rides/{id}/live-activity`). Lanza si la app no esta vinculada a un
 * proyecto de EAS o si el entorno no puede obtener un token.
 */
export async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string' || projectId.length === 0) {
    throw new Error('Falta vincular la app con un proyecto de Expo/EAS.');
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}
