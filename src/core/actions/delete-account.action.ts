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

  await transferBlackApi.delete<ApiDataResponse<DeleteAccountResponse>>('/users/me', { data: body });
}
