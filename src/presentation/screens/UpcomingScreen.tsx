import { router } from 'expo-router';
import { View } from 'react-native';

import { BrandLogo } from '@/presentation/components/BrandLogo';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';

interface UpcomingScreenProps {
  title: string;
  description: string;
  showBack?: boolean;
}

/**
 * Pantalla provisoria para rutas que ya existen en la navegacion pero cuyo
 * ticket todavia no se implemento (login, verificacion de correo).
 */
export function UpcomingScreen({ title, description, showBack = false }: UpcomingScreenProps) {
  return (
    <Screen contentClassName="justify-center gap-8">
      <View className="items-center gap-4">
        <BrandLogo size="md" />
        <Typography variant="h2" className="text-center">
          {title}
        </Typography>
        <Typography tone="secondary" className="text-center">
          {description}
        </Typography>
      </View>
      {showBack && router.canGoBack() ? <VIPButton title="Volver" onPress={() => router.back()} /> : null}
    </Screen>
  );
}
