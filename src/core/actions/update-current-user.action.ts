import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { AuthUser } from '@/infrastructure/interfaces/auth';
import type { CurrentUserResponse, UpdateCurrentUserRequest } from '@/infrastructure/interfaces/user-api';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';

export async function updateCurrentUserAction(input: UpdateCurrentUserRequest): Promise<AuthUser> {
  const { data } = await transferBlackApi.patch<ApiDataResponse<CurrentUserResponse>>('/users/me', input);
  return UserMapper.toAuthUser(data.data);
}
