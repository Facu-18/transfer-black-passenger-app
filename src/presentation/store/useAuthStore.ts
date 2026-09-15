import { create } from 'zustand';

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

  async clearSession() {
    await refreshTokenStorage.clear();
    set({ accessToken: null, accessTokenExpiresAt: null, user: null, isAuthenticated: false });
  },
}));

// Toda solicitud de `transferBlackApi` lleva el access token vigente.
setAccessTokenGetter(() => useAuthStore.getState().accessToken);
