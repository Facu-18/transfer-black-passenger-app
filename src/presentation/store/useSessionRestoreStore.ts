import { create } from 'zustand';

interface SessionRestoreState {
  /**
   * Viaje inmediato en curso (o borrador esperando el pago) detectado al
   * restaurar la sesion; `null` sin ninguno o sin sesion restaurada. El
   * layout publico lo lee una sola vez para decidir a donde entrar y lo
   * limpia enseguida, para que un login manual posterior no reabra un viaje
   * viejo.
   */
  resumeTripId: string | null;
  setResumeTripId: (tripId: string | null) => void;
  clear: () => void;
}

export const useSessionRestoreStore = create<SessionRestoreState>()((set) => ({
  resumeTripId: null,
  setResumeTripId: (resumeTripId) => set({ resumeTripId }),
  clear: () => set({ resumeTripId: null }),
}));
