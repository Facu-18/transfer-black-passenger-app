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
      }}
    />
  );
}
