import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { CorporateMembership, CorporateMembershipResponse } from '@/infrastructure/interfaces/corporate';
import { CorporateMembershipMapper } from '@/infrastructure/mappers/corporate-membership.mapper';

/** Current authenticated passenger membership, or `null` when they are not linked. */
export async function getCorporateMembershipAction(): Promise<CorporateMembership | null> {
  const { data } = await transferBlackApi.get<ApiDataResponse<CorporateMembershipResponse | null>>(
    '/corporate/membership/me',
  );

  return data.data ? CorporateMembershipMapper.toCorporateMembership(data.data) : null;
}
