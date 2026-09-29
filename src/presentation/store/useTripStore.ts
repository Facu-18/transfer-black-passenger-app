import { create } from 'zustand';

import type { Coordinates, Place } from '@/infrastructure/interfaces/places';
import type { GuestPassenger, PaymentMethod } from '@/infrastructure/interfaces/trips';

interface TripState {
  /** Posicion del GPS; `null` sin permiso o mientras se obtiene. */
  currentLocation: Coordinates | null;
  /** Lugar que corresponde a `currentLocation`, para proponerlo como origen. */
  currentPlace: Place | null;
  origin: Place | null;
  destinationLocation: Place | null;
  /** Invitado cargado para un viaje de tercero; `null` si viaja el titular. */
  guestPassenger: GuestPassenger | null;
  /** Medio de pago con el que arranca Cotizacion, por ejemplo desde "Viaje corporativo" del Home. */
  preferredPaymentMethod: PaymentMethod | null;
  setCurrentLocation: (coordinates: Coordinates) => void;
  setCurrentPlace: (place: Place) => void;
  setOrigin: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  setGuestPassenger: (guest: GuestPassenger) => void;
  clearGuestPassenger: () => void;
  setPreferredPaymentMethod: (method: PaymentMethod | null) => void;
  resetTrip: () => void;
}

/** Viaje en armado: se completa en el Home y en "Planifica tu viaje" y lo consume la cotizacion. */
export const useTripStore = create<TripState>()((set) => ({
  currentLocation: null,
  currentPlace: null,
  origin: null,
  destinationLocation: null,
  guestPassenger: null,
  preferredPaymentMethod: null,

  setCurrentLocation: (currentLocation) => set({ currentLocation }),

  // Mientras el usuario no haya elegido otro origen, la ubicacion actual lo es.
  setCurrentPlace: (currentPlace) =>
    set((state) => ({ currentPlace, origin: state.origin ?? currentPlace })),

  setOrigin: (origin) => set({ origin }),
  setDestination: (destinationLocation) => set({ destinationLocation }),
  setGuestPassenger: (guestPassenger) => set({ guestPassenger }),
  clearGuestPassenger: () => set({ guestPassenger: null }),
  setPreferredPaymentMethod: (preferredPaymentMethod) => set({ preferredPaymentMethod }),

  resetTrip: () =>
    set((state) => ({
      origin: state.currentPlace,
      destinationLocation: null,
      guestPassenger: null,
      preferredPaymentMethod: null,
    })),
}));
