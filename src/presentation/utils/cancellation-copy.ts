// Textos de la politica de cancelacion: motivo mostrado en el detalle, y los
// mensajes de la confirmacion antes de cancelar y del aviso despues de hacerlo.

import type { CancellationPreview, CancellationResult, RefundMode } from '@/infrastructure/interfaces/trips';

const clockFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Motivos que la app sabe traducir; cualquier otro se omite (no hay texto para inventarle). */
export const CANCELLATION_REASON_LABELS: Record<string, string> = {
  passenger_cancelled: 'Cancelado por vos',
  /** El sistema cancelo porque nadie busco mas de `TRIP_SEARCH_TIMEOUT_MINUTES`. */
  no_driver_found: 'Sin chofer disponible',
  /** Un borrador (pago nunca confirmado) que un worker limpio solo; no deberia verse en el historial. */
  draft_expired: 'Venció sin confirmarse',
};

/** Linea sobre el reembolso, comun a la confirmacion previa y al aviso posterior. `null` si no hay nada que avisar (`none`). */
function refundLine(refundMode: RefundMode, formattedRefund: string, autoRefundWindowEndsAt: Date | null): string | null {
  if (refundMode === 'automatic') {
    const window = autoRefundWindowEndsAt
      ? ` Tenés hasta las ${clockFormatter.format(autoRefundWindowEndsAt)} para cancelar con devolución automática.`
      : '';
    return `Te devolvemos ${formattedRefund} automáticamente a tu medio de pago.${window}`;
  }
  if (refundMode === 'claim') {
    return `Si cancelás ahora, la devolución de ${formattedRefund} se gestiona por reclamo con la agencia.`;
  }
  return null;
}

/**
 * Mensaje de la confirmacion antes de cancelar: el texto de siempre segun si
 * ya hay chofer asignado, mas la penalidad (si aplica) y que pasa con el
 * reembolso. Sin vista previa (no se pudo consultar) se queda con el texto de
 * siempre: no se bloquea la cancelacion por eso.
 */
export function buildCancelConfirmationMessage(hasDriver: boolean, preview: CancellationPreview | null): string {
  const base = hasDriver
    ? 'Tu chofer ya está en camino. Si cancelás, queda libre para otro viaje.'
    : 'Dejamos de buscar un chofer para este viaje.';

  if (!preview) {
    return base;
  }

  const lines = [base];

  if (preview.penalty.amount > 0) {
    lines.push(`Se aplica una penalidad de ${preview.penalty.formattedAmount}.`);
  }

  const refund = refundLine(preview.refundMode, preview.refund.formattedAmount, preview.autoRefundWindowEndsAt);
  if (refund) {
    lines.push(refund);
  }

  return lines.join(' ');
}

/** Aviso tras cancelar, con el resultado real que aplico el backend; `null` si no hay nada que avisar. */
export function buildCancelledRefundMessage(result: CancellationResult | null): string | null {
  if (!result) {
    return null;
  }

  return refundLine(result.refundMode, result.refund.formattedAmount, null);
}
