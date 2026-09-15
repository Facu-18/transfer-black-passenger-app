import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { VerifyEmailRequest, VerifyEmailResponse } from '@/infrastructure/interfaces/auth-api';

/**
 * Valida el PIN del correo contra la cuenta de la sesion actual (el access
 * token lo agrega el interceptor). Devuelve la fecha de verificacion.
 *
 * Errores que interesan a la pantalla (`ApiRequestError.code`):
 * - 400 `VERIFICATION_CODE_INVALID`: `details.attempts_remaining`.
 * - 429 `VERIFICATION_CODE_LOCKED`: se agotaron los intentos, hay que reenviar.
 * - 410 `VERIFICATION_CODE_EXPIRED`: vencido o sin codigo vigente.
 * - 401: la sesion vencio.
 *
 * Es idempotente: si el correo ya estaba verificado responde 200 igual.
 */
export async function verifyEmailAction(code: string): Promise<Date> {
  const body: VerifyEmailRequest = { token: code };

  const { data } = await transferBlackApi.post<ApiDataResponse<VerifyEmailResponse>>('/auth/verify-email', body);

  return new Date(data.data.email_verified_at);
}
