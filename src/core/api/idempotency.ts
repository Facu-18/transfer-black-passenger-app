import * as Crypto from 'expo-crypto';

/**
 * Clave para el header `Idempotency-Key` de las operaciones que mueven plata.
 *
 * Repetir la misma clave devuelve la respuesta original en vez de cobrar dos
 * veces, asi que se genera una por intento de confirmacion y no por solicitud.
 */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}
