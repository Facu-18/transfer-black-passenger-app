import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ForgotPasswordRequest } from '@/infrastructure/interfaces/auth-api';

/**
 * Pide el PIN de recuperacion de contraseña por correo.
 *
 * Siempre responde 202, exista o no la cuenta (no enumerar usuarios), y
 * tambien si el reenvio esta en cooldown: en ese caso el backend no manda
 * nada nuevo pero contesta igual. Solo falla por red o por un correo mal
 * formado (400 `VALIDATION_ERROR`).
 *
 * No requiere sesion.
 */
export async function forgotPasswordAction(email: string): Promise<void> {
  const body: ForgotPasswordRequest = { email: email.trim().toLowerCase() };

  await transferBlackApi.post('/auth/forgot-password', body);
}
