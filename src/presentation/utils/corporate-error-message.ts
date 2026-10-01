import { ApiRequestError } from '@/core/api/api-request-error';
import { formatAmount } from '@/infrastructure/mappers/trip-quote.mapper';

interface CorporateLimitExceededDetails {
  scope?: 'employee' | 'cost_center' | 'company';
  limit?: string;
  committed?: string;
  remaining?: string;
}

interface CorporateInsufficientBalanceDetails {
  available?: string;
  required?: string;
  currency?: string;
}

const SCOPE_LABELS: Record<string, string> = {
  employee: 'tu límite mensual individual',
  cost_center: 'el límite mensual de tu centro de costo',
  company: 'el límite mensual de tu empresa',
};

/** Codigos de error propios de `payment.type: 'corporate'` al confirmar un viaje. */
export const CORPORATE_ERROR_CODES = new Set([
  'CORPORATE_MEMBERSHIP_REQUIRED',
  'COMPANY_SUSPENDED',
  'CORPORATE_LIMIT_REQUIRED',
  'CORPORATE_LIMIT_EXCEEDED',
  'CORPORATE_INSUFFICIENT_BALANCE',
  'COST_CENTER_NOT_ALLOWED',
  'COST_CENTER_COMPANY_MISMATCH',
  'COST_CENTER_NOT_ACTIVE',
]);

/**
 * Mensaje para un error de la cuenta corporativa, o `null` si el codigo no es
 * uno de estos: la pantalla sigue con el mensaje generico de confirmacion.
 */
export function getCorporateErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiRequestError) || !CORPORATE_ERROR_CODES.has(error.code)) {
    return null;
  }

  switch (error.code) {
    case 'CORPORATE_MEMBERSHIP_REQUIRED':
      return 'Necesitás estar vinculado a una empresa para pagar así. Vinculate desde Mi Cuenta.';
    case 'COMPANY_SUSPENDED':
      return 'Tu empresa está suspendida por falta de pago. Elegí otro medio de pago.';
    case 'CORPORATE_LIMIT_REQUIRED':
      return 'Tu empresa todavía no configuró un límite mensual. Elegí otro medio de pago.';
    case 'CORPORATE_INSUFFICIENT_BALANCE': {
      const details = (error.details ?? {}) as CorporateInsufficientBalanceDetails;
      const available = details.available ? formatAmount(details.available, details.currency ?? 'ARS') : null;
      const availableText = available ? ` (disponible ${available})` : '';
      return `El saldo de tu empresa no alcanza para este viaje${availableText}. Elegí otro medio de pago.`;
    }
    case 'CORPORATE_LIMIT_EXCEEDED': {
      const details = (error.details ?? {}) as CorporateLimitExceededDetails;
      const scopeLabel = (details.scope && SCOPE_LABELS[details.scope]) ?? 'el límite mensual de tu cuenta corporativa';
      const remaining = details.remaining ? ` Te quedan ${formatAmount(details.remaining, 'ARS')}.` : '';
      return `Superás ${scopeLabel}.${remaining} Elegí otro medio de pago.`;
    }
    case 'COST_CENTER_NOT_ALLOWED':
      return 'Ese centro de costo no está permitido para tu perfil. Elegí otro medio de pago.';
    case 'COST_CENTER_COMPANY_MISMATCH':
      return 'Ese centro de costo no pertenece a tu empresa. Elegí otro medio de pago.';
    case 'COST_CENTER_NOT_ACTIVE':
      return 'Ese centro de costo ya no está activo. Elegí otro medio de pago.';
    default:
      return null;
  }
}
