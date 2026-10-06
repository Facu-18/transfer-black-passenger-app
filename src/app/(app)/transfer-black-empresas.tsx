import { BriefcaseBusiness, ChevronLeft, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CorporateMembershipSection } from '@/presentation/components/CorporateMembershipSection';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useCorporateMembership } from '@/presentation/hooks/useCorporateMembership';
import { colors } from '@/presentation/theme/colors';
import { contactWhatsAppCompanyRegistration } from '@/presentation/utils/whatsapp-services';

function Instruction({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-gold">
        <Typography variant="caption" weight="bold" tone="inverse">{number}</Typography>
      </View>
      <Typography className="flex-1 leading-6">{children}</Typography>
    </View>
  );
}

export default function TransferBlackEmpresasRoute() {
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const corporateMembership = useCorporateMembership();

  return (
    <>
      <Screen scrollable contentClassName="gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft size={26} color={colors.platinum} />
          </Pressable>
          <View className="flex-1">
            <Typography variant="h3">Transfer Black Empresas</Typography>
            <Typography variant="caption" tone="secondary">Beneficios corporativos</Typography>
          </View>
        </View>

        <View
          className="overflow-hidden border-y border-charcoal bg-black"
          style={{ width: screenWidth, height: screenWidth * (924 / 2000), marginLeft: -24 }}
        >
          <Image
            source={require('../../../assets/transfer-black-empresas.jpg')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            accessibilityLabel="Pasajero ejecutivo abordando un vehículo Transfer Black"
          />
        </View>

        <View className="gap-3">
          <View className="self-start rounded-full bg-gold/10 px-3 py-1">
            <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
              Beneficio empresa
            </Typography>
          </View>
          <Typography variant="h2">¡Descubrí la experiencia exclusiva de Transfer Black Empresas!</Typography>
        </View>

        <View className="gap-5 rounded-3xl border border-charcoal bg-surface/90 p-5">
          <Typography variant="bodyLarge" weight="bold">Si ya contás con este beneficio en tu empresa:</Typography>
          <Instruction number="1">
            Pedí en tu trabajo tu PIN de identificación. Ingresalo una sola vez y quedará guardado en tu perfil empresa.
          </Instruction>
          <Instruction number="2">
            Solicitá o agendá tu viaje. Seleccioná el “modo empresa” en el medio de pago antes de confirmar.
          </Instruction>
        </View>

        <View className="gap-3">
          <VIPButton
            title={corporateMembership.membership ? 'Ver empresa vinculada' : 'Activar'}
            trailingIcon={BriefcaseBusiness}
            onPress={() => setIsActivationOpen(true)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar una empresa en Transfer Black"
            onPress={contactWhatsAppCompanyRegistration}
            className="min-h-14 items-center justify-center rounded-full border border-gold px-5 py-3 active:bg-gold/10"
          >
            <Typography weight="semibold" tone="accent" className="text-center">
              ¿Sos una empresa? Registrá tu empresa en Transfer Black
            </Typography>
          </Pressable>
        </View>

        <View className="h-4" />
      </Screen>

      <Modal
        visible={isActivationOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActivationOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/70"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView edges={['bottom']} className="max-h-[88%] rounded-t-[32px] border-t border-charcoal bg-obsidian">
            <View className="flex-row items-center justify-between border-b border-charcoal px-6 py-5">
              <View className="flex-1 gap-1">
                <Typography variant="h3">Activar perfil empresa</Typography>
                <Typography variant="caption" tone="secondary">Ingresá el PIN que te entregaron en tu trabajo.</Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={10}
                onPress={() => setIsActivationOpen(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <X size={20} color={colors.platinum} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerClassName="p-5">
              <CorporateMembershipSection
                membership={corporateMembership.membership}
                joinCode={corporateMembership.joinCode}
                validationError={corporateMembership.validationError}
                loadError={corporateMembership.loadError}
                joinError={corporateMembership.joinError}
                isLoading={corporateMembership.isLoading}
                isJoining={corporateMembership.isJoining}
                onJoinCodeChange={corporateMembership.setJoinCode}
                onJoin={() => void corporateMembership.join()}
                onRetry={() => void corporateMembership.retry()}
              />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
