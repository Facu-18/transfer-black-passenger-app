/** Forma de toda respuesta exitosa del backend: el recurso viaja dentro de `data`. */
export interface ApiDataResponse<T> {
  data: T;
}

/** Un `issue` de Zod tal como lo manda el backend en `VALIDATION_ERROR`. */
export interface ApiValidationIssue {
  message: string;
  path?: Array<string | number>;
  code?: string;
}

/** Forma de toda respuesta de error del backend. */
export interface ApiErrorResponse {
  error: {
    /** Codigo estable de la falla: es lo que hay que mirar, no el mensaje. */
    code: string;
    /** En `VALIDATION_ERROR` el backend manda el array de `issues` de Zod en vez de un texto. */
    message: string | ApiValidationIssue[];
    /** En los errores de validacion trae los `issues` de Zod con el campo que fallo. */
    details?: unknown;
    request_id: string;
  };
}
