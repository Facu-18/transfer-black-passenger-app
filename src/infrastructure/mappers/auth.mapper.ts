import type { AuthUser, AuthSession, ResetPasswordToken } from '../interfaces/auth';
import type { AuthProfileResponse, AuthTokensResponse, VerifyResetPasswordResponse } from '../interfaces/auth-api';

export const AuthMapper = {
  toUser(profile: AuthProfileResponse): AuthUser {
    return {
      id: profile.id,
      email: profile.email,
      emailVerified: profile.email_verified_at !== null,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone_e164,
      avatarUrl: null,
      birthDate: null,
      gender: null,
      documentType: null,
      documentNumber: null,
      address: null,
      // La respuesta de auth es resumida. GET /users/me define el valor real.
      profileComplete: false,
      roles: profile.roles,
    };
  },

  toSession(tokens: AuthTokensResponse, receivedAt: Date = new Date()): AuthSession {
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(receivedAt.getTime() + tokens.expires_in * 1000),
      refreshTokenExpiresAt: new Date(tokens.refresh_expires_at),
    };
  },

  toResetPasswordToken(response: VerifyResetPasswordResponse, receivedAt: Date = new Date()): ResetPasswordToken {
    return {
      token: response.reset_token,
      expiresAt: new Date(receivedAt.getTime() + response.expires_in * 1000),
    };
  },
};
