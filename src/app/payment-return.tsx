import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Deep link de vuelta desde el checkout de Mercado Pago
 * (`transferblack-passenger://payment-return?trip_id=...`), para cuando la
 * app estaba cerrada o en segundo plano y el sistema operativo es quien abre
 * el link (si la app seguia al frente, `openAuthSessionAsync` ya cierra el
 * navegador solo, sin pasar por acá). Solo hace de puente hacia el
 * seguimiento del viaje, que ya consulta el estado real al montarse.
 */
export default function PaymentReturnRoute() {
  const { trip_id: rawTripId } = useLocalSearchParams<{ trip_id?: string | string[] }>();
  const tripId = Array.isArray(rawTripId) ? rawTripId[0] : rawTripId;

  if (!tripId) {
    return <Redirect href="/home" />;
  }

  return <Redirect href={{ pathname: '/trip/[tripId]', params: { tripId } }} />;
}
