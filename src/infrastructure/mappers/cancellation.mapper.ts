// Mapea la politica de cancelacion: la vista previa y el resultado de cancelar de verdad.

import type { CancellationPreview, CancellationResult, FareBreakdownItem } from '../interfaces/trips';
import type { CancellationPreviewResponse, TripCancellationResponse } from '../interfaces/trips-api';
import { formatAmount } from './trip-quote.mapper';

function toMoneyItem(amount: string, currency: string): FareBreakdownItem {
  return { amount: Number(amount), formattedAmount: formatAmount(amount, currency) };
}

export const CancellationMapper = {
  toPreview(response: CancellationPreviewResponse): CancellationPreview {
    return {
      cancellable: response.cancellable,
      penalty: toMoneyItem(response.penalty_amount, response.currency),
      refund: toMoneyItem(response.refund_amount, response.currency),
      refundKind: response.refund_kind,
      refundMode: response.refund_mode,
      autoRefundWindowEndsAt: response.auto_refund_window_ends_at ? new Date(response.auto_refund_window_ends_at) : null,
    };
  },

  /** `null` al repetir la cancelacion sobre un viaje ya cancelado: no hay nada que informar. */
  toResult(cancellation: TripCancellationResponse | null, currency: string): CancellationResult | null {
    if (!cancellation) {
      return null;
    }

    return {
      refund: toMoneyItem(cancellation.refund_amount, currency),
      refundKind: cancellation.refund_kind,
      refundMode: cancellation.refund_mode,
    };
  },
};
