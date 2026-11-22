import type { PaymentMethod } from '@/infrastructure/interfaces/trips';

/**
 * Opcion que elige el pasajero en la cotizacion. "Tarjeta" y "Mercado Pago"
 * son dos opciones de la pantalla pero el mismo medio para el backend
 * (`account_money`): las dos abren el checkout de Mercado Pago, que admite
 * tarjetas de credito o debito y dinero en cuenta.
 */
export type PaymentOption = 'cash' | 'card' | 'mercado_pago' | 'corporate';

const PAYMENT_METHOD_BY_OPTION: Record<PaymentOption, PaymentMethod> = {
  cash: 'cash',
  card: 'account_money',
  mercado_pago: 'account_money',
  corporate: 'corporate',
};

export function toPaymentMethod(option: PaymentOption): PaymentMethod {
  return PAYMENT_METHOD_BY_OPTION[option];
}

/** Opcion con la que arranca la cotizacion segun el medio preferido (p. ej. "Viaje corporativo" del Home). */
export function toPaymentOption(method: PaymentMethod | null): PaymentOption {
  if (method === 'corporate') return 'corporate';
  if (method === 'cash') return 'cash';
  return 'mercado_pago';
}
