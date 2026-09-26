import { create } from 'zustand';

import { refreshSessionAction } from '@/core/actions/refresh-session.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { setSessionRefresher } from '@/core/api/session-refresh';
import { setAccessTokenGetter } from '@/core/api/transfer-black-api';
import type { AuthSession, AuthUser } from '@/infrastructure/interfaces/auth';
import { refreshTokenStorage } from '@/infrastructure/storage/refresh-token-storage';

interface AuthState {
  /** Solo en memoria: se pierde al cerrar la app, a proposito. */
  accessToken: string | null;
  accessTokenExpiresAt: Date | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession, user: AuthUser) => Promise<void>;
  /** Guarda los tokens renovados sin tocar al usuario. */
  updateTokens: (session: AuthSession) => Promise<void>;
  /** Refleja en memoria que el backend ya confirmo el correo. */
  markEmailVerified: () => void;
  /** Reemplaza los datos del usuario con los ultimos del backend (`GET /users/me`). */
  setUser: (user: AuthUser) => void;
  markProfileIncomplete: () => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  user: null,
  isAuthenticated: false,

  async setSession(session, user) {
    // Primero el almacenamiento cifrado: si falla, la sesion no queda a medias en memoria.
    await refreshTokenStorage.save(session.refreshToken);

    set({
      accessToken: session.accessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      user,
      isAuthenticated: true,
    });
  },

  async updateTokens(session) {
    await refreshTokenStorage.save(session.refreshToken);
    set({ accessToken: session.accessToken, accessTokenExpiresAt: session.accessTokenExpiresAt });
  },

  markEmailVerified() {
    set((state) => (state.user ? { user: { ...state.user, emailVerified: true } } : {}));
  },

  setUser(user) {
    set({ user });
  },

  markProfileIncomplete() {
    set((state) => (state.user ? { user: { ...state.user, profileComplete: false } } : {}));
  },

  async clearSession() {
    try {
      await refreshTokenStorage.clear();
    } finally {
      // Aunque falle el almacenamiento seguro, la sesion no puede seguir viva
      // en memoria. El logout remoto ya invalida el token persistido.
      set({ accessToken: null, accessTokenExpiresAt: null, user: null, isAuthenticated: false });
    }
  },
}));

// Toda solicitud de `transferBlackApi` lleva el access token vigente.
setAccessTokenGetter(() => useAuthStore.getState().accessToken);

// Cuando el access token vence, la API y el socket lo renuevan con el refresh
// token guardado. Sin sesion abierta no hay nada que renovar.
setSessionRefresher(async () => {
  if (!useAuthStore.getState().isAuthenticated) {
    return null;
  }

  const refreshToken = await refreshTokenStorage.get();
  if (!refreshToken) {
    return null;
  }

  try {
    const session = await refreshSessionAction(refreshToken);
    await useAuthStore.getState().updateTokens(session);
    return session.accessToken;
  } catch (error: unknown) {
    // Solo un rechazo del backend termina la sesion; un corte de red se
    // propaga para que se reintente sin mandar al pasajero al login.
    if (error instanceof ApiRequestError && error.status !== null && error.status < 500) {
      return null;
    }
    throw error;
  }
});
