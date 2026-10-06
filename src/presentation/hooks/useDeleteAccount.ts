import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { deleteAccountAction } from '@/core/actions/delete-account.action';
import { revokePushDeviceAction } from '@/core/actions/revoke-push-device.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { pushDeviceStorage } from '@/infrastructure/storage/push-device-storage';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { usePushNotificationsStore } from '@/presentation/store/usePushNotificationsStore';
import { useTripStore } from '@/presentation/store/useTripStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';

/** Mensajes propios de este flujo; cualquier otro codigo cae al generico de `getApiErrorMessage`. */
const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'La contraseña ingresada no es correcta.',
  ACCOUNT_HAS_ACTIVE_TRIP: 'No podés eliminar tu cuenta con un viaje en curso. Esperá a que termine.',
  ACCOUNT_HAS_UPCOMING_RESERVATION:
    'Tenés una reserva próxima. Cancelala o esperá a que se complete para eliminar tu cuenta.',
};

/** Elimina (anonimiza) la cuenta del pasajero y cierra la sesion local. */
export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (password: string) => {
    if (isDeleting || password.length === 0) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAccountAction(password);

      // La cuenta ya se anonimizo y la sesion ya quedo revocada del lado del
      // backend: solo queda limpiar lo local, igual que un logout.
      try {
        const pushDeviceId = await pushDeviceStorage.get();
        if (pushDeviceId) {
          try {
            await revokePushDeviceAction(pushDeviceId);
          } catch {
            // No bloquea: la cuenta ya se elimino.
          }
          await pushDeviceStorage.clear();
        }
      } catch {
        // Idem.
      }

      await useAuthStore.getState().clearSession();
      useTripStore.getState().resetTrip();
      usePushNotificationsStore.getState().reset();

      Alert.alert(
        'Cuenta eliminada',
        'Eliminamos tu cuenta correctamente. Gracias por haber sido parte de Transfer Black.',
        [{ text: 'Entendido', onPress: () => router.replace('/login') }],
      );
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && BUSINESS_ERROR_MESSAGES[error.code]) {
        setErrorMessage(BUSINESS_ERROR_MESSAGES[error.code]);
        return;
      }

      setErrorMessage(getApiErrorMessage(error, 'No pudimos eliminar tu cuenta. Intentá de nuevo.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return { submit, isDeleting, errorMessage };
}
