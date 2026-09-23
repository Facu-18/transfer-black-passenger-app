import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { registerPassengerAction } from '@/core/actions/register-passenger.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { emailField } from '@/presentation/utils/auth-form-fields';
import { phoneE164Field } from '@/presentation/utils/phone';

// La contraseña replica las reglas del backend (register-passenger.dto):
// asi un dato invalido se corrige en pantalla sin gastar una solicitud.
const registerPassengerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .regex(/^\S+\s+\S+/, 'Ingresa tu nombre y apellido')
    .max(201, 'El nombre es demasiado largo'),
  email: emailField,
  phone: phoneE164Field,
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Máximo 128 caracteres')
    .regex(/[a-z]/, 'Debe incluir una minúscula')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  acceptedTerms: z.boolean().refine((accepted) => accepted, 'Debes aceptar los términos para continuar'),
});

export type RegisterPassengerFormValues = z.input<typeof registerPassengerSchema>;

const DEFAULT_VALUES: RegisterPassengerFormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  acceptedTerms: false,
};

/** "Alejandro Morales Pérez" -> nombre "Alejandro", apellido "Morales Pérez". */
function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const [firstName = '', ...rest] = fullName.split(/\s+/);
  return { firstName, lastName: rest.length > 0 ? rest.join(' ') : null };
}

export function useRegisterPassengerForm() {
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm({
    resolver: zodResolver(registerPassengerSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async ({ fullName, email, phone, password }) => {
    try {
      const { user, session } = await registerPassengerAction({
        ...splitFullName(fullName),
        email,
        phone,
        password,
      });

      await setSession(session, user);
      router.replace('/verify-email');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('email', { message: 'Este correo ya tiene una cuenta. Inicia sesión.' }, { shouldFocus: true });
        return;
      }

      form.setError('root.server', {
        message: getApiErrorMessage(error, 'No pudimos crear tu cuenta. Intenta de nuevo.'),
      });
    }
  });

  return { form, submit };
}
