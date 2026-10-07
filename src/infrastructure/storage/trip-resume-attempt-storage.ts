import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIP_RESUME_ATTEMPT_KEY = 'transferblack.trip_resume_attempt';

export interface TripResumeAttempt {
  tripId: string;
  timestamp: number;
}

function isTripResumeAttempt(value: unknown): value is TripResumeAttempt {
  if (typeof value !== 'object' || value === null) return false;
  const attempt = value as Record<string, unknown>;

  return typeof attempt.tripId === 'string' && typeof attempt.timestamp === 'number';
}

/**
 * Marca de "estoy entrando a este viaje" para detectar un bucle de cierres.
 *
 * Se guarda antes de mostrar `ActiveTripScreen` (tanto al retomarlo al abrir
 * la app como al entrar de forma normal) y se borra a los pocos segundos de
 * quedar estable, o al salir de la pantalla porque el viaje termino o el
 * usuario volvio al inicio. Si en el proximo arranque la marca todavia esta
 * con el mismo viaje, la pantalla se cerro de nuevo antes de estabilizarse:
 * `useSessionRestore` no vuelve a navegar sola ahi, para no repetir el
 * cierre en cada apertura.
 */
export const tripResumeAttemptStorage = {
  async get(): Promise<TripResumeAttempt | null> {
    try {
      const raw = await AsyncStorage.getItem(TRIP_RESUME_ATTEMPT_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isTripResumeAttempt(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async set(tripId: string): Promise<void> {
    const attempt: TripResumeAttempt = { tripId, timestamp: Date.now() };
    await AsyncStorage.setItem(TRIP_RESUME_ATTEMPT_KEY, JSON.stringify(attempt));
  },

  clear(): Promise<void> {
    return AsyncStorage.removeItem(TRIP_RESUME_ATTEMPT_KEY);
  },
};
