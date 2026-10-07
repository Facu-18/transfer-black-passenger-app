import { TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/presentation/theme/colors';

import { SecondaryButton } from './SecondaryButton';
import { Typography } from './Typography';
import { VIPButton } from './VIPButton';

interface RouteErrorFallbackProps {
  /** Reintenta la misma pantalla, re-montando el componente que tiro el error. */
  onRetry: () => void;
  /** Vuelve a un lugar seguro de la app en vez de insistir con la pantalla rota. */
  onGoHome: () => void;
}

/**
 * Pantalla de respaldo para un `ErrorBoundary` de ruta (ver `src/app/_layout.tsx`
 * y `src/app/(app)/trip/[tripId].tsx`). Sin esto, un error de render en una
 * pantalla tira abajo toda la app en un build de release.
 */
export function RouteErrorFallback({ onRetry, onGoHome }: RouteErrorFallbackProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center gap-4 bg-obsidian px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <TriangleAlert size={40} color={colors.danger} />
      <Typography variant="h3" className="text-center">
        Algo salió mal mostrando tu viaje
      </Typography>
      <Typography tone="secondary" className="text-center">
        Probá de nuevo. Si el problema sigue, volvé al inicio.
      </Typography>
      <View className="w-full gap-3">
        <VIPButton title="Reintentar" onPress={onRetry} />
        <SecondaryButton title="Ir al inicio" onPress={onGoHome} />
      </View>
    </View>
  );
}
