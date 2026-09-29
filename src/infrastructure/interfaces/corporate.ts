export type CorporateMembershipRole = 'employee' | 'manager';
export type CorporateMembershipStatus = 'active' | 'revoked';

/** Motivo por el que el pasajero no puede pagar con la cuenta corporativa ahora mismo. */
export type CorporateIneligibilityReason = 'COMPANY_SUSPENDED' | 'CORPORATE_LIMIT_REQUIRED';

export interface CorporateConsumptionScope {
  limit: string;
  committed: string;
  remaining: string;
}

/** Consumo del mes contra cada tope vigente; `null` en el alcance que no tiene tope configurado. */
export interface CorporateConsumption {
  employee: CorporateConsumptionScope | null;
  costCenter: CorporateConsumptionScope | null;
  company: CorporateConsumptionScope | null;
}

/** Menor remanente entre los topes vigentes, listo para mostrar (p. ej. "Te quedan $12.000"). */
export interface CorporateRemainingSummary {
  scope: 'employee' | 'costCenter' | 'company';
  formattedAmount: string;
}

export interface CorporateMembership {
  id: string;
  companyId: string;
  role: CorporateMembershipRole;
  status: CorporateMembershipStatus;
  company: {
    id: string;
    legalName: string;
    tradeName: string | null;
  };
  /** Si el pasajero puede confirmar un viaje con `payment.type: 'corporate'` ahora mismo. */
  canRideOnAccount: boolean;
  /** Motivo cuando `canRideOnAccount` es `false`; `null` si puede viajar o el backend no informo uno. */
  ineligibilityReason: CorporateIneligibilityReason | null;
  consumption: CorporateConsumption;
  lowestRemaining: CorporateRemainingSummary | null;
}

/** Membership representation returned by the passenger self-service endpoints. */
export interface CorporateMembershipResponse {
  membership: {
    id: string;
    company_id: string;
    corporate_role: CorporateMembershipRole;
    status: CorporateMembershipStatus;
  };
  company: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  };
  // Ausentes en un backend que todavia no los manda (la cuenta corriente no
  // esta desplegada aun): se tratan como "sin permiso para viajar a cuenta".
  can_ride_on_account?: boolean;
  reason?: CorporateIneligibilityReason | null;
  consumption?: {
    employee: CorporateConsumptionScope | null;
    cost_center: CorporateConsumptionScope | null;
    company: CorporateConsumptionScope | null;
  };
}
