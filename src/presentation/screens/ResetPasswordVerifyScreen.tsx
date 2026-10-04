import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { OtpCodeInput } from '@/presentation/components/OtpCodeInput';
import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { RESET_CODE_LENGTH, useResetPasswordVerify } from '@/presentation/hooks/useResetPasswordVerify';
import { colors } from '@/presentation/theme/colors';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ResetPasswordVerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  const {
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
  } = useResetPasswordVerify(email ?? '');

  // Sin email no hay nada para validar (enlace directo, app recargada): se vuelve a pedir.
  if (!email) {
    return <Redirect href="/forgot-password" />;
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/forgot-password'));

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
            Revisá tu correo
          </Typography>
          <Typography tone="secondary" className="text-center leading-6">
            Si{' '}
            <Typography weight="semibold" tone="accent">
              {email}
            </Typography>{' '}
            está registrado, te enviamos un código de 6 dígitos para definir tu contraseña nueva.
          </Typography>
        </View>
      </View>

      <View className="gap-4">
        <OtpCodeInput
          ref={otpRef}
          length={RESET_CODE_LENGTH}
          onTextChange={onCodeChange}
          onFilled={(value) => void verify(value)}
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
          title="Validar código"
          loading={isVerifying}
          disabled={code.length !== RESET_CODE_LENGTH}
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
