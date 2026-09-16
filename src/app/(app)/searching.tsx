import { useLocalSearchParams } from 'expo-router';

import { UpcomingScreen } from '@/presentation/screens/UpcomingScreen';

// Provisoria hasta el ticket del radar de busqueda de conductores.
export default function SearchingRoute() {
  // Con transferencia el viaje espera la acreditacion de Mercado Pago para entrar en busqueda.
  const { paymentPending } = useLocalSearchParams<{ paymentPending?: string }>();

  return (
    <UpcomingScreen
      title={paymentPending === '1' ? 'Confirmando tu pago' : 'Buscando conductor'}
      description={
        paymentPending === '1'
          ? 'Cuando Mercado Pago acredite el pago empezamos a buscar tu conductor. El radar llega en la próxima versión de la app.'
          : 'Tu viaje quedó confirmado y estamos buscando un conductor. El radar llega en la próxima versión de la app.'
      }
    />
  );
}
