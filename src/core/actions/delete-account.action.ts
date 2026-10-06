import { ApiRequestError } from '@/core/api/api-request-error';
import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { DeleteAccountRequest, DeleteAccountResponse } from '@/infrastructure/interfaces/user-api';

/**
 * `DELETE /users/me`: anonimiza la cuenta del pasajero (no la borra
 * fisicamente). Los viajes y movimientos contables se conservan por
 * obligacion contable; se revocan la sesion y el dispositivo push del lado
 * del backend.
 *
 * Errores: 400 `VALIDATION_ERROR`, 401/403 `INVALID_PASSWORD`,
 * 409 `ACCOUNT_HAS_ACTIVE_TRIP`, 409 `ACCOUNT_HAS_UPCOMING_RESERVATION`.
 */
export async function deleteAccountAction(password: string): Promise<void> {
  const body: DeleteAccountRequest = { password };

  // El `Content-Type` se repite a proposito: un DELETE con cuerpo es el caso
  // menos probado de los adaptadores HTTP, y conviene no depender de que el
  // header por defecto de la instancia se arrastre para este metodo.
  const response = await transferBlackApi.delete<ApiDataResponse<DeleteAccountResponse>>('/users/me', {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });

  // Un 2xx sin el campo esperado significa que el cuerpo (o la respuesta) no
  // viajo como se esperaba: mejor fallar explicito que dar la cuenta por
  // eliminada sin estar seguros.
  if (response.data?.data?.deleted !== true) {
    throw new ApiRequestError(response.status, 'UNEXPECTED_RESPONSE', 'Respuesta inesperada al eliminar la cuenta');
  }
}
