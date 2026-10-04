import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { OtpInputRef } from 'react-native-otp-entry';

import { forgotPasswordAction } from '@/core/actions/forgot-password.action';
import { verifyResetPasswordAction } from '@/core/actions/verify-reset-password.action';
import { useCountdown } from '@/presentation/hooks/useCountdown';
import { usePasswordResetStore } from '@/presentation/store/usePasswordResetStore';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { describeVerificationCodeError } from '@/presentation/utils/verification-code-error';

export const RESET_CODE_LENGTH = 6;

/** Igual al cooldown de reenvio del backend (`forgot-password`). */
const RESEND_COOLDOWN_SECONDS = 45;

type Feedback = { tone: 'danger' | 'accent'; message: string } | null;

/** Paso del PIN de recuperacion de contraseña: valida el codigo y guarda el `reset_token`. */
export function useResetPasswordVerify(email: string) {
  const setResetToken = usePasswordResetStore((state) => state.setResetToken);

  const otpRef = useRef<OtpInputRef>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const countdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const onCodeChange = (text: string) => {
    setCode(text);
    // El error del codigo anterior deja de aplicar en cuanto el usuario escribe otro.
    if (feedback?.tone === 'danger' && text.length > 0) {
      setFeedback(null);
    }
  };

  const verify = async (value: string = code) => {
    if (value.length !== RESET_CODE_LENGTH || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      const resetToken = await verifyResetPasswordAction(email, value);
      setResetToken(resetToken);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/reset-password');
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({
        tone: 'danger',
        message: describeVerificationCodeError(error, 'No pudimos validar el código. Intentá de nuevo.'),
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
      // Siempre 202: si estaba en cooldown en el backend, no manda nada nuevo
      // pero tampoco hay forma de distinguirlo desde la app.
      await forgotPasswordAction(email);
      countdown.restart();
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();
      setFeedback({ tone: 'accent', message: `Te enviamos un código nuevo a ${email}.` });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: getApiErrorMessage(error, 'No pudimos reenviar el código. Intentá de nuevo.'),
      });
    } finally {
      setIsResending(false);
    }
  };

  return {
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
