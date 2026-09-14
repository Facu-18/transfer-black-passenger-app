/**
 * URL base del backend de Transfer Black.
 *
 * Expo solo expone al bundle las variables con prefijo `EXPO_PUBLIC_` y las
 * escribe en el codigo compilado: cualquiera que descargue la app puede leerlas,
 * asi que nunca deben contener tokens ni secretos.
 */
export function getApiUrl(): string {
  // Acceso literal: Expo reemplaza `process.env.EXPO_PUBLIC_*` en build y no
  // resuelve lecturas dinamicas como `process.env[nombre]`.
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error('Falta EXPO_PUBLIC_API_URL: copiá .env.example como .env y completala');
  }

  return url;
}
