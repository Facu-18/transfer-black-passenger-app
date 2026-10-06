import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useSessionRestoreStore } from '@/presentation/store/useSessionRestoreStore';
import { colors } from '@/presentation/theme/colors';

/**
 * Rutas sin sesión: selección de perfil, registro e inicio de sesión.
 *
 * Tambien es la compuerta de vuelta: con una sesion ya restaurada al abrir la
 * app (ver `useSessionRestore`), redirige directo a la zona privada en vez de
 * mostrar la seleccion de perfil, igual de simetrico que la compuerta de
 * `(app)/_layout.tsx` en el otro sentido. El perfil incompleto no se revisa
 * aca: `(app)/_layout.tsx` ya lo frena solo en las rutas que lo necesitan, el
 * Home se puede mostrar igual.
 */
export default function PublicLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);

  // Se lee una sola vez, sin quedar suscripto a los cambios: si siguiera
  // suscripto, limpiarlo mas abajo dispararia un segundo render con
  // `resumeTripId` ya en null, y el redirect de esa misma restauracion
  // cambiaria de destino a mitad de camino (de vuelta al viaje, a Home).
  const [resumeTripId] = useState(() => useSessionRestoreStore.getState().resumeTripId);

  // Se consume una sola vez: un login manual posterior (otra cuenta, u otra
  // sesion) no tiene que reabrir un viaje de la restauracion anterior. No
  // hace falta esperar a que isAuthenticated sea true: solo existe un valor
  // para consumir cuando `useSessionRestore` ya marco la sesion como
  // restaurada, antes de que este layout llegue a montarse.
  useEffect(() => {
    if (resumeTripId) useSessionRestoreStore.getState().clear();
  }, [resumeTripId]);

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
