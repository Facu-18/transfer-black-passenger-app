import * as Notifications from 'expo-notifications';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

/** Avisos del viaje que manda el backend (`data.type`); todos traen `data.trip_id`. */
const TRIP_NOTIFICATION_TYPES = new Set([
  'trip_assigned',
  'trip_driver_arriving',
  'trip_driver_arrived',
  'trip_started',
  'trip_completed',
  'trip_cancelled',
  'trip_payment_approved',
]);

/**
 * Respuestas ya atendidas. `useLastNotificationResponse` devuelve la ultima
 * aunque ya se haya usado (por ejemplo, al volver a montar el layout), asi que
 * se recuerda por id para no navegar dos veces por el mismo toque.
 */
const handledResponses = new Set<string>();

/**
 * Tocar una notificacion del viaje abre su seguimiento, con la app abierta,
 * en segundo plano o cerrada (en frio, la respuesta queda guardada hasta que
 * monta la zona privada). La pantalla del viaje ya decide el resto: si
 * termino, pasa al recibo; si se cancelo, muestra el motivo.
 */
export function useTripNotificationNavigation(enabled: boolean): void {
  const response = Notifications.useLastNotificationResponse();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = response.notification.request.identifier;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);

    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    const type = typeof data?.type === 'string' ? data.type : null;
    const tripId = typeof data?.trip_id === 'string' ? data.trip_id : null;
    if (!type || !tripId || !TRIP_NOTIFICATION_TYPES.has(type)) return;

    // Al abrir en frio, la restauracion de la sesion ya pudo haber entrado al viaje.
    if (pathname === `/trip/${tripId}`) return;

    router.push({ pathname: '/trip/[tripId]', params: { tripId } });
  }, [enabled, response, pathname]);
}
