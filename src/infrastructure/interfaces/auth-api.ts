// Contratos de `/api/v1/auth` tal como los devuelve el backend (snake_case).
// No salen de core/infrastructure: los componentes reciben los modelos de `auth.ts`.

export type UserRoleResponse = 'passenger' | 'driver' | 'admin';

export interface AuthProfileResponse {
  id: string;
  email: string;
  email_verified_at: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  phone_e164: string | null;
  roles: UserRoleResponse[];
  created_at: string;
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  /** Segundos de vida del access token. */
  expires_in: number;
  refresh_expires_at: string;
}

export interface RegisterPassengerRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Respuesta de `POST /auth/register` y de `POST /auth/login`: la sesion ya iniciada. */
export interface AuthSessionResponse {
  profile: AuthProfileResponse;
  tokens: AuthTokensResponse;
}

export interface VerifyEmailRequest {
  /** El PIN de 6 digitos del correo. Se llama `token` por compatibilidad con el contrato anterior. */
  token: string;
}

export interface VerifyEmailResponse {
  user_id: string;
  email: string;
  email_verified_at: string;
}

/** Detalle de los errores de `POST /auth/verify-email` y `POST /auth/resend-verification`. */
export interface VerificationErrorDetails {
  /** 400 `VERIFICATION_CODE_INVALID`: intentos que le quedan al codigo actual. */
  attempts_remaining?: number;
  /** 429 `VERIFICATION_RECENTLY_SENT`: segundos hasta poder pedir otro correo. */
  retry_in_seconds?: number;
}

/** Cuerpo de `PATCH /users/me`: parcial, `null` borra el valor. */
export interface UpdateCurrentUserRequest {
  first_name?: string | null;
  last_name?: string | null;
  /** E.164, por ejemplo `+5493511234567`. */
  phone_number?: string | null;
}
