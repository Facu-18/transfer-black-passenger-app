import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { GuestPassenger } from '@/infrastructure/interfaces/trips';
import { useTripStore } from '@/presentation/store/useTripStore';
import { optionalEmailField } from '@/presentation/utils/auth-form-fields';
import { argentineMobileField } from '@/presentation/utils/phone';

const guestPassengerSchema = z.object({
  name: z.string().trim().min(3, 'Ingresa el nombre completo').max(120, 'El nombre es demasiado largo'),
  // El "+54 9" es un prefijo fijo en la pantalla: aca solo se valida el numero local.
  phone: argentineMobileField,
  email: optionalEmailField,
});

export type GuestPassengerFormValues = z.input<typeof guestPassengerSchema>;

interface UseGuestPassengerFormOptions {
  /** `true` cuando se entra desde el Home: al confirmar sigue a la busqueda. */
  fromHome: boolean;
}

/** "+549XXXXXXXXXX" -> "XXXXXXXXXX", para prellenar el campo del numero local. */
function toLocalNumber(phoneE164: string): string {
  return phoneE164.startsWith('+549') ? phoneE164.slice(4) : phoneE164;
}

export function useGuestPassengerForm({ fromHome }: UseGuestPassengerFormOptions) {
  const guestPassenger = useTripStore((state) => state.guestPassenger);
  const setGuestPassenger = useTripStore((state) => state.setGuestPassenger);

  const defaultValues: GuestPassengerFormValues = guestPassenger
    ? { name: guestPassenger.name, phone: toLocalNumber(guestPassenger.phoneE164), email: guestPassenger.email ?? '' }
    : { name: '', phone: '', email: '' };

  const form = useForm({
    resolver: zodResolver(guestPassengerSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(({ name, phone, email }) => {
    const guest: GuestPassenger = { name, phoneE164: phone, email };
    setGuestPassenger(guest);

    if (fromHome) {
      router.push('/search');
    } else {
      router.back();
    }
  });

  return { form, submit };
}
