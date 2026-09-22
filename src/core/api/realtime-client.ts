import { io, type Socket } from 'socket.io-client';

import type {
  DriverLocation,
  DriverLocationEvent,
  RealtimeConnectionState,
  TripStatusChangedEvent,
} from '@/infrastructure/interfaces/realtime';

import { getApiUrl } from './api-config';
import { refreshAccessToken } from './session-refresh';
import { getCurrentAccessToken } from './transfer-black-api';

/** Errores del middleware de autenticacion del socket que se arreglan renovando el token. */
const TOKEN_ERRORS = new Set(['MISSING_TOKEN', 'INVALID_TOKEN']);

type Listener<T> = (value: T) => void;

function log(...args: unknown[]): void {
  if (__DEV__) {
    console.log('[socket]', ...args);
  }
}

/** El socket vive en la raiz del servidor, no bajo `/api/v1`. */
function getSocketUrl(): string {
  return getApiUrl().replace(/\/api\/v\d+\/?$/, '');
}

let socket: Socket | null = null;
let state: RealtimeConnectionState = 'idle';
/** Salas en las que hay que estar: se vuelven a pedir en cada reconexion. */
const joinedRides = new Set<string>();

const stateListeners = new Set<Listener<RealtimeConnectionState>>();
const statusListeners = new Set<Listener<TripStatusChangedEvent>>();
const locationListeners = new Set<Listener<DriverLocation>>();
const joinedListeners = new Set<Listener<string>>();

function setState(next: RealtimeConnectionState): void {
  if (state === next) return;
  state = next;
  log('estado', next);
  stateListeners.forEach((listener) => listener(next));
}

function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  const created = io(getSocketUrl(), {
    // Funcion y no valor fijo: cada reconexion lee el token vigente, que puede
    // haberse renovado desde la conexion anterior.
    auth: (callback) => callback({ token: getCurrentAccessToken() }),
    // Sin long-polling: en React Native el websocket directo es mas estable.
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  created.on('connect', () => {
    setState('connected');
    // El servidor olvida las salas al perder la conexion.
    joinedRides.forEach((rideId) => created.emit('ride:join', { rideId }));
  });

  created.on('disconnect', (reason) => {
    log('desconectado', reason);
    if (reason === 'io client disconnect') {
      setState('idle');
      return;
    }
    setState('reconnecting');
    // Si el servidor corto la conexion, socket.io no reintenta solo.
    if (reason === 'io server disconnect') {
      created.connect();
    }
  });

  created.on('connect_error', (error) => {
    log('error de conexion', error.message);

    // Un rechazo del middleware (token vencido) no se reintenta solo: hay que
    // renovar el token y volver a conectar a mano. Un corte de red si.
    if (created.active) {
      setState(state === 'connecting' ? 'connecting' : 'reconnecting');
      return;
    }

    if (!TOKEN_ERRORS.has(error.message)) {
      setState('reconnecting');
      setTimeout(() => joinedRides.size > 0 && created.connect(), 5_000);
      return;
    }

    refreshAccessToken()
      .then((token) => {
        if (token) {
          created.connect();
        } else {
          setState('unauthorized');
        }
      })
      .catch(() => {
        // Sin red para renovar: se vuelve a intentar mas tarde, la sesion sigue.
        setState('reconnecting');
        setTimeout(() => joinedRides.size > 0 && created.connect(), 5_000);
      });
  });

  created.on('ride:joined', ({ rideId }: { rideId: string }) => {
    log('en la sala del viaje', rideId);
    joinedListeners.forEach((listener) => listener(rideId));
  });
  created.on('error', (payload: unknown) => log('error del servidor', payload));

  created.on('trip:status_changed', (event: TripStatusChangedEvent) => {
    log('trip:status_changed', event.status);
    statusListeners.forEach((listener) => listener(event));
  });

  created.on('driver:location', (event: DriverLocationEvent) => {
    const location: DriverLocation = {
      coordinates: { latitude: event.latitude, longitude: event.longitude },
      recordedAt: new Date(event.timestamp),
    };
    locationListeners.forEach((listener) => listener(location));
  });

  socket = created;
  return created;
}

function subscribe<T>(listeners: Set<Listener<T>>, listener: Listener<T>): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Conexion en tiempo real del pasajero. Una sola para toda la app: las
 * pantallas se suscriben a eventos y piden seguir un viaje, pero nunca abren
 * su propio socket.
 *
 * Los eventos solo aceleran la informacion: el estado real del viaje siempre
 * se confirma por REST.
 */
export const realtimeClient = {
  /** Empieza a seguir un viaje. Conecta si hacia falta. */
  joinRide(rideId: string): void {
    const current = getSocket();
    joinedRides.add(rideId);

    if (current.connected) {
      current.emit('ride:join', { rideId });
      return;
    }

    if (!current.active) {
      setState('connecting');
      current.connect();
    }
  },

  /** Deja de seguir el viaje. Sin viajes que seguir, cierra la conexion. */
  leaveRide(rideId: string): void {
    joinedRides.delete(rideId);

    if (!socket) return;

    if (socket.connected) {
      socket.emit('ride:leave', { rideId });
    }

    if (joinedRides.size === 0) {
      socket.disconnect();
    }
  },

  getState(): RealtimeConnectionState {
    return state;
  },

  onConnectionStateChange(listener: Listener<RealtimeConnectionState>): () => void {
    return subscribe(stateListeners, listener);
  },

  onTripStatusChanged(listener: Listener<TripStatusChangedEvent>): () => void {
    return subscribe(statusListeners, listener);
  },

  /**
   * El servidor confirmo la entrada a la sala de un viaje. Desde aca llegan sus
   * avisos: lo que cambio antes hay que leerlo por REST.
   */
  onRideJoined(listener: Listener<string>): () => void {
    return subscribe(joinedListeners, listener);
  },

  onDriverLocation(listener: Listener<DriverLocation>): () => void {
    return subscribe(locationListeners, listener);
  },
};
