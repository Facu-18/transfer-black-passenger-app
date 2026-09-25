// Contrato de `/api/v1/users/me` tal como lo devuelve el backend (snake_case).

import type { UserRoleResponse } from './auth-api';
import type { DocumentType, Gender } from './auth';

export interface CurrentUserResponse {
  id: string;
  email: string;
  email_verified_at: string | null;
  status: 'active' | 'blocked' | 'deleted';
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  age: number | null;
  gender: Gender | null;
  document_type: DocumentType | null;
  document_number: string | null;
  address_text: string | null;
  profile_complete: boolean;
  roles: UserRoleResponse[];
}

/** Cuerpo de `PATCH /users/me`: parcial, `null` borra el valor. */
export interface UpdateCurrentUserRequest {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  birth_date?: string | null;
  gender?: Gender | null;
  document_type?: DocumentType | null;
  document_number?: string | null;
  address_text?: string | null;
}
