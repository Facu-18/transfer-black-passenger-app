import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useCurrentUser } from '@/presentation/hooks/useCurrentUser';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { colors } from '@/presentation/theme/colors';

/**
 * Zona privada: solo con sesion y correo verificado. Sin sesion vuelve al
 * login; con el correo sin verificar, a la pantalla del PIN.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);
  const pathname = usePathname();
  const { user, isLoading, hasError, retry } = useCurrentUser(isAuthenticated && emailVerified);

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

  if (hasError || !user) {
    return (
      <Screen contentClassName="justify-center gap-6">
        <Typography variant="h2" className="text-center">No pudimos consultar tu perfil</Typography>
        <Typography tone="secondary" className="text-center">
          Necesitamos validarlo antes de habilitar la solicitud de viajes.
        </Typography>
        <VIPButton title="Reintentar" onPress={retry} />
      </Screen>
    );
  }

  if (!user.profileComplete && pathname !== '/complete-profile') {
    return <Redirect href="/complete-profile" />;
  }

  if (user.profileComplete && pathname === '/complete-profile') {
    return <Redirect href="/home" />;
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
      <Stack.Screen name="complete-profile" options={{ gestureEnabled: false }} />
      {/* Sin gesto de volver: mientras el viaje sigue, la pantalla no se abandona. */}
      <Stack.Screen name="trip/[tripId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      {/* Se llega con replace desde el seguimiento; salir es calificar u omitir. */}
      <Stack.Screen name="receipt/[tripId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      {/* Detalle de un viaje ya terminado, desde el historial. */}
      <Stack.Screen name="trips/[tripId]" />
    </Stack>
  );
}
