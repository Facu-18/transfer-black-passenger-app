import { transferBlackApi } from '@/core/api/transfer-black-api';

/**
 * Pide al backend un PIN nuevo para el usuario de la sesion. El anterior deja
 * de valer en cuanto sale el correo nuevo.
 *
 * Errores que interesan a la pantalla (`ApiRequestError.code`):
 * - 429 `VERIFICATION_RECENTLY_SENT`: `details.retry_in_seconds`.
 * - 409 `EMAIL_ALREADY_VERIFIED`: el correo ya estaba verificado.
 * - 401: la sesion vencio.
 */
export async function resendVerificationAction(): Promise<void> {
  // 202 sin nada util en el cuerpo: el correo sale por fuera de la respuesta.
  await transferBlackApi.post('/auth/resend-verification');
}
