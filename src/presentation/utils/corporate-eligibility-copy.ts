import type { CorporateMembership } from '@/infrastructure/interfaces/corporate';

const REASON_MESSAGES: Record<NonNullable<CorporateMembership['ineligibilityReason']>, string> = {
  COMPANY_SUSPENDED: 'Tu empresa está suspendida por falta de pago.',
  // Ya no lo manda el backend prepago; se mantiene por si responde uno viejo.
  CORPORATE_LIMIT_REQUIRED: 'Tu empresa todavía no tiene un límite mensual configurado.',
  CORPORATE_INSUFFICIENT_BALANCE: 'Tu empresa no tiene saldo. Pedile a tu empresa que cargue saldo.',
};

/** Por que el pasajero no puede pagar con la cuenta corporativa ahora mismo. Lo usan Home y Cotización. */
export function getCorporateIneligibilityMessage(membership: CorporateMembership): string {
  return (
    (membership.ineligibilityReason ? REASON_MESSAGES[membership.ineligibilityReason] : null) ??
    'Tu empresa no está habilitada para viajes a cuenta por ahora.'
  );
}

/**
 * Saldo de la empresa y, si hay un tope individual o de centro de costo
 * vigente, el remanente del mes: lo que se ve debajo de la pastilla
 * "Corporativo" cuando esta elegida. `null` sin nada para mostrar.
 */
export function getCorporateRemainingMessage(membership: CorporateMembership): string | null {
  const parts: string[] = [];

  if (membership.companyBalance) {
    parts.push(`Saldo de tu empresa: ${membership.companyBalance.formatted}`);
  }

  if (membership.lowestRemaining) {
    parts.push(`Te quedan ${membership.lowestRemaining.formattedAmount} este mes`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Si la tarifa elegida supera el saldo disponible de la empresa: a este viaje
 * en particular no se lo puede pagar asi, aunque `canRideOnAccount` sea `true`
 * (el saldo alcanzaba cuando se consulto `membership/me`, pero no para esta
 * tarifa). Sin saldo informado (backend viejo) no se bloquea por este motivo.
 */
export function exceedsCompanyBalance(membership: CorporateMembership, fareTotalAmount: string): boolean {
  return membership.companyBalance !== null && Number(fareTotalAmount) > Number(membership.companyBalance.available);
}
