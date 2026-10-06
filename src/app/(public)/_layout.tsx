import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useSessionRestoreStore } from '@/presentation/store/useSessionRestoreStore';
import { colors } from '@/presentation/theme/colors';

/**
 * Rutas sin sesión: selección de perfil, registro e inicio de sesión.
 *
 * Tambien es la compuerta de vuelta: con una sesion ya restaurada al abrir la
 * app (ver `useSessionRestore`), redirige directo a la zona privada en vez de
 * mostrar la seleccion de perfil, igual de simetrico que la compuerta de
 * `(app)/_layout.tsx` en el otro sentido.
 */
export default function PublicLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);
  const resumeTripId = useSessionRestoreStore((state) => state.resumeTripId);
  const clearResumeTripId = useSessionRestoreStore((state) => state.clear);

  // Se consume una sola vez: un login manual posterior (otra cuenta, u otra
  // sesion) no tiene que reabrir un viaje de la restauracion anterior.
  useEffect(() => {
    if (isAuthenticated && resumeTripId) clearResumeTripId();
  }, [isAuthenticated, resumeTripId, clearResumeTripId]);

  if (isAuthenticated) {
    if (!emailVerified) {
      return <Redirect href="/verify-email" />;
    }

    return (
      <Redirect href={resumeTripId ? { pathname: '/trip/[tripId]', params: { tripId: resumeTripId } } : '/home'} />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.obsidian },
        animation: 'slide_from_right',
      }}
    />
  );
}
