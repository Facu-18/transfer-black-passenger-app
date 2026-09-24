import type { PaymentStatus } from '@/infrastructure/interfaces/trips';

/** Lo usan el recibo y el detalle del historial: un solo lugar para el texto de cada medio y estado. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  account_money: 'Mercado Pago',
  cash: 'Efectivo',
  voucher: 'Voucher corporativo',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};
