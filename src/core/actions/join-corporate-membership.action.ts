import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { CorporateMembership, CorporateMembershipResponse } from '@/infrastructure/interfaces/corporate';
import { CorporateMembershipMapper } from '@/infrastructure/mappers/corporate-membership.mapper';

/** Links the authenticated passenger using the one-time company join code. */
export async function joinCorporateMembershipAction(joinCode: string): Promise<CorporateMembership> {
  const { data } = await transferBlackApi.post<ApiDataResponse<CorporateMembershipResponse>>(
    '/corporate/membership/join',
    { join_code: joinCode },
  );

  return CorporateMembershipMapper.toCorporateMembership(data.data);
}
