import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { ResetPasswordToken } from '@/infrastructure/interfaces/auth';
import type { VerifyResetPasswordRequest, VerifyResetPasswordResponse } from '@/infrastructure/interfaces/auth-api';
import { AuthMapper } from '@/infrastructure/mappers/auth.mapper';

/**
 * Valida el PIN de recuperacion de contraseña y devuelve el `reset_token` de
 * un solo uso (10 minutos) para `POST /auth/reset-password`. Volver a
 * verificar un PIN valido rota el token anterior.
 *
 * Errores que interesan a la pantalla (`ApiRequestError.code`):
 * - 400 `VERIFICATION_CODE_INVALID`: `details.attempts_remaining` (no siempre viene).
 * - 400 `VERIFICATION_CODE_EXPIRED`.
 * - 429 `VERIFICATION_CODE_LOCKED`.
 *
 * No requiere sesion.
 */
export async function verifyResetPasswordAction(email: string, code: string): Promise<ResetPasswordToken> {
  const body: VerifyResetPasswordRequest = { email: email.trim().toLowerCase(), code };

  const { data } = await transferBlackApi.post<ApiDataResponse<VerifyResetPasswordResponse>>(
    '/auth/reset-password/verify',
    body,
  );

  return AuthMapper.toResetPasswordToken(data.data);
}
