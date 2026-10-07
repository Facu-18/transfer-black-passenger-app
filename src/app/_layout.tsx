import '../../global.css';

// Import por peso y no desde el indice del paquete: el indice arrastra al
// bundle los 18 archivos de Montserrat (~6 MB) aunque se usen cuatro.
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { captureRenderError, initSentry, wrapWithSentry } from '@/core/monitoring/sentry';
import { RouteErrorFallback } from '@/presentation/components/RouteErrorFallback';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useSessionRestore } from '@/presentation/hooks/useSessionRestore';
import { colors } from '@/presentation/theme/colors';

// En scope global: dentro del componente llegaria tarde y el splash ya se habria ocultado.
void SplashScreen.preventAutoHideAsync();

// Tambien en scope global, antes de cualquier render: sin DSN (o en
// desarrollo sin pedirlo a mano) queda desactivado y estas llamadas no hacen nada.
initSentry();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayout() {
  // Las claves son los nombres de familia que usa `fontFamily` en tailwind.config.js.
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const { status: restoreStatus, retry: retryRestore } = useSessionRestore();

  // Si las fuentes fallan la app sigue con la tipografia del sistema en vez de quedar en el splash.
  const fontsReady = fontsLoaded || fontError !== null;
  const ready = fontsReady && restoreStatus !== 'restoring';

  useEffect(() => {
    if (ready) {
      SplashScreen.hide();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  // Hay una sesion para renovar pero no hubo red: no se cierra la sesion, se
  // ofrece reintentar en vez de entrar sin saber si sigue siendo valida.
  if (restoreStatus === 'retry') {
    return (
      <>
        <View className="flex-1 items-center justify-center gap-4 bg-obsidian px-8">
          <Typography variant="h3" className="text-center">
            No pudimos restaurar tu sesión
          </Typography>
          <Typography tone="secondary" className="text-center">
            Revisá tu conexión e intentá de nuevo.
          </Typography>
          <VIPButton title="Reintentar" onPress={() => void retryRestore()} />
        </View>
        <StatusBar style="light" />
      </>
    );
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

// Captura errores de render que se escapan del arbol de React y suma
// contexto de navegacion a cada reporte.
export default wrapWithSentry(RootLayout);

/**
 * Red final: si una pantalla no tiene su propio `ErrorBoundary` (ver
 * `src/app/(app)/trip/[tripId].tsx`), un error de render que llegue hasta
 * acá sin esto tira abajo toda la app en un build de release.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Error de render en la raiz de la app:', error);
    captureRenderError(error);
  }, [error]);

  return <RouteErrorFallback onRetry={() => void retry()} onGoHome={() => router.replace('/home')} />;
}
