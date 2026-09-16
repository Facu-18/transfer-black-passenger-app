import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAuthStore } from '@/presentation/store/useAuthStore';

/**
 * El access token dura 15 minutos y todavia no se renueva solo: ante un 401 se
 * cierra la sesion local y se vuelve al login.
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
