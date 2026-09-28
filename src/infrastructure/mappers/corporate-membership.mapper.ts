import type { CorporateMembership, CorporateMembershipResponse } from '@/infrastructure/interfaces/corporate';

export const CorporateMembershipMapper = {
  toCorporateMembership(response: CorporateMembershipResponse): CorporateMembership {
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
    };
  },
};
