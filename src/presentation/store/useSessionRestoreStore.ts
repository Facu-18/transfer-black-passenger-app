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
  /**
   * Viaje que la app veia al cerrarse en el arranque anterior (ver
   * `tripResumeAttemptStorage`): en vez de volver a navegar solo y repetir
   * el cierre, se entra al Home y se ofrece abrirlo a mano. Lo consume y
   * limpia el Home, no el layout publico.
   */
  crashedTripId: string | null;
  setCrashedTripId: (tripId: string | null) => void;
  clear: () => void;
}

export const useSessionRestoreStore = create<SessionRestoreState>()((set) => ({
  resumeTripId: null,
  setResumeTripId: (resumeTripId) => set({ resumeTripId }),
  crashedTripId: null,
  setCrashedTripId: (crashedTripId) => set({ crashedTripId }),
  clear: () => set({ resumeTripId: null }),
}));
