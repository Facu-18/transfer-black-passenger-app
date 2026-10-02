import { CreditCard } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import type { PaymentMethod } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

/** Pastilla "Corporativo": solo se ofrece con un vinculo empresarial vigente. */
export interface CorporatePaymentOption {
  label: string;
  enabled: boolean;
  /** Por que no se puede pagar asi ahora mismo; se muestra al tocar la pastilla deshabilitada. */
  disabledReason?: string;
  /** "Te quedan $X este mes"; se muestra debajo cuando esta elegida y habilitada. */
  remainingMessage?: string | null;
}

interface PaymentMethodPillsProps {
  value: PaymentMethod;
  disabled?: boolean;
  /** `null` sin vinculo empresarial: la pastilla ni se muestra. */
  corporateOption?: CorporatePaymentOption | null;
  onChange: (method: PaymentMethod) => void;
}

const BASE_METHODS: { value: PaymentMethod; label: string }[] = [
  // `account_money` abre el checkout de Mercado Pago, que admite dinero en
  // cuenta y tarjetas de credito o debito.
  { value: 'account_money', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo' },
];

/**
 * Metodo de pago: segmentado de ancho completo con opciones de igual ancho,
 * para que entren todas sin scroll horizontal (antes se cortaban en una fila
 * deslizable).
 */
export function PaymentMethodPills({
  value,
  disabled = false,
  corporateOption = null,
  onChange,
}: PaymentMethodPillsProps) {
  const methods = corporateOption
    ? [...BASE_METHODS, { value: 'corporate' as const, label: corporateOption.label }]
    : BASE_METHODS;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <CreditCard size={18} color={colors.ash} />
        <Typography tone="secondary">Método de pago</Typography>
      </View>

      <View className="flex-row gap-2">
        {methods.map((method) => {
          const selected = method.value === value;
          const corporateBlocked = method.value === 'corporate' && corporateOption ? !corporateOption.enabled : false;

          return (
            <Pressable
              key={method.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: disabled || corporateBlocked }}
              disabled={disabled}
              onPress={() => {
                if (corporateBlocked) {
                  Alert.alert(
                    'Cuenta corporativa no disponible',
                    corporateOption?.disabledReason ?? 'No podés pagar así por ahora.',
                    [{ text: 'Entendido' }],
                  );
                  return;
                }
                onChange(method.value);
              }}
              className={`flex-1 items-center rounded-full px-2 py-2.5 active:opacity-80 ${
                selected ? 'border border-gold/50 bg-gold/20' : 'border border-charcoal'
              } ${corporateBlocked ? 'opacity-50' : ''}`}
            >
              <Typography
                variant="caption"
                weight="semibold"
                tone={selected ? 'accent' : 'secondary'}
                numberOfLines={1}
                className="text-center"
              >
                {method.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {value === 'corporate' && corporateOption?.enabled && corporateOption.remainingMessage ? (
        <Typography variant="caption" tone="secondary" className="text-right">
          {corporateOption.remainingMessage}
        </Typography>
      ) : null}
    </View>
  );
}
