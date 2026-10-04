import { create } from 'zustand';

import type { ResetPasswordToken } from '@/infrastructure/interfaces/auth';

interface PasswordResetState {
  /** Solo en memoria: nunca viaja por una URL ni se persiste en el dispositivo. */
  resetToken: ResetPasswordToken | null;
  setResetToken: (resetToken: ResetPasswordToken) => void;
  clear: () => void;
}

/**
 * Guarda el `reset_token` entre el paso del PIN y el de la contraseña nueva
 * del flujo de "olvidé mi contraseña". Va separado de `useAuthStore` porque
 * este flujo no requiere sesion.
 */
export const usePasswordResetStore = create<PasswordResetState>()((set) => ({
  resetToken: null,
  setResetToken: (resetToken) => set({ resetToken }),
  clear: () => set({ resetToken: null }),
}));
