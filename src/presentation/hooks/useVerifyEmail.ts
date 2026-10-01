import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { OtpInputRef } from 'react-native-otp-entry';

import { resendVerificationAction } from '@/core/actions/resend-verification.action';
import { verifyEmailAction } from '@/core/actions/verify-email.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import { useCountdown } from '@/presentation/hooks/useCountdown';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession as showExpiredSession } from '@/presentation/utils/expired-session';
import { describeVerificationCodeError, readVerificationCodeDetail } from '@/presentation/utils/verification-code-error';

export const VERIFICATION_CODE_LENGTH = 6;

/** Igual al cooldown del backend (`EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS`). */
const RESEND_COOLDOWN_SECONDS = 45;

type Feedback = { tone: 'danger' | 'accent'; message: string } | null;

export function useVerifyEmail() {
  const email = useAuthStore((state) => state.user?.email ?? null);
  const markEmailVerified = useAuthStore((state) => state.markEmailVerified);

  const otpRef = useRef<OtpInputRef>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const countdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const goHome = () => {
    markEmailVerified();
    // Ruta sin grupos: `/home` resuelve igual aunque viva dentro de `(app)/(tabs)`.
    router.replace('/home');
  };

  // Si el usuario tardo en abrir el correo, vuelve a iniciar sesion (y el login lo trae de nuevo aca).
  const handleExpiredSession = () => showExpiredSession('Inicia sesión de nuevo para validar tu código.');

  const onCodeChange = (text: string) => {
    setCode(text);
    // El error del codigo anterior deja de aplicar en cuanto el usuario escribe otro.
    if (feedback?.tone === 'danger' && text.length > 0) {
      setFeedback(null);
    }
  };

  const verify = async (value: string = code) => {
    if (value.length !== VERIFICATION_CODE_LENGTH || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      await verifyEmailAction(value);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goHome();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({
        tone: 'danger',
        message: describeVerificationCodeError(error, 'No pudimos validar el código. Intenta de nuevo.'),
      });
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resend = async () => {
    if (countdown.isRunning || isResending) {
      return;
    }

    setIsResending(true);

    try {
      await resendVerificationAction();
      countdown.restart();
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();
      setFeedback({
        tone: 'accent',
        message: email ? `Te enviamos un código nuevo a ${email}.` : 'Te enviamos un código nuevo.',
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          handleExpiredSession();
          return;
        }
        if (error.code === 'EMAIL_ALREADY_VERIFIED') {
          goHome();
          return;
        }
        if (error.code === 'VERIFICATION_RECENTLY_SENT') {
          countdown.restart(readVerificationCodeDetail(error, 'retry_in_seconds') ?? RESEND_COOLDOWN_SECONDS);
          setFeedback({ tone: 'danger', message: 'Ya te enviamos un código hace instantes. Espera para pedir otro.' });
          return;
        }
      }

      setFeedback({ tone: 'danger', message: getApiErrorMessage(error, 'No pudimos reenviar el código. Intenta de nuevo.') });
    } finally {
      setIsResending(false);
    }
  };

  return {
    email,
    otpRef,
    code,
    onCodeChange,
    verify,
    isVerifying,
    resend,
    isResending,
    resendSecondsLeft: countdown.secondsLeft,
    canResend: !countdown.isRunning && !isResending,
    feedback,
  };
}
