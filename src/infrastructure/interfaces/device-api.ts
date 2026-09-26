export type DevicePlatformRequest = 'android' | 'ios';

export interface RegisterDeviceRequest {
  push_token: string;
  platform: DevicePlatformRequest;
  provider: 'expo';
}

export interface DeviceResponse {
  id: string;
  platform: DevicePlatformRequest;
  provider: 'expo' | 'fcm';
  device_id: string | null;
  last_seen_at: string;
  revoked_at: string | null;
  created_at: string;
}
