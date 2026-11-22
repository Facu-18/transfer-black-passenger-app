import { Banknote, Building2, CreditCard, Wallet, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import type { PaymentOption } from '@/presentation/utils/payment-options';

import { Typography } from './Typography';
import { appAlert } from '@/presentation/utils/app-alert';

/** Opcion "Corporativo": solo se ofrece si el pasajero puede viajar a cuenta de su empresa. */
export interface CorporatePaymentOption {
  /** Nombre de la empresa, debajo de las opciones cuando esta elegida. */
  companyName: string;
  enabled: boolean;
  /** Por que no se puede pagar asi ahora mismo; se muestra al tocar la opcion deshabilitada. */
  disabledReason?: string;
  /** "Saldo de tu empresa: $X"; se muestra debajo cuando esta elegida y habilitada. */
  remainingMessage?: string | null;
}

interface PaymentMethodPillsProps {
  value: PaymentOption;
  disabled?: boolean;
  /** `null` si no puede viajar a cuenta de una empresa: la opcion ni se muestra. */
  corporateOption?: CorporatePaymentOption | null;
  onChange: (option: PaymentOption) => void;
}

const BASE_OPTIONS: { value: PaymentOption; label: string; icon: LucideIcon }[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  // "Tarjeta" y "Mercado Pago" abren el mismo checkout de Mercado Pago, que
  // admite tarjetas de credito o debito y dinero en cuenta.
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'mercado_pago', label: 'Mercado Pago', icon: Wallet },
];

const CORPORATE_OPTION = { value: 'corporate' as const, label: 'Corporativo', icon: Building2 };

/**
 * Metodo de pago: opciones de igual ancho con el icono arriba del texto, para
 * que entren las cuatro en una fila sin scroll horizontal.
 */
export function PaymentMethodPills({ value, disabled = false, corporateOption = null, onChange }: PaymentMethodPillsProps) {
  const options = corporateOption ? [...BASE_OPTIONS, CORPORATE_OPTION] : BASE_OPTIONS;
  const corporateSelected = value === 'corporate' && corporateOption?.enabled;

  return (
    <View className="gap-2">
      <Typography tone="secondary">Método de pago</Typography>

      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          const corporateBlocked = option.value === 'corporate' && corporateOption ? !corporateOption.enabled : false;
          const Icon = option.icon;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected, disabled: disabled || corporateBlocked }}
              disabled={disabled}
              onPress={() => {
                if (corporateBlocked) {
                  appAlert(
                    'Cuenta corporativa no disponible',
                    corporateOption?.disabledReason ?? 'No podés pagar así por ahora.',
                    [{ text: 'Entendido' }],
                  );
                  return;
                }
                onChange(option.value);
              }}
              className={`h-14 flex-1 items-center justify-center gap-1 rounded-xl px-1 active:opacity-80 ${
                selected ? 'border border-gold/50 bg-gold/20' : 'border border-charcoal'
              } ${corporateBlocked ? 'opacity-50' : ''}`}
            >
              <Icon size={16} color={selected ? colors.gold : colors.ash} strokeWidth={2.2} />
              <Typography
                variant="caption"
                weight="semibold"
                tone={selected ? 'accent' : 'secondary'}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {corporateSelected ? (
        <Typography variant="caption" tone="secondary" className="text-right">
          {[corporateOption.companyName, corporateOption.remainingMessage].filter(Boolean).join(' · ')}
        </Typography>
      ) : null}
    </View>
  );
}
