import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { loginAction } from '@/core/actions/login.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { emailField } from '@/presentation/utils/auth-form-fields';

// Al iniciar sesion no se revalidan las reglas de fortaleza: una cuenta creada
// antes de que cambiaran tiene que poder entrar igual.
const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Ingresa tu contraseña').max(128, 'Máximo 128 caracteres'),
});

export type LoginFormValues = z.input<typeof loginSchema>;

const DEFAULT_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export function useLoginForm() {
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async ({ email, password }) => {
    try {
      const { user, session } = await loginAction({ email, password });

      // Conductores y administradores tienen credenciales validas, pero esta app es solo para pasajeros.
      if (!user.roles.includes('passenger')) {
        form.setError('root.server', {
          message: 'Esta cuenta no es de pasajero. Ingresa desde la app que corresponde a tu perfil.',
        });
        return;
      }

      await setSession(session, user);
      router.replace(user.emailVerified ? '/(app)/home' : '/verify-email');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        form.resetField('password');
        form.setError('root.server', { message: 'Correo o contraseña incorrectos.' });
        return;
      }

      form.setError('root.server', {
        message: getApiErrorMessage(error, 'No pudimos iniciar sesión. Intenta de nuevo.'),
      });
    }
  });

  return { form, submit };
}
