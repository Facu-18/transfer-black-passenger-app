import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'transferblack.refresh_token';

/**
 * El refresh token vive en el almacenamiento cifrado del sistema (Keychain en
 * iOS, Keystore en Android). No se usa AsyncStorage: guarda texto plano, y este
 * token alcanza para emitir sesiones nuevas durante 30 dias.
 *
 * El access token no se persiste: dura minutos y se mantiene solo en memoria.
 */
export const refreshTokenStorage = {
  save(token: string): Promise<void> {
    return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  get(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
