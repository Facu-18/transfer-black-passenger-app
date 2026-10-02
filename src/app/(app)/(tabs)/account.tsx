import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { logoutAction } from '@/core/actions/logout.action';
import { revokePushDeviceAction } from '@/core/actions/revoke-push-device.action';
import { pushDeviceStorage } from '@/infrastructure/storage/push-device-storage';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';
import { BrandLogo } from '@/presentation/components/BrandLogo';
import { CorporateMembershipSection } from '@/presentation/components/CorporateMembershipSection';
import { ProfileSummaryCard } from '@/presentation/components/ProfileSummaryCard';
import { Screen } from '@/presentation/components/Screen';
import { VIPButton } from '@/presentation/components/VIPButton';
import { Typography } from '@/presentation/components/Typography';
import { useCorporateMembership } from '@/presentation/hooks/useCorporateMembership';
import { CompleteProfileScreen } from '@/presentation/screens/CompleteProfileScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { usePushNotificationsStore } from '@/presentation/store/usePushNotificationsStore';
import { useTripStore } from '@/presentation/store/useTripStore';

export default function AccountRoute() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetTrip = useTripStore((state) => state.resetTrip);
  const permission = usePushNotificationsStore((state) => state.permission);
  const registration = usePushNotificationsStore((state) => state.registration);
  const notificationError = usePushNotificationsStore((state) => state.errorMessage);
  const syncNotifications = usePushNotificationsStore((state) => state.sync);
  const resetNotifications = usePushNotificationsStore((state) => state.reset);
  const corporateMembership = useCorporateMembership();

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

  const accountFooter = (
    <View className="gap-4">
      <CorporateMembershipSection
        membership={corporateMembership.membership}
        joinCode={corporateMembership.joinCode}
        validationError={corporateMembership.validationError}
        loadError={corporateMembership.loadError}
        joinError={corporateMembership.joinError}
        isLoading={corporateMembership.isLoading}
        isJoining={corporateMembership.isJoining}
        onJoinCodeChange={corporateMembership.setJoinCode}
        onJoin={() => void corporateMembership.join()}
        onRetry={() => void corporateMembership.retry()}
      />

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
  );

  // Con el perfil completo, por defecto se muestra el resumen y no el
  // formulario: "Modificar datos" abre el mismo formulario precargado.
  if (user?.profileComplete && !isEditing) {
    return (
      <Screen scrollable contentClassName="gap-7">
        <View className="items-center gap-3">
          <BrandLogo size="md" />
          <Typography variant="h2" className="text-center">
            Mi cuenta
          </Typography>
          <Typography tone="secondary" className="text-center">
            Mantén tus datos personales actualizados.
          </Typography>
        </View>

        <ProfileSummaryCard user={user} onEdit={() => setIsEditing(true)} />

        {accountFooter}
        <View className="h-20" />
      </Screen>
    );
  }

  return <CompleteProfileScreen onSaved={() => setIsEditing(false)} footer={accountFooter} />;
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
