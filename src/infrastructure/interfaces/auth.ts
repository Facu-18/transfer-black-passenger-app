// Modelos de autenticacion que usa la app.

export type UserRole = 'passenger' | 'driver' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: UserRole[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}
