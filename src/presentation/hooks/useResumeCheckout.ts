import { useState } from 'react';
import { Alert } from 'react-native';

import { useTripStore } from '@/presentation/store/useTripStore';
import { openCheckout } from '@/presentation/utils/open-checkout';

interface UseResumeCheckoutOptions {
  /** Al volver del checkout se consulta el estado real: el pago pudo haberse acreditado. */
  onReturn: () => void;
}

/**
 * Reabre el checkout de un viaje en `draft`. `checkoutUrl` es `null` si la app se
 * reinicio: la URL vive solo en memoria y el backend no la expone en el detalle.
 */
export function useResumeCheckout(tripId: string | null, { onReturn }: UseResumeCheckoutOptions) {
  const checkoutUrl = useTripStore((state) =>
    state.pendingCheckout?.tripId === tripId ? state.pendingCheckout?.url ?? null : null,
  );
  const [isResuming, setIsResuming] = useState(false);

  const resumeCheckout = async () => {
    if (!checkoutUrl || isResuming) return;

    setIsResuming(true);
    try {
      await openCheckout(checkoutUrl);
      onReturn();
    } catch {
      Alert.alert('No pudimos abrir Mercado Pago', 'Intentá de nuevo en unos segundos.', [{ text: 'Entendido' }]);
    } finally {
      setIsResuming(false);
    }
  };

  return { checkoutUrl, resumeCheckout, isResuming };
}
