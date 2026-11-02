import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

/**
 * Abre el checkout de Mercado Pago y espera a que se cierre. `openAuthSessionAsync`
 * (en vez de `openBrowserAsync`) cierra el navegador solo cuando el checkout redirige
 * al deep link de vuelta (`transferblack-passenger://payment-return`, ver
 * `src/app/payment-return.tsx`), en vez de dejarlo abierto.
 *
 * El resultado no dice si se pago: el estado real lo trae `GET /rides/{tripId}`.
 */
export async function openCheckout(url: string): Promise<void> {
  await WebBrowser.openAuthSessionAsync(url, Linking.createURL('payment-return'));
}
