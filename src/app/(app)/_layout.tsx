import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useCurrentUser } from '@/presentation/hooks/useCurrentUser';
import { usePushNotificationRegistration } from '@/presentation/hooks/usePushNotificationRegistration';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { colors } from '@/presentation/theme/colors';

const PROFILE_REQUIRED_ROUTES = new Set(['/search', '/guest', '/pricing']);

/**
 * Zona privada: solo con sesion y correo verificado. Sin sesion vuelve al
 * login; con el correo sin verificar, a la pantalla del PIN.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser(isAuthenticated && emailVerified);
  usePushNotificationRegistration(isAuthenticated && emailVerified);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!emailVerified) {
    return <Redirect href="/verify-email" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-obsidian">
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // El perfil incompleto no bloquea la app: solo frena las rutas que inician
  // una solicitud, y lleva al formulario que vive dentro de Mi cuenta.
  if (!user.profileComplete && PROFILE_REQUIRED_ROUTES.has(pathname)) {
    return <Redirect href="/account" />;
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
      <Stack.Screen name="guest" />
      <Stack.Screen name="pricing" />
      {/* Sin gesto de volver: mientras el viaje sigue, la pantalla no se abandona. */}
      <Stack.Screen name="trip/[tripId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      {/* Se llega con replace desde el seguimiento; salir es calificar u omitir. */}
      <Stack.Screen name="receipt/[tripId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      {/* Detalle de un viaje ya terminado, desde el historial. */}
      <Stack.Screen name="trips/[tripId]" />
    </Stack>
  );
}
