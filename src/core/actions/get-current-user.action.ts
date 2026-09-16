import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { AuthUser } from '@/infrastructure/interfaces/auth';
import type { CurrentUserResponse } from '@/infrastructure/interfaces/user-api';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';

/** Perfil del usuario de la sesion (`GET /users/me`). */
export async function getCurrentUserAction(): Promise<AuthUser> {
  const { data } = await transferBlackApi.get<ApiDataResponse<CurrentUserResponse>>('/users/me');

  return UserMapper.toAuthUser(data.data);
}
