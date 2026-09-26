import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type {
  DeviceResponse,
  RegisterDeviceRequest,
} from '@/infrastructure/interfaces/device-api';

export async function registerPushDeviceAction(
  body: RegisterDeviceRequest,
): Promise<DeviceResponse> {
  const { data } = await transferBlackApi.post<ApiDataResponse<DeviceResponse>>('/devices', body);
  return data.data;
}
