import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { logoutAction } from '@/core/actions/logout.action';
import { revokePushDeviceAction } from '@/core/actions/revoke-push-device.action';
import { pushDeviceStorage } from '@/infrastructure/storage/push-device-storage';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';
import { VIPButton } from '@/presentation/components/VIPButton';
import { Typography } from '@/presentation/components/Typography';
import { CompleteProfileScreen } from '@/presentation/screens/CompleteProfileScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { usePushNotificationsStore } from '@/presentation/store/usePushNotificationsStore';
import { useTripStore } from '@/presentation/store/useTripStore';

export default function AccountRoute() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetTrip = useTripStore((state) => state.resetTrip);
  const permission = usePushNotificationsStore((state) => state.permission);
  const registration = usePushNotificationsStore((state) => state.registration);
  const notificationError = usePushNotificationsStore((state) => state.errorMessage);
  const syncNotifications = usePushNotificationsStore((state) => state.sync);
  const resetNotifications = usePushNotificationsStore((state) => state.reset);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const pushDeviceId = await pushDeviceStorage.get();
      if (pushDeviceId) {
        try {
          await revokePushDeviceAction(pushDeviceId);
          await pushDeviceStorage.clear();
        } catch {
          // La revocacion de la sesion sigue siendo prioritaria.
        }
      }

      const refreshToken = await refreshTokenStorage.get();
      if (refreshToken) {
        await logoutAction(refreshToken);
      }
    } catch {
      // Un fallo remoto nunca deja abierta la sesion en este dispositivo.
    } finally {
      try {
        await clearSession();
      } catch {
        // El store limpia la memoria en su finally, incluso si SecureStore falla.
      } finally {
        resetTrip();
        resetNotifications();
        router.replace('/login');
      }
    }
  };

  return (
    <CompleteProfileScreen
      footer={
        <View className="gap-4">
          <View className="gap-3 rounded-3xl border border-charcoal bg-surface/90 p-5">
            <Typography variant="h3">Notificaciones</Typography>
            <Typography tone={registration === 'error' ? 'danger' : 'secondary'}>
              {notificationStatusMessage(permission, registration, notificationError)}
            </Typography>
            {permission !== 'granted' || registration === 'error' ? (
              <VIPButton
                title={permission === 'denied' ? 'Abrir ajustes' : 'Activar notificaciones'}
                loading={registration === 'registering'}
                onPress={() => {
                  if (permission === 'denied') {
                    void Linking.openSettings();
                  } else {
                    void syncNotifications(true);
                  }
                }}
              />
            ) : null}
          </View>

          <VIPButton title="Cerrar sesión" loading={isLoggingOut} onPress={() => void logout()} />
        </View>
      }
    />
  );
}

function notificationStatusMessage(
  permission: ReturnType<typeof usePushNotificationsStore.getState>['permission'],
  registration: ReturnType<typeof usePushNotificationsStore.getState>['registration'],
  errorMessage: string | null,
): string {
  if (registration === 'error') return errorMessage ?? 'No pudimos activar las notificaciones.';
  if (registration === 'registered') return 'Están activadas para novedades importantes de tus viajes.';
  if (registration === 'registering' || permission === 'checking') return 'Comprobando el estado…';
  if (permission === 'denied') return 'Están bloqueadas. Podés habilitarlas desde los ajustes del dispositivo.';
  if (permission === 'unavailable') return 'No están disponibles en esta plataforma.';
  return 'Activalas para recibir novedades importantes de tus viajes.';
}
