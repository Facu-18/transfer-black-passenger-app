/**
 * `PUT /rides/{tripId}/live-activity`: a donde manda el backend los cambios
 * del viaje con la app suspendida. iOS: token APNs de la Live Activity.
 * Android: token FCM + id de la notificacion de la Live Update.
 */
export type RegisterLiveActivityRequest =
  | { platform: 'ios'; push_token: string }
  | { platform: 'android'; push_token: string; notification_id: number };
