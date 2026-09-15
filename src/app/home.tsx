import { UpcomingScreen } from '@/presentation/screens/UpcomingScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';

// Provisoria hasta el ticket de la pantalla principal del pasajero.
export default function HomeRoute() {
  const firstName = useAuthStore((state) => state.user?.firstName);

  return (
    <UpcomingScreen
      title={firstName ? `Hola, ${firstName}` : 'Bienvenido'}
      description="Tu sesión está iniciada. La pantalla principal llega en la próxima versión de la app."
    />
  );
}
