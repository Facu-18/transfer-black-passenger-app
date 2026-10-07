import { router } from 'expo-router';
import { ArrowRight, Building2, UserRound } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BrandLogo } from '@/presentation/components/BrandLogo';
import { ProfileOptionCard } from '@/presentation/components/ProfileOptionCard';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { contactWhatsAppCompanyRegistration } from '@/presentation/utils/whatsapp-services';

// El alta de empresas la hace un administrador (POST /corporate/companies, rol admin):
// no hay endpoint publico de auto-registro, asi que la opcion abre el WhatsApp de la agencia.

export function ProfileSelectionScreen() {
  const goToRegister = () => router.push('/register');

  return (
    <Screen contentClassName="justify-between">
      <View className="flex-1 justify-center gap-10">
        <View className="items-center gap-4">
          <BrandLogo />
          <View className="items-center gap-2">
            <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
              Transfer Black
            </Typography>
            <Typography variant="h2">Elige tu perfil</Typography>
          </View>
        </View>

        <View className="gap-3">
          <ProfileOptionCard
            icon={UserRound}
            title="Soy Pasajero"
            description="Traslados ejecutivos y privados"
            selected
            onPress={goToRegister}
          />
          <ProfileOptionCard
            icon={Building2}
            title="¿Querés registrar tu empresa?"
            description="Comunicate con nosotros por WhatsApp"
            onPress={contactWhatsAppCompanyRegistration}
          />
        </View>

        <VIPButton title="Ingresar como pasajero" uppercase trailingIcon={ArrowRight} onPress={goToRegister} />
      </View>

      <View className="flex-row items-center justify-center gap-1 pt-6">
        <Typography tone="secondary">¿Ya tienes una cuenta?</Typography>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/login')}>
          <Typography weight="semibold" tone="accent" className="underline">
            Iniciar Sesión
          </Typography>
        </Pressable>
      </View>
    </Screen>
  );
}
