import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { captureRenderError } from '@/core/monitoring/sentry';
import { tripResumeAttemptStorage } from '@/infrastructure/storage/trip-resume-attempt-storage';
import { RouteErrorFallback } from '@/presentation/components/RouteErrorFallback';
import { ActiveTripScreen } from '@/presentation/screens/ActiveTripScreen';

export default ActiveTripScreen;

/**
 * Sin esto, un error de render acá (mapa, marcador del chofer...) tira abajo
 * toda la app en un build de release: ver `tripResumeAttemptStorage` para el
 * bucle de cierres que esto complementa.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Error de render en el viaje activo:', error);
    captureRenderError(error);
  }, [error]);

  const goHome = () => {
    void tripResumeAttemptStorage.clear();
    router.dismissTo('/home');
  };

  return <RouteErrorFallback onRetry={() => void retry()} onGoHome={goHome} />;
}
