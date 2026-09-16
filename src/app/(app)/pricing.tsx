import { UpcomingScreen } from '@/presentation/screens/UpcomingScreen';
import { useTripStore } from '@/presentation/store/useTripStore';

// Provisoria hasta el ticket de cotizacion (POST /rides/quote).
export default function PricingRoute() {
  const origin = useTripStore((state) => state.origin);
  const destination = useTripStore((state) => state.destinationLocation);

  const route = origin && destination ? `${origin.name} → ${destination.name}. ` : '';

  return (
    <UpcomingScreen
      title="Cotización"
      description={`${route}La cotización del viaje llega en la próxima versión de la app.`}
      showBack
    />
  );
}
