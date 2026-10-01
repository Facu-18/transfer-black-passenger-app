export type CorporateMembershipRole = 'employee' | 'manager';
export type CorporateMembershipStatus = 'active' | 'revoked';

/**
 * Motivo por el que el pasajero no puede pagar con la cuenta corporativa ahora mismo.
 *
 * `CORPORATE_LIMIT_REQUIRED` ya no lo manda el backend prepago (el saldo de la
 * empresa reemplazo al limite mensual obligatorio): se mantiene en el tipo
 * solo para un backend viejo que todavia lo emita.
 */
export type CorporateIneligibilityReason =
  | 'COMPANY_SUSPENDED'
  | 'CORPORATE_LIMIT_REQUIRED'
  | 'CORPORATE_INSUFFICIENT_BALANCE';

/** `limit`/`remaining` en `null`: este alcance no tiene tope mensual configurado. */
export interface CorporateConsumptionScope {
  limit: string | null;
  committed: string;
  remaining: string | null;
}

/** Consumo del mes contra cada tope vigente; `null` en el alcance que no tiene tope configurado. */
export interface CorporateConsumption {
  employee: CorporateConsumptionScope | null;
  costCenter: CorporateConsumptionScope | null;
  company: CorporateConsumptionScope | null;
}

/**
 * Menor remanente entre los topes individual y de centro de costo, listo para
 * mostrar (p. ej. "Te quedan $12.000"). El tope de empresa ya no entra aca: en
 * el modelo prepago es opcional y lo que realmente habilita el viaje es
 * `companyBalance`.
 */
export interface CorporateRemainingSummary {
  scope: 'employee' | 'costCenter';
  formattedAmount: string;
}

/** Saldo prepago disponible de la empresa; puede ser negativo (se recupera en la proxima carga). */
export interface CorporateCompanyBalance {
  available: string;
  formatted: string;
  currency: string;
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
  /** `null` con un backend que todavia no lo manda. */
  companyBalance: CorporateCompanyBalance | null;
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
  // Ausente en un backend previo al saldo prepago.
  company_balance?: {
    available: string;
    currency: string;
  };
}
