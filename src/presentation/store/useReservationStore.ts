import { create } from 'zustand';

import type { Place } from '@/infrastructure/interfaces/places';

interface ReservationState {
  origin: Place | null;
  destination: Place | null;
  /** Fecha y hora de retiro elegidas; `null` hasta que el pasajero las carga. */
  scheduledAt: Date | null;
  /** Pasajeros o cualquier aclaracion para la agencia; vacio por defecto, es opcional. */
  notes: string;
  setOrigin: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  setScheduledAt: (date: Date | null) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

/**
 * Viaje reservado en armado: separado de `useTripStore` (el viaje "Ahora") a
 * proposito. Compartir un solo store haria que elegir origen/destino para
 * una reserva pisara el viaje inmediato que el pasajero pueda tener a medio
 * armar, o al reves: son dos intenciones distintas que conviven en la app.
 */
export const useReservationStore = create<ReservationState>()((set) => ({
  origin: null,
  destination: null,
  scheduledAt: null,
  notes: '',

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setScheduledAt: (scheduledAt) => set({ scheduledAt }),
  setNotes: (notes) => set({ notes }),

  reset: () => set({ origin: null, destination: null, scheduledAt: null, notes: '' }),
}));
