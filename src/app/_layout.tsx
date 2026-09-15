import '../../global.css';

// Import por peso y no desde el indice del paquete: el indice arrastra al
// bundle los 18 archivos de Montserrat (~6 MB) aunque se usen cuatro.
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/presentation/theme/colors';

// En scope global: dentro del componente llegaria tarde y el splash ya se habria ocultado.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Las claves son los nombres de familia que usa `fontFamily` en tailwind.config.js.
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Si las fuentes fallan la app sigue con la tipografia del sistema en vez de quedar en el splash.
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hide();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.obsidian },
          animation: 'fade',
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
