import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, KeyRound, Mail } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useForgotPasswordForm } from '@/presentation/hooks/useForgotPasswordForm';
import { colors } from '@/presentation/theme/colors';

export function ForgotPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { form, submit } = useForgotPasswordForm({ defaultEmail: emailParam ?? '' });
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  return (
    <Screen scrollable contentClassName="gap-8">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
      >
        <ChevronLeft size={22} color={colors.platinum} />
      </Pressable>

      <View className="items-center gap-6">
        <View className="h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <KeyRound size={44} color={colors.gold} strokeWidth={1.75} />
        </View>

        <View className="items-center gap-3">
          <Typography variant="h2" className="text-center">
            Recuperá tu contraseña
          </Typography>
          <Typography tone="secondary" className="text-center leading-6">
            Ingresá el correo de tu cuenta: te mandamos un código de 6 dígitos para definir una
            contraseña nueva.
          </Typography>
        </View>
      </View>

      <View className="w-full gap-4 rounded-3xl border border-charcoal bg-surface/90 p-6">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Correo electrónico"
              icon={Mail}
              placeholder="socio@transferblack.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
              returnKeyType="send"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onSubmitEditing={() => void submit()}
              error={errors.email?.message}
              editable={!isSubmitting}
            />
          )}
        />

        {errors.root?.server?.message ? (
          <Typography variant="body" tone="danger" accessibilityLiveRegion="polite" className="text-center">
            {errors.root.server.message}
          </Typography>
        ) : null}

        <VIPButton title="Enviar código" loading={isSubmitting} onPress={() => void submit()} className="mt-2" />
      </View>
    </Screen>
  );
}
