import type { TripHistoryItem, TripHistoryPage, TripHistoryReservedDriver, TripStatus } from '../interfaces/trips';
import type { TripHistoryReservedDriverResponse, TripListItemResponse, TripListResponse } from '../interfaces/trips-api';
import { formatAmount, toTripVehicle } from './trip-quote.mapper';

function toFormattedFare(trip: TripListItemResponse): string | null {
  if (trip.final_fare) {
    return formatAmount(trip.final_fare, trip.currency);
  }
  if (trip.estimated_fare) {
    return formatAmount(trip.estimated_fare, trip.currency);
  }
  return null;
}

function toReservedDriver(driver: TripHistoryReservedDriverResponse | null | undefined): TripHistoryReservedDriver | null {
  if (!driver) {
    return null;
  }

  const firstName = driver.first_name.trim() || 'Tu chofer';
  const lastInitial = driver.last_initial ? ` ${driver.last_initial}.` : '';

  return {
    displayName: `${firstName}${lastInitial}`,
    initials: `${firstName.charAt(0)}${driver.last_initial ?? ''}`.toUpperCase(),
    vehicle: toTripVehicle(driver.vehicle),
  };
}

function toItem(trip: TripListItemResponse): TripHistoryItem {
  return {
    id: trip.id,
    publicCode: trip.public_code,
    status: trip.status as TripStatus,
    date: new Date(trip.created_at),
    origin: trip.origin?.address_text ?? null,
    destination: trip.destination?.address_text ?? null,
    formattedFare: toFormattedFare(trip),
    serviceCode: trip.service_type?.code ?? null,
    serviceName: trip.service_type?.name ?? null,
    isThirdParty: trip.is_third_party,
    thirdPartyName: trip.third_party_name,
    rated: trip.rated,
    bookingType: trip.booking_type ?? 'immediate',
    scheduledAt: trip.scheduled_at ? new Date(trip.scheduled_at) : null,
    prepaidAt: trip.prepaid_at ? new Date(trip.prepaid_at) : null,
    reservedDriver: toReservedDriver(trip.reserved_driver),
  };
}

export const TripHistoryMapper = {
  toPage(response: TripListResponse): TripHistoryPage {
    return {
      items: response.trips.map(toItem),
      page: response.pagination.page,
      totalPages: response.pagination.total_pages,
      total: response.pagination.total,
    };
  },

  /** Mismo mapeo por renglon, para `GET /rides/upcoming` (sin paginacion). */
  toItems(trips: TripListItemResponse[]): TripHistoryItem[] {
    return trips.map(toItem);
  },
};
