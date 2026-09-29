import type {
  CorporateConsumption,
  CorporateConsumptionScope,
  CorporateMembership,
  CorporateMembershipResponse,
  CorporateRemainingSummary,
} from '@/infrastructure/interfaces/corporate';
import { formatAmount } from '@/infrastructure/mappers/trip-quote.mapper';

// El backend no informa moneda para los topes corporativos; la app opera solo en Argentina.
const CORPORATE_CURRENCY = 'ARS';

/** Menor remanente entre empleado, centro de costo y empresa: el que primero frena el viaje. */
function toLowestRemaining(consumption: CorporateConsumption): CorporateRemainingSummary | null {
  const scopes: { scope: CorporateRemainingSummary['scope']; value: CorporateConsumptionScope | null }[] = [
    { scope: 'employee', value: consumption.employee },
    { scope: 'costCenter', value: consumption.costCenter },
    { scope: 'company', value: consumption.company },
  ];

  let lowest: { scope: CorporateRemainingSummary['scope']; remaining: number; remainingText: string } | null = null;

  for (const { scope, value } of scopes) {
    if (!value) continue;

    const remaining = Number(value.remaining);
    if (!Number.isFinite(remaining)) continue;

    if (!lowest || remaining < lowest.remaining) {
      lowest = { scope, remaining, remainingText: value.remaining };
    }
  }

  return lowest ? { scope: lowest.scope, formattedAmount: formatAmount(lowest.remainingText, CORPORATE_CURRENCY) } : null;
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
    };
  },
};
