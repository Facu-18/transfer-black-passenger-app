import { transferBlackApi } from '@/core/api/transfer-black-api';

export async function revokePushDeviceAction(deviceId: string): Promise<void> {
  await transferBlackApi.delete(`/devices/${deviceId}`);
}
