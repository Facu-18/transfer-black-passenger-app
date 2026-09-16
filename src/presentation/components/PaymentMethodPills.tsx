import { CreditCard } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { PaymentMethod } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

const METHODS: { value: PaymentMethod; label: string }[] = [
  // `account_money` abre el checkout de Mercado Pago, que admite dinero en
  // cuenta y tarjetas de credito o debito.
  { value: 'account_money', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo' },
];

interface PaymentMethodPillsProps {
  value: PaymentMethod;
  disabled?: boolean;
  onChange: (method: PaymentMethod) => void;
}

/** Fila "Método de pago" con las pastillas del diseño. */
export function PaymentMethodPills({ value, disabled = false, onChange }: PaymentMethodPillsProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-2">
        <CreditCard size={18} color={colors.ash} />
        <Typography tone="secondary">Método de pago</Typography>
      </View>

      <View className="flex-row items-center gap-2">
        {METHODS.map((method) => {
          const selected = method.value === value;

          return (
            <Pressable
              key={method.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(method.value)}
              className={`rounded-full px-4 py-2 active:opacity-80 ${
                selected ? 'bg-gold/20 border border-gold/50' : 'border border-charcoal'
              }`}
            >
              <Typography variant="caption" weight="semibold" tone={selected ? 'accent' : 'secondary'}>
                {method.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
