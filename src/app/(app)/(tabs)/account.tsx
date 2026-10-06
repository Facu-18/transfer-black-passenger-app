import { BriefcaseBusiness, ChevronRight, CircleHelp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { logoutAction } from '@/core/actions/logout.action';
import { revokePushDeviceAction } from '@/core/actions/revoke-push-device.action';
import { pushDeviceStorage } from '@/infrastructure/storage/push-device-storage';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';
import { BrandLogo } from '@/presentation/components/BrandLogo';
import { ProfileSummaryCard } from '@/presentation/components/ProfileSummaryCard';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { CompleteProfileScreen } from '@/presentation/screens/CompleteProfileScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { usePushNotificationsStore } from '@/presentation/store/usePushNotificationsStore';
import { useTripStore } from '@/presentation/store/useTripStore';
import { colors } from '@/presentation/theme/colors';
import { contactWhatsAppHelp } from '@/presentation/utils/whatsapp-services';

interface AccountActionProps {
  title: string;
  description: string;
  icon: typeof CircleHelp;
  onPress: () => void;
}

function AccountAction({ title, description, icon: Icon, onPress }: AccountActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-3xl border border-charcoal bg-surface/90 p-5 active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
        <Icon size={23} color={colors.gold} />
      </View>
      <View className="flex-1 gap-1">
        <Typography variant="bodyLarge" weight="bold">{title}</Typography>
        <Typography variant="caption" tone="secondary">{description}</Typography>
      </View>
      <ChevronRight size={21} color={colors.ash} />
    </Pressable>
  );
}

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

  if (isEditing || !user) {
    return <CompleteProfileScreen onSaved={() => setIsEditing(false)} />;
  }

  return (
    <Screen scrollable contentClassName="gap-6">
      <View className="items-center gap-3">
        <BrandLogo size="md" />
        <Typography variant="h2" className="text-center">Mi cuenta</Typography>
        <Typography tone="secondary" className="text-center">
          Gestioná tu perfil y accedé a nuestros canales exclusivos.
        </Typography>
      </View>

      <ProfileSummaryCard user={user} onEdit={() => setIsEditing(true)} />

      <View className="gap-3">
        <AccountAction
          title="Ayuda"
          description="Contactanos por WhatsApp"
          icon={CircleHelp}
          onPress={contactWhatsAppHelp}
        />
        <AccountAction
          title="Activar Transfer Black Empresas"
          description="Vinculá tu perfil con el beneficio de tu empresa"
          icon={BriefcaseBusiness}
          onPress={() => router.push('/transfer-black-empresas')}
        />
      </View>

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
      <View className="h-20" />
    </Screen>
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
