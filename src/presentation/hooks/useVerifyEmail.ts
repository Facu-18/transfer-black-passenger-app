import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { OtpInputRef } from 'react-native-otp-entry';

import { resendVerificationAction } from '@/core/actions/resend-verification.action';
import { verifyEmailAction } from '@/core/actions/verify-email.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { VerificationErrorDetails } from '@/infrastructure/interfaces/auth-api';
import { useCountdown } from '@/presentation/hooks/useCountdown';
import { useAuthStore } from '@/presentation/store/useAuthStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';

export const VERIFICATION_CODE_LENGTH = 6;

/** Igual al cooldown del backend (`EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS`). */
const RESEND_COOLDOWN_SECONDS = 45;

type Feedback = { tone: 'danger' | 'accent'; message: string } | null;

function readDetail(error: ApiRequestError, key: keyof VerificationErrorDetails): number | null {
  const details = error.details;
  if (typeof details !== 'object' || details === null || !(key in details)) {
    return null;
  }
  const value = (details as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : null;
}

function describeVerifyError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case 'VERIFICATION_CODE_INVALID': {
        const remaining = readDetail(error, 'attempts_remaining');
        return remaining === null
          ? 'El código no es correcto.'
          : `El código no es correcto. Te ${remaining === 1 ? 'queda 1 intento' : `quedan ${remaining} intentos`}.`;
      }
      case 'VERIFICATION_CODE_LOCKED':
        return 'Superaste los intentos permitidos. Pide un código nuevo.';
      case 'VERIFICATION_CODE_EXPIRED':
        return 'El código venció. Pide uno nuevo.';
    }
  }

  return getApiErrorMessage(error, 'No pudimos validar el código. Intenta de nuevo.');
}

export function useVerifyEmail() {
  const email = useAuthStore((state) => state.user?.email ?? null);
  const markEmailVerified = useAuthStore((state) => state.markEmailVerified);
  const clearSession = useAuthStore((state) => state.clearSession);

  const otpRef = useRef<OtpInputRef>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const countdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const goHome = () => {
    markEmailVerified();
    router.replace('/(app)/home');
  };

  // El access token dura 15 minutos y todavia no se renueva solo: si el usuario
  // tardo en abrir el correo, vuelve a iniciar sesion (y el login lo trae de nuevo aca).
  const handleExpiredSession = () => {
    Alert.alert('Tu sesión expiró', 'Inicia sesión de nuevo para validar tu código.', [
      {
        text: 'Iniciar sesión',
        onPress: () => {
          void clearSession();
          router.replace('/login');
        },
      },
    ]);
  };

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
      setFeedback({ tone: 'danger', message: describeVerifyError(error) });
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
          countdown.restart(readDetail(error, 'retry_in_seconds') ?? RESEND_COOLDOWN_SECONDS);
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
