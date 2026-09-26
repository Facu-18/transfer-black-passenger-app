import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { usePushNotificationsStore } from '@/presentation/store/usePushNotificationsStore';

/** Sin pedir permisos, registra el token cuando el usuario ya los habia concedido. */
export function usePushNotificationRegistration(enabled: boolean): void {
  const sync = usePushNotificationsStore((state) => state.sync);

  useEffect(() => {
    if (!enabled) return;

    void sync();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void sync();
    });

    return () => {
      appStateSubscription.remove();
      tokenSubscription.remove();
    };
  }, [enabled, sync]);
}
