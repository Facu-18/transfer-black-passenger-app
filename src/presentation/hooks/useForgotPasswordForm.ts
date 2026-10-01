import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { forgotPasswordAction } from '@/core/actions/forgot-password.action';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { emailField } from '@/presentation/utils/auth-form-fields';

const forgotPasswordSchema = z.object({ email: emailField });

export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;

interface UseForgotPasswordFormOptions {
  /** Correo ya tipeado en el login, si era valido: evita que lo escriba de nuevo. */
  defaultEmail?: string;
}

export function useForgotPasswordForm({ defaultEmail = '' }: UseForgotPasswordFormOptions = {}) {
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async ({ email }) => {
    try {
      await forgotPasswordAction(email);
      // El backend no dice si la cuenta existe: siempre se sigue al paso del PIN.
      router.push({ pathname: '/reset-password-verify', params: { email: email.trim().toLowerCase() } });
    } catch (error) {
      form.setError('root.server', {
        message: getApiErrorMessage(error, 'No pudimos enviar el código. Intentá de nuevo.'),
      });
    }
  });

  return { form, submit };
}
