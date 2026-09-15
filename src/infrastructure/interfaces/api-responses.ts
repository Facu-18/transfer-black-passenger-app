/** Forma de toda respuesta exitosa del backend: el recurso viaja dentro de `data`. */
export interface ApiDataResponse<T> {
  data: T;
}

/** Forma de toda respuesta de error del backend. */
export interface ApiErrorResponse {
  error: {
    /** Codigo estable de la falla: es lo que hay que mirar, no el mensaje. */
    code: string;
    message: string;
    /** En los errores de validacion trae los `issues` de Zod con el campo que fallo. */
    details?: unknown;
    request_id: string;
  };
}
