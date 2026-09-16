// Contrato de `/api/v1/users/me` tal como lo devuelve el backend (snake_case).

import type { UserRoleResponse } from './auth-api';

export interface CurrentUserResponse {
  id: string;
  email: string;
  email_verified_at: string | null;
  status: 'active' | 'blocked' | 'deleted';
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  roles: UserRoleResponse[];
}
