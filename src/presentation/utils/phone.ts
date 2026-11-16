import { z } from 'zod';

// Utilidades de telefono compartidas entre formularios (registro y pasajero
// invitado). El backend siempre espera E.164 (`+`, codigo de pais, sin
// espacios).

export const E164_PHONE = /^\+[1-9]\d{7,14}$/;

/** Campo generico en E.164: acepta espacios/guiones/parentesis al escribir y los limpia. */
export const phoneE164Field = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(E164_PHONE, 'Usa el formato internacional, ej. +54 9 351 555 0199'));

/**
 * Numero de un celular argentino escrito como numero local (codigo de area +
 * numero, sin el `+54 9`), normalizado al E.164 que exige la telefonia movil:
 * `+549` + 10 digitos.
 *
 * Regla, a proposito simple: se descartan espacios, guiones y parentesis; si
 * lo que queda arranca con "0" (prefijo de larga distancia) se saca, y si
 * despues arranca con "15" (prefijo de celular) tambien. Lo que sobra tiene
 * que ser exactamente 10 digitos (codigo de area + numero); si no, no es un
 * celular argentino valido. No cubre el "15" escrito despues del codigo de
 * area (ej. "0351 15 555 0199"): ahi alcanza con escribir el numero sin el 0
 * ni el 15, como lo guarda cualquier agenda moderna.
 */
export function normalizeArgentineMobile(rawLocalNumber: string): string | null {
  let digits = rawLocalNumber.replace(/[\s()-]/g, '');

  // El "+54 9" ya esta fijo en el campo, pero un numero pegado desde la agenda
  // lo puede traer igual: se saca. Ningun codigo de area argentino empieza con
  // "54", asi que no se confunde con un numero local.
  digits = digits.replace(/^\+/, '');
  if (digits.startsWith('549')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.startsWith('15')) {
    digits = digits.slice(2);
  }

  return /^\d{10}$/.test(digits) ? `+549${digits}` : null;
}

/** Prefijo fijo que muestran los campos de celular: el usuario escribe solo el numero local. */
export const ARGENTINE_MOBILE_PREFIX = '+54 9';

/** "+549XXXXXXXXXX" -> "XXXXXXXXXX", para prellenar un campo con el prefijo fijo. */
export function toLocalArgentineNumber(phoneE164: string): string {
  return phoneE164.startsWith('+549') ? phoneE164.slice(4) : phoneE164;
}

/** Campo de celular con el "+54 9" fijo: valida el numero local y ya deja el valor en E.164. */
export const argentineMobileField = z
  .string()
  .transform((value) => normalizeArgentineMobile(value))
  .refine((value): value is string => value !== null, {
    message: 'Ingresa un celular argentino válido, ej. 351 555 0199',
  });
