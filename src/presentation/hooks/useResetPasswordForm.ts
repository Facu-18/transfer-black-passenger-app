import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';

import { resetPasswordAction } from '@/core/actions/reset-password.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { usePasswordResetStore } from '@/presentation/store/usePasswordResetStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { passwordField } from '@/presentation/utils/auth-form-fields';

const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña nueva'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;

const DEFAULT_VALUES: ResetPasswordFormValues = { password: '', confirmPassword: '' };

/** Pide un PIN nuevo cuando el `reset_token` ya no sirve (vencido o usado). */
function showResetTokenInvalid() {
  Alert.alert('El código venció', 'El código venció o ya se usó. Pedí uno nuevo.', [
    { text: 'Pedir código nuevo', onPress: () => router.replace('/forgot-password') },
  ]);
}

export function useResetPasswordForm() {
  const resetToken = usePasswordResetStore((state) => state.resetToken);
  const clearResetToken = usePasswordResetStore((state) => state.clear);
  const clearSession = useAuthStore((state) => state.clearSession);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async ({ password }) => {
    // Sin token no hay nada que mandar: el paso anterior no se completo (enlace directo, app recargada).
    if (!resetToken) {
      router.replace('/forgot-password');
      return;
    }

    try {
      await resetPasswordAction(resetToken.token, password);
      clearResetToken();
      // El backend revoca todas las sesiones al cambiar la contraseña: la de
      // este dispositivo (si la hubiera) no puede seguir viva en memoria.
      await clearSession();
      router.replace('/login');
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'RESET_TOKEN_INVALID') {
        clearResetToken();
        showResetTokenInvalid();
        return;
      }

      form.setError('root.server', {
        message: getApiErrorMessage(error, 'No pudimos cambiar tu contraseña. Intentá de nuevo.'),
      });
    }
  });

  return { form, submit };
}
