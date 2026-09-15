import { Redirect, router } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { OtpCodeInput } from '@/presentation/components/OtpCodeInput';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VERIFICATION_CODE_LENGTH, useVerifyEmail } from '@/presentation/hooks/useVerifyEmail';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { colors } from '@/presentation/theme/colors';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function VerifyEmailScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    email,
    otpRef,
    code,
    onCodeChange,
    verify,
    isVerifying,
    resend,
    isResending,
    resendSecondsLeft,
    canResend,
    feedback,
  } = useVerifyEmail();

  // El endpoint exige sesion: sin ella (app recargada, enlace directo) no hay nada que validar.
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

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
          <ShieldCheck size={44} color={colors.gold} strokeWidth={1.75} />
        </View>

        <View className="items-center gap-3">
          <Typography variant="h2" className="text-center">
            Verifica tu identidad
          </Typography>
          <Typography tone="secondary" className="text-center leading-6">
            Ingresa el código de 6 dígitos que enviamos a{' '}
            {email ? (
              <Typography weight="semibold" tone="accent">
                {email}
              </Typography>
            ) : (
              'tu correo'
            )}
            .
          </Typography>
        </View>
      </View>

      <View className="gap-4">
        <OtpCodeInput
          ref={otpRef}
          length={VERIFICATION_CODE_LENGTH}
          onTextChange={onCodeChange}
          onFilled={(value) => void verify(value)}
          // Sin `disabled` durante la validacion: un input deshabilitado ignora el
          // focus() que devuelve el teclado despues de un codigo incorrecto.
          hasError={feedback?.tone === 'danger'}
        />

        {feedback ? (
          <Typography tone={feedback.tone} accessibilityLiveRegion="polite" className="text-center">
            {feedback.message}
          </Typography>
        ) : null}
      </View>

      <View className="gap-6">
        <VIPButton
          title="Validar Identidad"
          loading={isVerifying}
          disabled={code.length !== VERIFICATION_CODE_LENGTH}
          onPress={() => void verify()}
        />

        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Typography tone="secondary">¿No recibiste el código?</Typography>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canResend, busy: isResending }}
            disabled={!canResend}
            hitSlop={8}
            onPress={() => void resend()}
          >
            <Typography weight="semibold" tone={canResend ? 'accent' : 'secondary'}>
              {isResending
                ? 'Enviando…'
                : resendSecondsLeft > 0
                  ? `Reenviar en ${formatCountdown(resendSecondsLeft)}`
                  : 'Reenviar código'}
            </Typography>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
