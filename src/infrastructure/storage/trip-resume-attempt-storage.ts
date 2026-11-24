import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIP_RESUME_ATTEMPT_KEY = 'transferblack.trip_resume_attempt';

/**
 * Intentos seguidos de mostrar el mismo viaje que terminaron con la app
 * cerrada antes de estabilizarse, a partir de los cuales se deja de abrir
 * solo. Con 1 bastaba cerrar la app a mano en los primeros segundos para que
 * el proximo arranque no volviera al viaje: un cierre aislado es normal, un
 * bucle de cierres se repite.
 */
export const MAX_UNSTABLE_RESUME_ATTEMPTS = 2;

export interface TripResumeAttempt {
  tripId: string;
  timestamp: number;
  /** Cuantas veces seguidas se intento mostrar este viaje sin que se estabilizara. */
  count: number;
}

function isTripResumeAttempt(value: unknown): value is TripResumeAttempt {
  if (typeof value !== 'object' || value === null) return false;
  const attempt = value as Record<string, unknown>;

  return typeof attempt.tripId === 'string' && typeof attempt.timestamp === 'number';
}

async function read(): Promise<TripResumeAttempt | null> {
  try {
    const raw = await AsyncStorage.getItem(TRIP_RESUME_ATTEMPT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isTripResumeAttempt(parsed)) return null;
    // Una marca de una version anterior no traia `count`: cuenta como un intento.
    return { ...parsed, count: typeof parsed.count === 'number' ? parsed.count : 1 };
  } catch {
    return null;
  }
}

async function write(attempt: TripResumeAttempt): Promise<void> {
  await AsyncStorage.setItem(TRIP_RESUME_ATTEMPT_KEY, JSON.stringify(attempt));
}

/**
 * Marca de "estoy entrando a este viaje" para detectar un bucle de cierres.
 *
 * Se anota antes de mostrar `ActiveTripScreen` (al retomarlo al abrir la app
 * o al entrar de forma normal) y se borra a los pocos segundos de quedar
 * estable, al pasar la app a segundo plano (cerrarla a mano no es un crash),
 * o al salir de la pantalla porque el viaje termino o el usuario volvio al
 * inicio. Si la app se cierra antes, la marca queda y suma un intento; recien
 * cuando se acumulan `MAX_UNSTABLE_RESUME_ATTEMPTS` seguidos con el mismo
 * viaje, `useSessionRestore` deja de navegar sola y el Home ofrece abrirlo.
 */
export const tripResumeAttemptStorage = {
  get: read,

  /**
   * Suma un intento de mostrar `tripId` (vuelve a 1 si la marca era de otro
   * viaje) y devuelve cuantos van seguidos.
   */
  async recordAttempt(tripId: string): Promise<number> {
    const previous = await read();
    const count = previous?.tripId === tripId ? previous.count + 1 : 1;
    await write({ tripId, timestamp: Date.now(), count });
    return count;
  },

  /**
   * La pantalla del viaje se monto: deja la marca si no habia ninguna para
   * este viaje, sin sumar otro intento al que ya anoto la restauracion.
   */
  async ensure(tripId: string): Promise<void> {
    const previous = await read();
    if (previous?.tripId === tripId) return;
    await write({ tripId, timestamp: Date.now(), count: 1 });
  },

  clear(): Promise<void> {
    return AsyncStorage.removeItem(TRIP_RESUME_ATTEMPT_KEY);
  },
};
