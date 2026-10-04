// Reclamo de devolucion por WhatsApp: el reembolso quedo como reclamo
// (`refund.status === 'claim_required'`) y un admin lo resuelve a mano, pero
// el pasajero tiene que avisarle primero a la agencia.
//
// Mismo patron que `presentation/utils/whatsapp-services.ts` (elegir linea y
// abrir `wa.me` con el mensaje ya escrito) en un archivo propio: ese modulo no
// exporta sus lineas de atencion ni su helper para abrir WhatsApp.

import { Alert, Linking } from 'react-native';

import { formatClockTime, formatReservationDate } from '@/presentation/utils/format-date';

/** Mismas lineas que `whatsapp-services.ts`; si cambian los numeros hay que actualizar los dos archivos. */
const WHATSAPP_LINES = [
  { label: 'Línea 1 · 351 926-0326', number: '5493519260326' },
  { label: 'Línea 2 · 351 926-0327', number: '5493519260327' },
];

async function openWhatsApp(number: string, message: string): Promise<void> {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No pudimos abrir WhatsApp', 'Escribinos al 351 926-0326 o al 351 926-0327.', [{ text: 'Entendido' }]);
  }
}

export interface RefundClaimDetails {
  publicCode: string;
  /** Cuando se cancelo el viaje; `null` si todavia no llego el dato. */
  cancelledAt: Date | null;
  formattedAmount: string;
  /** `null` si el perfil todavia no tiene nombre cargado. */
  passengerName: string | null;
  passengerEmail: string | null;
}

function buildRefundClaimMessage(details: RefundClaimDetails): string {
  const lines = [`Hola, quiero reclamar la devolución de mi viaje ${details.publicCode}.`];

  if (details.cancelledAt) {
    lines.push(`Fecha: ${formatReservationDate(details.cancelledAt)}`);
    lines.push(`Hora: ${formatClockTime(details.cancelledAt)}`);
  }
  lines.push(`Monto: ${details.formattedAmount}`);
  if (details.passengerName) lines.push(`Nombre: ${details.passengerName}`);
  if (details.passengerEmail) lines.push(`Email: ${details.passengerEmail}`);

  return lines.join('\n');
}

/** Pregunta con que linea hablar y abre el chat con el reclamo ya escrito. */
export function contactWhatsAppRefundClaim(details: RefundClaimDetails): void {
  const message = buildRefundClaimMessage(details);

  Alert.alert('Reclamo de devolución', '¿Con qué línea querés hablar?', [
    ...WHATSAPP_LINES.map((line) => ({ text: line.label, onPress: () => void openWhatsApp(line.number, message) })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}
