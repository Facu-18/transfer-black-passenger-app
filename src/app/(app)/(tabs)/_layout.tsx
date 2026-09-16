import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/presentation/components/FloatingTabBar';
import { colors } from '@/presentation/theme/colors';

/** Pestañas de la zona privada con la barra flotante del diseño. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.obsidian },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="activity" options={{ title: 'Actividad' }} />
      <Tabs.Screen name="account" options={{ title: 'Cuenta' }} />
    </Tabs>
  );
}
