import { transferBlackApi } from '@/core/api/transfer-black-api';
import type { ApiDataResponse } from '@/infrastructure/interfaces/api-responses';
import type { ConfirmedTrip, GuestPassenger, PaymentMethod } from '@/infrastructure/interfaces/trips';
import type { ConfirmTripRequest, ConfirmTripResponse } from '@/infrastructure/interfaces/trips-api';
import { TripQuoteMapper } from '@/infrastructure/mappers/trip-quote.mapper';

export interface ConfirmRideInput {
  tripId: string;
  fareQuoteId: string;
  paymentMethod: PaymentMethod;
  /** UUID v4; repetirlo devuelve la respuesta original en vez de cobrar dos veces. */
  idempotencyKey: string;
  /** Con invitado cargado, el viaje se confirma para un tercero; el titular queda como coordinador. */
  guestPassenger?: GuestPassenger | null;
}

/**
 * Fija la tarifa y el medio de pago, y deja el viaje en `searching`.
 *
 * Con `account_money` la respuesta trae `checkoutUrl`: hay que mandar al
 * pasajero a esa URL de Mercado Pago. Con `cash` no hay checkout.
 *
 * Errores que interesan a la pantalla (`ApiRequestError.code`):
 * - 409 `FARE_QUOTE_EXPIRED`: la cotizacion vencio, hay que volver a cotizar.
 * - 409 `INVALID_TRIP_TRANSITION`: el viaje ya no puede confirmarse.
 * - 403 `TRIP_FORBIDDEN` o correo sin verificar; 401 sesion vencida.
 */
export async function confirmRideAction(input: ConfirmRideInput): Promise<ConfirmedTrip> {
  const body: ConfirmTripRequest = {
    fare_quote_id: input.fareQuoteId,
    payment: { type: input.paymentMethod },
  };

  if (input.guestPassenger) {
    body.third_party = {
      name: input.guestPassenger.name,
      phone_e164: input.guestPassenger.phoneE164,
      // El backend solo manda el email de seguimiento si este campo viene: no se manda vacio.
      ...(input.guestPassenger.email ? { email: input.guestPassenger.email } : {}),
    };
  }

  const { data } = await transferBlackApi.post<ApiDataResponse<ConfirmTripResponse>>(
    `/rides/${input.tripId}/confirm`,
    body,
    { headers: { 'Idempotency-Key': input.idempotencyKey } },
  );

  return TripQuoteMapper.toConfirmedTrip(data.data);
}
