import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { registerPushDeviceAction } from '@/core/actions/register-push-device.action';
import { pushDeviceStorage } from '@/infrastructure/storage/push-device-storage';

export type NotificationPermissionState =
  | 'checking'
  | 'undetermined'
  | 'denied'
  | 'granted'
  | 'unavailable';

type NotificationRegistrationState = 'idle' | 'registering' | 'registered' | 'error';

interface PushNotificationsState {
  permission: NotificationPermissionState;
  registration: NotificationRegistrationState;
  errorMessage: string | null;
  sync: (requestPermission?: boolean) => Promise<void>;
  reset: () => void;
}

export const usePushNotificationsStore = create<PushNotificationsState>()((set, get) => ({
  permission: 'checking',
  registration: 'idle',
  errorMessage: null,

  async sync(requestPermission = false) {
    if (get().registration === 'registering') return;

    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      set({ permission: 'unavailable', registration: 'idle', errorMessage: null });
      return;
    }

    set({ registration: 'registering', errorMessage: null });

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones de viajes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C9A85C',
        });
      }

      let permissions = await Notifications.getPermissionsAsync();
      if (requestPermission && !allowsNotifications(permissions)) {
        permissions = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
      }

      const permission = toPermissionState(permissions);
      if (permission !== 'granted') {
        set({ permission, registration: 'idle', errorMessage: null });
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (typeof projectId !== 'string' || projectId.length === 0) {
        throw new Error('Falta vincular la app con un proyecto de Expo/EAS.');
      }

      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      const registered = await registerPushDeviceAction({
        push_token: pushToken,
        platform: Platform.OS,
        provider: 'expo',
      });

      await pushDeviceStorage.save(registered.id);
      set({ permission: 'granted', registration: 'registered', errorMessage: null });
    } catch (error) {
      const fallback = Device.isDevice
        ? 'No pudimos registrar este dispositivo para recibir notificaciones.'
        : 'Este entorno no pudo obtener un token push de Expo.';
      set({
        registration: 'error',
        errorMessage: error instanceof Error && error.message ? error.message : fallback,
      });
    }
  },

  reset() {
    set({ permission: 'checking', registration: 'idle', errorMessage: null });
  },
}));

function allowsNotifications(permissions: Notifications.NotificationPermissionsStatus): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

function toPermissionState(
  permissions: Notifications.NotificationPermissionsStatus,
): NotificationPermissionState {
  if (allowsNotifications(permissions)) return 'granted';
  if (permissions.status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}
