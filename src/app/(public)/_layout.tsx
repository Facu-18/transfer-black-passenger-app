import { Stack } from 'expo-router';

import { colors } from '@/presentation/theme/colors';

/** Rutas sin sesión: selección de perfil, registro e inicio de sesión. */
export default function PublicLayout() {
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
