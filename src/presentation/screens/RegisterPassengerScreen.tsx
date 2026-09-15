import { router } from 'expo-router';
import { Check, Lock, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { BrandLogo } from '@/presentation/components/BrandLogo';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useRegisterPassengerForm } from '@/presentation/hooks/useRegisterPassengerForm';
import { colors } from '@/presentation/theme/colors';

export function RegisterPassengerScreen() {
  const { form, submit } = useRegisterPassengerForm();
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Screen scrollable contentClassName="gap-8">
      <View className="items-center gap-4">
        <View className="flex-row items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-gold" />
          <Typography variant="caption" weight="semibold" tone="accent" className="uppercase tracking-widest">
            Membresía exclusiva
          </Typography>
        </View>

        <BrandLogo size="md" />

        <View className="items-center gap-2">
          <Typography variant="h2">Crear Cuenta</Typography>
          <View className="flex-row items-center gap-3">
            <View className="h-px w-6 bg-charcoal" />
            <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-wider">
              Membresía y traslados privados VIP
            </Typography>
            <View className="h-px w-6 bg-charcoal" />
          </View>
        </View>
      </View>

      <View className="w-full gap-4 rounded-3xl border border-charcoal bg-surface/90 p-6">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Nombre y apellido"
              icon={UserRound}
              placeholder="ej. Alejandro Morales"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
              editable={!isSubmitting}
            />
          )}
        />

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
              textContentType="emailAddress"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Teléfono móvil"
              icon={Phone}
              placeholder="+54 9 351 555 0199"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <VIPTextInput
              label="Contraseña de seguridad"
              icon={Lock}
              placeholder="Mínimo 8 caracteres"
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
              error={errors.password?.message}
              editable={!isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
                disabled={isSubmitting}
                onPress={() => onChange(!value)}
                className="flex-row items-start gap-3"
              >
                <View
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
                    value ? 'border-gold bg-gold' : errors.acceptedTerms ? 'border-danger' : 'border-ash'
                  }`}
                >
                  {value ? <Check size={14} color={colors.obsidian} strokeWidth={3} /> : null}
                </View>
                <Typography variant="caption" tone="secondary" className="flex-1 leading-5">
                  Acepto los{' '}
                  <Typography variant="caption" weight="semibold" tone="accent" className="underline">
                    Términos de Servicio
                  </Typography>{' '}
                  y la{' '}
                  <Typography variant="caption" weight="semibold" tone="accent" className="underline">
                    Política de Privacidad
                  </Typography>{' '}
                  de Transfer Black
                </Typography>
              </Pressable>
              {errors.acceptedTerms?.message ? (
                <Typography variant="caption" tone="danger">
                  {errors.acceptedTerms.message}
                </Typography>
              ) : null}
            </View>
          )}
        />

        {errors.root?.server?.message ? (
          <Typography variant="body" tone="danger" accessibilityLiveRegion="polite" className="text-center">
            {errors.root.server.message}
          </Typography>
        ) : null}

        <VIPButton title="Registrarme e Iniciar" loading={isSubmitting} onPress={() => void submit()} className="mt-2" />
      </View>

      <View className="gap-6">
        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Typography tone="secondary">¿Ya tienes una membresía activa?</Typography>
          {/* replace y no push: ir y volver entre login y registro no debe apilar pantallas. */}
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/login')}>
            <Typography weight="semibold" tone="accent">
              Iniciar sesión
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
