import { router } from 'expo-router';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, View } from 'react-native';

import { BrandLogo } from '@/presentation/components/BrandLogo';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useLoginForm } from '@/presentation/hooks/useLoginForm';
import { colors } from '@/presentation/theme/colors';

// El backend todavia no tiene endpoint para recuperar la contraseña.
function showPasswordRecoveryUnavailable() {
  Alert.alert(
    'Recuperar contraseña',
    'Esta opción estará disponible pronto. Si no puedes ingresar, contacta al equipo de Transfer Black.',
    [{ text: 'Entendido' }],
  );
}

export function LoginScreen() {
  const { form, submit } = useLoginForm();
  const {
    control,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form;

  // "Correo o contraseña incorrectos" deja de aplicar en cuanto el usuario corrige un campo.
  const onFieldChange = (onChange: (text: string) => void) => (text: string) => {
    if (errors.root) {
      clearErrors('root');
    }
    onChange(text);
  };

  return (
    <Screen scrollable contentClassName="justify-center gap-8">
      <View className="items-center gap-4">
        <View className="flex-row items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            Acceso de socios
          </Typography>
        </View>

        <BrandLogo size="md" />

        <View className="items-center gap-2">
          <Typography variant="h2">Iniciar Sesión</Typography>
          <View className="flex-row items-center gap-3">
            <View className="h-px w-6 bg-charcoal" />
            <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-wider">
              Bienvenido de nuevo
            </Typography>
            <View className="h-px w-6 bg-charcoal" />
          </View>
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
              returnKeyType="next"
              value={value}
              onChangeText={onFieldChange(onChange)}
              onBlur={onBlur}
              error={errors.email?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Contraseña"
              icon={Lock}
              placeholder="Tu contraseña"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              value={value}
              onChangeText={onFieldChange(onChange)}
              onBlur={onBlur}
              onSubmitEditing={() => void submit()}
              error={errors.password?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={showPasswordRecoveryUnavailable}
          className="self-end"
        >
          <Typography variant="caption" weight="semibold" tone="accent">
            ¿Olvidaste tu contraseña?
          </Typography>
        </Pressable>

        {errors.root?.server?.message ? (
          <Typography variant="body" tone="danger" accessibilityLiveRegion="polite" className="text-center">
            {errors.root.server.message}
          </Typography>
        ) : null}

        <VIPButton title="Ingresar" loading={isSubmitting} onPress={() => void submit()} className="mt-2" />
      </View>

      <View className="gap-6">
        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Typography tone="secondary">¿Aún no eres miembro?</Typography>
          {/* replace y no push: ir y volver entre login y registro no debe apilar pantallas. */}
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/register')}>
            <Typography weight="semibold" tone="accent">
              Crear cuenta
            </Typography>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center gap-2 border-t border-charcoal pt-4">
          <ShieldCheck size={14} color={colors.gold} />
          <Typography variant="caption" tone="secondary">
            Concierge 24/7 · Servicio Privado · Conexión cifrada
          </Typography>
        </View>
      </View>
    </Screen>
  );
}
