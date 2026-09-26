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
      avatarUrl: user.avatar_url,
      birthDate: user.birth_date,
      gender: user.gender,
      documentType: user.document_type,
      documentNumber: user.document_number,
      address: user.address_text,
      profileComplete: user.profile_complete,
      roles: user.roles,
    };
  },
};
