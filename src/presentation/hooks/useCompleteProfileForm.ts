import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { updateCurrentUserAction } from '@/core/actions/update-current-user.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';
import { phoneE164Field } from '@/presentation/utils/phone';

const nameField = z.string().trim().min(1, 'Este campo es obligatorio').max(100, 'Máximo 100 caracteres');

const completeProfileSchema = z
  .object({
    firstName: nameField,
    lastName: nameField,
    phone: phoneE164Field,
    birthDate: z
      .iso.date('Usa el formato AAAA-MM-DD')
      .refine((value) => value <= new Date().toISOString().slice(0, 10), 'La fecha no puede ser futura'),
    gender: z.enum(['MASCULINO', 'FEMENINO', 'OTRO'], { error: 'Selecciona una opción' }),
    documentType: z.enum(['DNI', 'CUIL'], { error: 'Selecciona una opción' }),
    documentNumber: z.string().trim(),
    address: z.string().trim().min(1, 'Ingresa tu dirección').max(300, 'Máximo 300 caracteres'),
  })
  .superRefine(({ documentType, documentNumber }, context) => {
    const valid = documentType === 'DNI' ? /^\d{7,8}$/.test(documentNumber) : /^\d{11}$/.test(documentNumber);
    if (!valid) {
      context.addIssue({
        code: 'custom',
        path: ['documentNumber'],
        message: documentType === 'DNI' ? 'El DNI debe tener 7 u 8 dígitos' : 'El CUIL debe tener 11 dígitos',
      });
    }
  });

export function useCompleteProfileForm() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      birthDate: user?.birthDate ?? '',
      gender: user?.gender ?? 'MASCULINO',
      documentType: user?.documentType ?? 'DNI',
      documentNumber: user?.documentNumber ?? '',
      address: user?.address ?? '',
    },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const updatedUser = await updateCurrentUserAction({
        first_name: values.firstName,
        last_name: values.lastName,
        phone_number: values.phone,
        birth_date: values.birthDate,
        gender: values.gender,
        document_type: values.documentType,
        document_number: values.documentNumber,
        address_text: values.address,
      });

      setUser(updatedUser);
      router.replace('/home');
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }

      form.setError('root.server', {
        message: getApiErrorMessage(error, 'No pudimos guardar tu perfil. Intenta de nuevo.'),
      });
    }
  });

  return { form, submit };
}
