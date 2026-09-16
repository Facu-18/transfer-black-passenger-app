import { router } from 'expo-router';

import { VIPButton } from '@/presentation/components/VIPButton';
import { UpcomingScreen } from '@/presentation/screens/UpcomingScreen';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useTripStore } from '@/presentation/store/useTripStore';

// Provisoria hasta el ticket de perfil; por ahora solo permite cerrar sesion.
export default function AccountRoute() {
  const email = useAuthStore((state) => state.user?.email);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const logout = async () => {
    await clearSession();
    resetTrip();
    router.replace('/');
  };

  return (
    <UpcomingScreen title="Mi cuenta" description={email ?? 'La gestión de tu perfil llega pronto.'}>
      <VIPButton title="Cerrar sesión" onPress={() => void logout()} />
    </UpcomingScreen>
  );
}
