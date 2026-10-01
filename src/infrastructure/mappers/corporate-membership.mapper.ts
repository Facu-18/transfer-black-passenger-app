import type {
  CorporateCompanyBalance,
  CorporateConsumption,
  CorporateConsumptionScope,
  CorporateMembership,
  CorporateMembershipResponse,
  CorporateRemainingSummary,
} from '@/infrastructure/interfaces/corporate';
import { formatAmount } from '@/infrastructure/mappers/trip-quote.mapper';

// El backend no informa moneda para los topes de empleado/centro de costo; la app opera solo en Argentina.
const CORPORATE_CURRENCY = 'ARS';

/**
 * Menor remanente entre el tope individual y el del centro de costo: el que
 * primero frena el viaje. El tope de empresa queda afuera porque en el modelo
 * prepago es opcional (puede no estar configurado) y lo que de verdad habilita
 * el viaje es el saldo de la empresa (`companyBalance`), no este remanente.
 */
function toLowestRemaining(consumption: CorporateConsumption): CorporateRemainingSummary | null {
  const scopes: { scope: CorporateRemainingSummary['scope']; value: CorporateConsumptionScope | null }[] = [
    { scope: 'employee', value: consumption.employee },
    { scope: 'costCenter', value: consumption.costCenter },
  ];

  let lowest: { scope: CorporateRemainingSummary['scope']; remaining: number; remainingText: string } | null = null;

  for (const { scope, value } of scopes) {
    // `remaining: null` es "sin tope configurado en este alcance", no "$0": no frena nada.
    if (!value || value.remaining === null) continue;

    const remaining = Number(value.remaining);
    if (!Number.isFinite(remaining)) continue;

    if (!lowest || remaining < lowest.remaining) {
      lowest = { scope, remaining, remainingText: value.remaining };
    }
  }

  return lowest ? { scope: lowest.scope, formattedAmount: formatAmount(lowest.remainingText, CORPORATE_CURRENCY) } : null;
}

function toCompanyBalance(response: CorporateMembershipResponse): CorporateCompanyBalance | null {
  if (!response.company_balance) {
    return null;
  }

  const { available, currency } = response.company_balance;
  return { available, currency, formatted: formatAmount(available, currency) };
}

export const CorporateMembershipMapper = {
  toCorporateMembership(response: CorporateMembershipResponse): CorporateMembership {
    const consumption: CorporateConsumption = {
      employee: response.consumption?.employee ?? null,
      costCenter: response.consumption?.cost_center ?? null,
      company: response.consumption?.company ?? null,
    };

    return {
      id: response.membership.id,
      companyId: response.membership.company_id,
      role: response.membership.corporate_role,
      status: response.membership.status,
      company: {
        id: response.company.id,
        legalName: response.company.legal_name,
        tradeName: response.company.trade_name,
      },
      canRideOnAccount: response.can_ride_on_account ?? false,
      ineligibilityReason: response.reason ?? null,
      consumption,
      lowestRemaining: toLowestRemaining(consumption),
      companyBalance: toCompanyBalance(response),
    };
  },
};
