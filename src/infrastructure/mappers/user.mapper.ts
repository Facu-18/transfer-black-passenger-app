import type { AuthUser } from '../interfaces/auth';
import type { CurrentUserResponse } from '../interfaces/user-api';

export const UserMapper = {
  toAuthUser(user: CurrentUserResponse): AuthUser {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified_at !== null,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone_number,
      roles: user.roles,
    };
  },
};
