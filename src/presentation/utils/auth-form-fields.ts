import { z } from 'zod';

// Campos compartidos por los formularios de autenticacion. Las reglas replican
// las del backend: un dato invalido se corrige en pantalla sin gastar una solicitud.

export const emailField = z
  .string()
  .trim()
  .pipe(z.email('Ingresa un correo válido').max(320, 'El correo es demasiado largo'));

/** Igual que `emailField`, pero vacio se guarda como `null` (comprobante del invitado, opcional). */
export const optionalEmailField = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.union([z.null(), z.email('Ingresa un correo válido').max(320, 'El correo es demasiado largo')]));

/** Regla de contraseña del registro (`register-passenger.dto`), tambien valida para definir una nueva. */
export const passwordField = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[0-9]/, 'Debe incluir un número');
