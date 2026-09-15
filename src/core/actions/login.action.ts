import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { AuthSession, AuthUser } from '@/infrastructure/interfaces/auth';
import type { AuthSessionResponse, LoginRequest } from '@/infrastructure/interfaces/auth-api';
import { AuthMapper } from '@/infrastructure/mappers/auth.mapper';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: AuthUser;
  session: AuthSession;
}

/**
 * Inicia sesion con email y contraseña.
 *
 * Email inexistente, contraseña incorrecta y cuenta no activa responden igual
 * (401 `INVALID_CREDENTIALS`): el backend no revela cual de las tres fue.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const body: LoginRequest = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };

  const { data } = await transferBlackApi.post<ApiDataResponse<AuthSessionResponse>>('/auth/login', body);

  return {
    user: AuthMapper.toUser(data.data.profile),
    session: AuthMapper.toSession(data.data.tokens),
  };
}
