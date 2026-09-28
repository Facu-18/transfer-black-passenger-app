export type CorporateMembershipRole = 'employee' | 'manager';
export type CorporateMembershipStatus = 'active' | 'revoked';

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
}
