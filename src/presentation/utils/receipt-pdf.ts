// Arma el HTML del comprobante en PDF. Funcion pura: no toca la red ni el
// sistema de archivos, eso lo hace el hook que la usa (`useDownloadReceipt`).

import type { Trip } from '@/infrastructure/interfaces/trips';
import { colors } from '@/presentation/theme/colors';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/presentation/utils/payment-labels';

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const kmFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Fila "etiqueta: valor" del comprobante; se omite si no hay valor. */
function row(label: string, value: string | null): string {
  if (!value) return '';
  return `
    <tr>
      <td class="label">${escapeHtml(label)}</td>
      <td class="value">${escapeHtml(value)}</td>
    </tr>`;
}

function tripFacts(trip: Trip): string | null {
  const facts: string[] = [];

  if (trip.startedAt && trip.finishedAt) {
    const minutes = Math.max(1, Math.round((trip.finishedAt.getTime() - trip.startedAt.getTime()) / 60_000));
    facts.push(`${minutes} min de trayecto`);
  }
  if (trip.distanceKm !== null) {
    facts.push(`${kmFormatter.format(trip.distanceKm)} km recorridos`);
  }

  return facts.length > 0 ? facts.join(' · ') : null;
}

function fareBreakdownRows(trip: Trip): string {
  const breakdown = trip.fareBreakdown;
  if (!breakdown) return '';

  const rows = [
    row('Base', breakdown.base.formattedAmount),
    row('Distancia', breakdown.distance.formattedAmount),
    row('Tiempo', breakdown.time.formattedAmount),
    breakdown.discount.amount > 0 ? row('Descuento', `- ${breakdown.discount.formattedAmount}`) : '',
    breakdown.fees.amount > 0 ? row('Cargos', breakdown.fees.formattedAmount) : '',
  ].join('');

  return `
    <table class="section">
      <tr><th colspan="2">Desglose de la tarifa</th></tr>
      ${rows}
    </table>`;
}

/** Comprobante del viaje en HTML, listo para `Print.printToFileAsync`. */
export function buildReceiptHtml(trip: Trip): string {
  const tripDate = trip.finishedAt ?? trip.startedAt ?? null;
  const method = PAYMENT_METHOD_LABELS[trip.paymentMethod] ?? trip.paymentMethod;
  const status = trip.paymentStatus ? PAYMENT_STATUS_LABELS[trip.paymentStatus] : null;
  const total = trip.formattedFinalFare ?? trip.formattedFare ?? '—';
  const driverLine = trip.driver
    ? [trip.driver.displayName, trip.vehicle?.name, trip.vehicle?.plate].filter(Boolean).join(' · ')
    : null;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, Helvetica, Arial, sans-serif;
            background-color: ${colors.obsidian};
            color: ${colors.platinum};
            padding: 32px;
          }
          h1 {
            color: ${colors.gold};
            font-size: 22px;
            letter-spacing: 2px;
            margin-bottom: 0;
          }
          .subtitle {
            color: ${colors.ash};
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .total {
            margin: 24px 0;
            text-align: center;
          }
          .total .amount {
            font-size: 32px;
            font-weight: bold;
            color: ${colors.platinum};
          }
          .total .label {
            color: ${colors.ash};
            font-size: 11px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          table.section {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid ${colors.charcoal};
            border-radius: 8px;
            overflow: hidden;
          }
          table.section th {
            text-align: left;
            background-color: ${colors.surface};
            color: ${colors.gold};
            font-size: 11px;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 10px 14px;
          }
          table.section td {
            padding: 8px 14px;
            font-size: 13px;
            border-top: 1px solid ${colors.charcoal};
          }
          table.section td.label {
            color: ${colors.ash};
          }
          table.section td.value {
            text-align: right;
            font-weight: 600;
          }
          .footer {
            color: ${colors.ash};
            font-size: 11px;
            text-align: center;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <h1>TRANSFER BLACK</h1>
        <div class="subtitle">Comprobante oficial · Servicio privado</div>

        <div class="total">
          <div class="label">Monto total</div>
          <div class="amount">${escapeHtml(total)}</div>
        </div>

        <table class="section">
          <tr><th colspan="2">Viaje</th></tr>
          ${row('Código', trip.publicCode)}
          ${row('Fecha', tripDate ? dateTimeFormatter.format(tripDate) : null)}
          ${row('Origen', trip.pickup?.address ?? null)}
          ${row('Destino', trip.dropoff?.address ?? null)}
          ${row('Recorrido', tripFacts(trip))}
        </table>

        ${fareBreakdownRows(trip)}

        <table class="section">
          <tr><th colspan="2">Pago</th></tr>
          ${row('Medio de pago', method)}
          ${row('Estado', status)}
        </table>

        ${
          driverLine
            ? `<table class="section">
                <tr><th colspan="2">Chofer</th></tr>
                ${row('Chofer y vehículo', driverLine)}
              </table>`
            : ''
        }

        <div class="footer">Transfer Black · Remis y transfer privado en Córdoba</div>
      </body>
    </html>`;
}
