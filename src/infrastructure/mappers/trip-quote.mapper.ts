import type { Coordinates } from '../interfaces/places';
import type {
  ConfirmedTrip,
  FareOption,
  RideQuote,
  Trip,
  TripDriver,
  TripPoint,
  TripStatus,
  TripVehicle,
} from '../interfaces/trips';
import type {
  ConfirmTripResponse,
  RideQuoteResponse,
  RouteGeometryResponse,
  TripDetailResponse,
  TripStopPointResponse,
} from '../interfaces/trips-api';

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

function toTripPoint(point: TripStopPointResponse | null | undefined): TripPoint | null {
  return point
    ? { address: point.address, coordinates: { latitude: point.latitude, longitude: point.longitude } }
    : null;
}

function toTripDriver(driver: TripDetailResponse['driver']): TripDriver | null {
  if (!driver) {
    return null;
  }

  const firstName = driver.first_name.trim() || 'Tu chofer';
  const lastInitial = driver.last_initial ? ` ${driver.last_initial}.` : '';

  return {
    displayName: `${firstName}${lastInitial}`,
    initials: `${firstName.charAt(0)}${driver.last_initial ?? ''}`.toUpperCase(),
    avatarUrl: driver.avatar_url,
    ratingAverage: driver.rating_average,
    ratingCount: driver.rating_count,
  };
}

function toTripVehicle(vehicle: TripDetailResponse['vehicle']): TripVehicle | null {
  return vehicle
    ? { name: `${vehicle.brand} ${vehicle.model}`, color: vehicle.color, plate: vehicle.plate }
    : null;
}

export const TripQuoteMapper = {
  toTrip(trip: TripDetailResponse): Trip {
    return {
      id: trip.id,
      publicCode: trip.public_code,
      status: trip.status as TripStatus,
      paymentMethod: trip.payment_method,
      driverId: trip.driver_id,
      formattedFare: trip.estimated_fare ? formatAmount(trip.estimated_fare, trip.currency) : null,
      pickup: toTripPoint(trip.pickup),
      dropoff: toTripPoint(trip.dropoff),
      driver: toTripDriver(trip.driver),
      vehicle: toTripVehicle(trip.vehicle),
    };
  },

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
