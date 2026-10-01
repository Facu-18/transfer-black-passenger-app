import { Redirect } from 'expo-router';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useResetPasswordForm } from '@/presentation/hooks/useResetPasswordForm';
import { usePasswordResetStore } from '@/presentation/store/usePasswordResetStore';
import { colors } from '@/presentation/theme/colors';

export function ResetPasswordScreen() {
  // Solo importa al entrar: el envio exitoso limpia el token y navega, no hay
  // que redirigir de nuevo por esa misma limpieza.
  const [hasResetToken] = useState(() => usePasswordResetStore.getState().resetToken !== null);
  const { form, submit } = useResetPasswordForm();
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  // Sin token no hay nada que confirmar (enlace directo, app recargada, token vencido).
  if (!hasResetToken) {
    return <Redirect href="/forgot-password" />;
  }

  return (
    <Screen scrollable contentClassName="justify-center gap-8">
      <View className="items-center gap-6">
        <View className="h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <ShieldCheck size={44} color={colors.gold} strokeWidth={1.75} />
        </View>

        <View className="items-center gap-3">
          <Typography variant="h2" className="text-center">
            Definí tu contraseña nueva
          </Typography>
          <Typography tone="secondary" className="text-center leading-6">
            La vas a usar para iniciar sesión de nuevo en todos tus dispositivos.
          </Typography>
        </View>
      </View>

      <View className="w-full gap-4 rounded-3xl border border-charcoal bg-surface/90 p-6">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Contraseña nueva"
              icon={Lock}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Repetí la contraseña"
              icon={Lock}
              placeholder="Repetí tu contraseña nueva"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onSubmitEditing={() => void submit()}
              error={errors.confirmPassword?.message}
              editable={!isSubmitting}
            />
          )}
        />

        {errors.root?.server?.message ? (
          <Typography variant="body" tone="danger" accessibilityLiveRegion="polite" className="text-center">
            {errors.root.server.message}
          </Typography>
        ) : null}

        <VIPButton title="Guardar contraseña" loading={isSubmitting} onPress={() => void submit()} className="mt-2" />
      </View>
    </Screen>
  );
}
