import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/presentation/store/useAuthStore';
import { colors } from '@/presentation/theme/colors';

/**
 * Zona privada: solo con sesion y correo verificado. Sin sesion vuelve al
 * login; con el correo sin verificar, a la pantalla del PIN.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!emailVerified) {
    return <Redirect href="/verify-email" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.obsidian },
        // Deslizamiento lateral en ambas plataformas: la busqueda "entra" sobre el Home.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="pricing" />
      {/* Sin gesto de volver: mientras el viaje sigue, la pantalla no se abandona. */}
      <Stack.Screen name="trip/[tripId]" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}
