import { z } from 'zod';

// Campos compartidos por los formularios de autenticacion. Las reglas replican
// las del backend: un dato invalido se corrige en pantalla sin gastar una solicitud.

export const emailField = z
  .string()
  .trim()
  .pipe(z.email('Ingresa un correo válido').max(320, 'El correo es demasiado largo'));
