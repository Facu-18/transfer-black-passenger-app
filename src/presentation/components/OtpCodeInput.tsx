import type { Ref } from 'react';
import { OtpInput, type OtpInputRef } from 'react-native-otp-entry';

import { colors } from '@/presentation/theme/colors';

interface OtpCodeInputProps {
  ref?: Ref<OtpInputRef>;
  length: number;
  onTextChange: (text: string) => void;
  onFilled: (text: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

/**
 * Cajas del PIN.
 *
 * `react-native-otp-entry` recibe estilos como objetos en `theme`, no `className`:
 * por eso los colores salen de la paleta y la fuente se nombra por familia
 * (la misma que usa la clase `font-bold`).
 */
export function OtpCodeInput({ ref, length, onTextChange, onFilled, hasError = false, disabled = false }: OtpCodeInputProps) {
  const idleBorder = hasError ? colors.danger : colors.charcoal;

  return (
    <OtpInput
      ref={ref}
      numberOfDigits={length}
      type="numeric"
      // Sin `blurOnFilled`: en Android el teclado no vuelve a abrirse con focus()
      // despues de un blur, y tras un codigo incorrecto el usuario tiene que seguir tipeando.
      autoFocus
      disabled={disabled}
      focusColor={colors.gold}
      onTextChange={onTextChange}
      onFilled={onFilled}
      // El SMS/correo con el PIN se puede autocompletar desde el teclado.
      textInputProps={{
        accessibilityLabel: 'Código de verificación de 6 dígitos',
        autoComplete: 'one-time-code',
        textContentType: 'oneTimeCode',
      }}
      theme={{
        containerStyle: { width: '100%', justifyContent: 'space-between' },
        pinCodeContainerStyle: {
          width: 48,
          height: 58,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: idleBorder,
          backgroundColor: colors.surface,
        },
        focusedPinCodeContainerStyle: { borderColor: colors.gold },
        filledPinCodeContainerStyle: { borderColor: hasError ? colors.danger : colors.charcoal },
        disabledPinCodeContainerStyle: { opacity: 0.5 },
        pinCodeTextStyle: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: colors.platinum },
        focusStickStyle: { backgroundColor: colors.gold, height: 26 },
      }}
    />
  );
}
