import type { TripHistoryItem, TripHistoryPage, TripStatus } from '../interfaces/trips';
import type { TripListItemResponse, TripListResponse } from '../interfaces/trips-api';
import { formatAmount } from './trip-quote.mapper';

function toFormattedFare(trip: TripListItemResponse): string | null {
  if (trip.final_fare) {
    return formatAmount(trip.final_fare, trip.currency);
  }
  if (trip.estimated_fare) {
    return formatAmount(trip.estimated_fare, trip.currency);
  }
  return null;
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
};
