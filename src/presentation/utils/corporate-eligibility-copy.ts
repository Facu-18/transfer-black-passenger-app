import type { CorporateMembership } from '@/infrastructure/interfaces/corporate';

const REASON_MESSAGES: Record<NonNullable<CorporateMembership['ineligibilityReason']>, string> = {
  COMPANY_SUSPENDED: 'Tu empresa está suspendida por falta de pago.',
  CORPORATE_LIMIT_REQUIRED: 'Tu empresa todavía no tiene un límite mensual configurado.',
};

/** Por que el pasajero no puede pagar con la cuenta corporativa ahora mismo. Lo usan Home y Cotización. */
export function getCorporateIneligibilityMessage(membership: CorporateMembership): string {
  return (
    (membership.ineligibilityReason ? REASON_MESSAGES[membership.ineligibilityReason] : null) ??
    'Tu empresa no está habilitada para viajes a cuenta por ahora.'
  );
}
