import * as SecureStore from 'expo-secure-store';

const PUSH_DEVICE_ID_KEY = 'transferblack.push_device_id';

export const pushDeviceStorage = {
  save(deviceId: string): Promise<void> {
    return SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, deviceId);
  },

  get(): Promise<string | null> {
    return SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);
  },

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(PUSH_DEVICE_ID_KEY);
  },
};
