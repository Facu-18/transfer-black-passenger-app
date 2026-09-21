import { REFRESH_PATH, transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { AuthSession } from '@/infrastructure/interfaces/auth';
import type { RefreshSessionRequest, RefreshSessionResponse } from '@/infrastructure/interfaces/auth-api';
import { AuthMapper } from '@/infrastructure/mappers/auth.mapper';

/**
 * Cambia el refresh token por una sesion nueva.
 *
 * El backend **rota** el refresh token: el que se mando queda invalidado y hay
 * que guardar el que vuelve en la respuesta.
 */
export async function refreshSessionAction(refreshToken: string): Promise<AuthSession> {
  const body: RefreshSessionRequest = { refresh_token: refreshToken };

  const { data } = await transferBlackApi.post<ApiDataResponse<RefreshSessionResponse>>(REFRESH_PATH, body);

  return AuthMapper.toSession(data.data.tokens);
}
