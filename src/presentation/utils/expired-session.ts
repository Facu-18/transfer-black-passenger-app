import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAuthStore } from '@/presentation/store/useAuthStore';

/**
 * El access token se renueva solo (ver `session-refresh.ts`). Un 401 que llega
 * hasta aca significa que tampoco se pudo renovar: el refresh token vencio o
 * fue revocado, y hay que iniciar sesion de nuevo.
 */
export function handleExpiredSession(message = 'Inicia sesión de nuevo para continuar.'): void {
  Alert.alert('Tu sesión expiró', message, [
    {
      text: 'Iniciar sesión',
      onPress: () => {
        void useAuthStore.getState().clearSession();
        router.replace('/login');
      },
    },
  ]);
}
