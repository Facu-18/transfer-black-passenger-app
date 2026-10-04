import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ResetPasswordRequest } from '@/infrastructure/interfaces/auth-api';

/**
 * Define la contraseña nueva con el `reset_token` obtenido al verificar el
 * PIN. El exito revoca todas las refresh sessions del usuario: tiene que
 * iniciar sesion de nuevo en todos sus dispositivos.
 *
 * Error que interesa a la pantalla: 400 `RESET_TOKEN_INVALID` (desconocido,
 * ya usado o vencido).
 *
 * No requiere sesion.
 */
export async function resetPasswordAction(resetToken: string, newPassword: string): Promise<void> {
  const body: ResetPasswordRequest = { reset_token: resetToken, new_password: newPassword };

  await transferBlackApi.post('/auth/reset-password', body);
}
