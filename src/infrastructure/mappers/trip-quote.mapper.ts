import type { Coordinates } from '../interfaces/places';
import type { ConfirmedTrip, FareOption, RideQuote } from '../interfaces/trips';
import type { ConfirmTripResponse, RideQuoteResponse, RouteGeometryResponse } from '../interfaces/trips-api';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Importe listo para mostrar (`$ 24.500`).
 *
 * El `Number` es solo para formatear: el valor exacto sigue viajando como texto
 * en `totalAmount`, que es el que se manda al backend.
 */
function formatAmount(amount: string, currency: string): string {
  let formatter = currencyFormatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(currency, formatter);
  }

  return formatter.format(Number(amount));
}

/** Geoapify entrega `[longitud, latitud]` en tramos; el mapa espera `{ latitude, longitude }`. */
function toPolylinePoints(geometry: RouteGeometryResponse): Coordinates[] {
  return geometry.coordinates.flat().map(([longitude, latitude]) => ({
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
  }));
}

export const TripQuoteMapper = {
  toRideQuote(response: RideQuoteResponse): RideQuote {
    const options: FareOption[] = response.quotes.map((quote) => ({
      id: quote.id,
      code: quote.service_type.code,
      name: quote.service_type.name,
      totalAmount: quote.pricing.total_amount,
      formattedTotal: formatAmount(quote.pricing.total_amount, quote.currency),
      currency: quote.currency,
      expiresAt: new Date(quote.expires_at),
    }));

    return {
      tripId: response.draft.id,
      publicCode: response.draft.public_code,
      expiresAt: new Date(response.draft.expires_at),
      route: {
        distanceKm: response.route.distance_km,
        durationMinutes: response.route.duration_minutes,
        points: toPolylinePoints(response.route.geometry),
      },
      options,
    };
  },

  toConfirmedTrip(response: ConfirmTripResponse): ConfirmedTrip {
    return {
      tripId: response.trip.id,
      publicCode: response.trip.public_code,
      status: response.trip.status,
      checkoutUrl: response.payment.checkout_url,
    };
  },
};
