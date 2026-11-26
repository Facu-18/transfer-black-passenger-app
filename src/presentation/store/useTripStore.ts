import { create } from 'zustand';

import type { Coordinates, Place } from '@/infrastructure/interfaces/places';
import type { GuestPassenger, PaymentMethod } from '@/infrastructure/interfaces/trips';

/** Paradas intermedias como maximo: 3 destinos en total contando el final. */
export const MAX_TRIP_STOPS = 2;

interface TripState {
  /** Posicion del GPS; `null` sin permiso o mientras se obtiene. */
  currentLocation: Coordinates | null;
  /** Lugar que corresponde a `currentLocation`, para proponerlo como origen. */
  currentPlace: Place | null;
  origin: Place | null;
  destinationLocation: Place | null;
  /**
   * Paradas intermedias en el orden del recorrido. Un casillero en `null` es
   * una parada agregada que todavia no tiene direccion.
   */
  stops: (Place | null)[];
  /** Invitado cargado para un viaje de tercero; `null` si viaja el titular. */
  guestPassenger: GuestPassenger | null;
  /** Medio de pago con el que arranca Cotizacion, por ejemplo desde "Viaje corporativo" del Home. */
  preferredPaymentMethod: PaymentMethod | null;
  /**
   * Aviso de un solo uso: "Elegir en el mapa" ya guardo un punto del recorrido
   * y volvio a la busqueda, que al enfocarse sigue el flujo (pide lo que falta o
   * pasa a la cotizacion) y consume el aviso.
   */
  pendingMapPick: boolean;
  /**
   * Checkout de Mercado Pago del ultimo viaje confirmado: `GET /rides/{tripId}` no trae
   * la URL, asi que se guarda para poder reabrirlo si el pasajero cerro la pestaña.
   */
  pendingCheckout: { tripId: string; url: string } | null;
  setPendingCheckout: (checkout: { tripId: string; url: string } | null) => void;
  setPendingMapPick: (pending: boolean) => void;
  setCurrentLocation: (coordinates: Coordinates) => void;
  setCurrentPlace: (place: Place) => void;
  setOrigin: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  /** Agrega un casillero vacio al final (hasta `MAX_TRIP_STOPS`). */
  addStop: () => void;
  setStop: (index: number, place: Place) => void;
  removeStop: (index: number) => void;
  /** Un viaje nuevo desde el Home arranca sin las paradas del anterior. */
  clearStops: () => void;
  /**
   * Intercambia la parada `index` con el punto que le sigue: la otra parada o,
   * si es la ultima, el destino. Encadenando intercambios se llega a cualquier
   * orden de paradas y destino.
   */
  swapStopWithNext: (index: number) => void;
  /**
   * Mueve un punto del recorrido de `from` a `to`, contando las paradas y al
   * final el destino (`stops.length` es el destino). Lo que queda ultimo pasa
   * a ser el destino. Es lo que hace arrastrar un punto arriba de otro.
   */
  moveTripPoint: (from: number, to: number) => void;
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
  stops: [],
  guestPassenger: null,
  preferredPaymentMethod: null,
  pendingMapPick: false,
  pendingCheckout: null,

  setPendingCheckout: (pendingCheckout) => set({ pendingCheckout }),
  setPendingMapPick: (pendingMapPick) => set({ pendingMapPick }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),

  // Mientras el usuario no haya elegido otro origen, la ubicacion actual lo es
  // (y se actualiza si el GPS la afina despues de la ultima posicion conocida).
  setCurrentPlace: (currentPlace) =>
    set((state) => ({
      currentPlace,
      origin: state.origin === null || state.origin === state.currentPlace ? currentPlace : state.origin,
    })),

  setOrigin: (origin) => set({ origin }),
  setDestination: (destinationLocation) => set({ destinationLocation }),
  addStop: () =>
    set((state) => (state.stops.length < MAX_TRIP_STOPS ? { stops: [...state.stops, null] } : state)),
  setStop: (index, place) =>
    set((state) => ({ stops: state.stops.map((stop, current) => (current === index ? place : stop)) })),
  removeStop: (index) => set((state) => ({ stops: state.stops.filter((_, current) => current !== index) })),
  clearStops: () => set({ stops: [] }),
  swapStopWithNext: (index) =>
    set((state) => {
      if (index < 0 || index >= state.stops.length) return state;
      const stops = [...state.stops];
      const current = stops[index] ?? null;

      if (index < stops.length - 1) {
        stops[index] = stops[index + 1] ?? null;
        stops[index + 1] = current;
        return { stops };
      }

      // La ultima parada pasa a ser el destino, y el destino, la ultima parada.
      if (!current) return state;
      stops[index] = state.destinationLocation;
      return { stops, destinationLocation: current };
    }),
  moveTripPoint: (from, to) =>
    set((state) => {
      const points = [...state.stops, state.destinationLocation];
      if (from === to || from < 0 || to < 0 || from >= points.length || to >= points.length) return state;
      const [moved] = points.splice(from, 1);
      points.splice(to, 0, moved ?? null);
      return { stops: points.slice(0, -1), destinationLocation: points[points.length - 1] ?? null };
    }),
  setGuestPassenger: (guestPassenger) => set({ guestPassenger }),
  clearGuestPassenger: () => set({ guestPassenger: null }),
  setPreferredPaymentMethod: (preferredPaymentMethod) => set({ preferredPaymentMethod }),

  resetTrip: () =>
    set((state) => ({
      origin: state.currentPlace,
      destinationLocation: null,
      stops: [],
      guestPassenger: null,
      preferredPaymentMethod: null,
      pendingMapPick: false,
      pendingCheckout: null,
    })),
}));
