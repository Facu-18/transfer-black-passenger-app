// Modelos de autenticacion que usa la app.

export type UserRole = 'passenger' | 'driver' | 'admin';
export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';
export type DocumentType = 'DNI' | 'CUIL';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  gender: Gender | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  address: string | null;
  profileComplete: boolean;
  roles: UserRole[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}
