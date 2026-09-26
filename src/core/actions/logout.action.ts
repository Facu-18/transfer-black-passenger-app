import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { LogoutRequest } from '@/infrastructure/interfaces/auth-api';

/** Revoca remotamente la familia de la sesion sin disparar una renovacion automatica. */
export async function logoutAction(refreshToken: string): Promise<void> {
  const body: LogoutRequest = { refresh_token: refreshToken };

  await transferBlackApi.post('/auth/logout', body, { skipAuth: true });
}
