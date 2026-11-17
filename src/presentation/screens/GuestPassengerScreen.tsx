import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail, Phone, UserRound } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useGuestPassengerForm } from '@/presentation/hooks/useGuestPassengerForm';
import { colors } from '@/presentation/theme/colors';
import { ARGENTINE_MOBILE_PREFIX } from '@/presentation/utils/phone';

export function GuestPassengerScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { form, submit } = useGuestPassengerForm({ fromHome: from === 'home' });
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Screen scrollable contentClassName="gap-6">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>

        <View className="flex-row items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            Servicio Terceros
          </Typography>
        </View>

        <View className="h-11 w-11" />
      </View>

      <View className="gap-2">
        <Typography variant="h2">Pasajero invitado</Typography>
        <Typography tone="secondary">
          Cargá los datos de quien viaja: le llegan a la persona que va arriba del auto, vos seguís a cargo del
          pago.
        </Typography>
      </View>

      <View className="gap-4 rounded-3xl border border-charcoal bg-surface/90 p-6">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Nombre completo del pasajero"
              icon={UserRound}
              placeholder="ej. Martina Gómez"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Teléfono móvil (WhatsApp)"
              icon={Phone}
              prefix={ARGENTINE_MOBILE_PREFIX}
              placeholder="351 555 0199"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              accessibilityLabel="Teléfono móvil del invitado"
              editable={!isSubmitting}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Email para comprobante (opcional)"
              icon={Mail}
              placeholder="invitado@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              onSubmitEditing={() => void submit()}
              error={errors.email?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Typography variant="caption" tone="secondary">
          Si cargás el email, el invitado recibe ahí el link para seguir el viaje; también se lo podés mandar por
          WhatsApp vos mismo. El cobro y el control del viaje siguen siendo tuyos.
        </Typography>

        <VIPButton
          title="Confirmar pasajero y continuar"
          loading={isSubmitting}
          onPress={() => void submit()}
          className="mt-2"
        />
      </View>
    </Screen>
  );
}
