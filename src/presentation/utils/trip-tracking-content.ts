import type { Trip, TripStatus } from '@/infrastructure/interfaces/trips';

/**
 * Contenido del seguimiento en vivo (Live Activity iOS / Live Update Android).
 * Tiene que ser identico al `LiveActivityContent` del backend
 * (`modules/live-activity/services/live-activity-content.ts`): con la app
 * suspendida, el backend manda estas mismas props por APNs/FCM y la vista las
 * lee sin saber de donde vinieron.
 */
export interface TripTrackingProps {
  status: string;
  title: string;
  subtitle: string;
  driverName: string | null;
  vehicle: string | null;
  plate: string | null;
  publicCode: string;
  /** Llegada estimada (ms epoch) para la cuenta regresiva; `null` sin una. */
  etaEndsAt: number | null;
  /** Avance de 0 a 100 por etapa del viaje. */
  progress: number;
  /** Texto corto para el chip de Android (7 caracteres o menos). */
  shortText: string;
  /** Completado o cancelado: hay que cerrar el seguimiento. */
  finished: boolean;
}

/** Nombre de la Live Activity: el backend lo manda en `content-state.name`. */
export const TRIP_TRACKING_ACTIVITY_NAME = 'TripTracking';

/** Estados en los que vale la pena mostrar el seguimiento fuera de la app. */
export const LIVE_TRACKING_STATUSES: readonly TripStatus[] = [
  'assigned',
  'driver_arriving',
  'driver_arrived',
  'in_progress',
];

const PROGRESS_BY_STATUS: Partial<Record<TripStatus, number>> = {
  searching: 0,
  assigned: 20,
  driver_arriving: 40,
  driver_arrived: 60,
  in_progress: 80,
  completed: 100,
};

/** Deep link que abre la pantalla del viaje en curso. */
export function tripDeepLink(tripId: string): string {
  return `transferblack-passenger://trip/${tripId}`;
}

/**
 * Arma las props a partir del viaje que ya tiene la app. `etaMinutes` sale de
 * la estimacion local (`useDriverEta`): mientras la app esta abierta, la
 * cuenta regresiva se ve tambien camino al punto de partida.
 */
export function buildTripTrackingProps(trip: Trip, etaMinutes: number | null): TripTrackingProps {
  const driverName = trip.driver?.displayName ?? null;
  const vehicleName = trip.vehicle?.name || null;
  const plate = trip.vehicle?.plate || null;
  const copy = describe(trip.status, driverName, vehicleName, plate);
  const showsEta = trip.status === 'driver_arriving' || trip.status === 'in_progress';
  // A bordo, si el recorrido tiene paradas se avisa (solo con la app abierta:
  // con la app cerrada el texto lo arma el backend, que todavia no las menciona).
  const stopCount = trip.stops.length;
  const subtitle =
    trip.status === 'in_progress' && stopCount > 0
      ? `Recorrido con ${stopCount} ${stopCount === 1 ? 'parada' : 'paradas'} antes del destino.`
      : copy.subtitle;

  return {
    status: trip.status,
    title: copy.title,
    subtitle,
    driverName,
    vehicle: vehicleName,
    plate,
    publicCode: trip.publicCode,
    etaEndsAt: showsEta && etaMinutes !== null ? Date.now() + etaMinutes * 60_000 : null,
    progress: PROGRESS_BY_STATUS[trip.status] ?? 0,
    shortText: copy.shortText,
    finished: trip.status === 'completed' || trip.status === 'cancelled',
  };
}

function describe(
  status: TripStatus,
  driverName: string | null,
  vehicleName: string | null,
  plate: string | null,
): { title: string; subtitle: string; shortText: string } {
  const driverLine = driverName && vehicleName ? `${driverName} viene en un ${vehicleName}` : (driverName ?? '');

  switch (status) {
    case 'scheduled':
      return { title: 'Viaje programado', subtitle: 'Te avisamos cuando asignemos a tu chofer.', shortText: 'Reserva' };
    case 'searching':
      return { title: 'Buscando tu chofer', subtitle: 'Te avisamos apenas lo asignemos.', shortText: 'Buscando' };
    case 'assigned':
      return { title: 'Chofer asignado', subtitle: driverLine, shortText: plate ?? 'Asignado' };
    case 'driver_arriving':
      return { title: 'Tu chofer está en camino', subtitle: driverLine, shortText: plate ?? 'En camino' };
    case 'driver_arrived':
      return { title: 'Tu chofer llegó', subtitle: 'Te espera en el punto de partida.', shortText: 'Llegó' };
    case 'in_progress':
      return { title: 'Viaje en curso', subtitle: 'Que disfrutes el viaje.', shortText: 'A bordo' };
    case 'completed':
      return { title: 'Llegaste a destino', subtitle: 'Gracias por viajar con Transfer Black.', shortText: 'Listo' };
    case 'cancelled':
      return { title: 'El viaje se canceló', subtitle: 'Abrí la app para ver el detalle.', shortText: 'Cancel.' };
    default:
      return { title: 'Tu viaje', subtitle: 'Abrí la app para ver el detalle.', shortText: 'Viaje' };
  }
}
