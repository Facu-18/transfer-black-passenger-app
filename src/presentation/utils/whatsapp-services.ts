import { Bus, Construction, Ellipsis, Truck, type LucideIcon } from 'lucide-react-native';
import { Alert, Linking } from 'react-native';

import { formatClockTime, formatReservationDate } from '@/presentation/utils/format-date';

/**
 * Servicios que no pasan por el backend: el pasajero escribe por WhatsApp y
 * el equipo arma el pedido por fuera de la app. Se cambian solo en este archivo.
 */
export interface WhatsAppService {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const WHATSAPP_SERVICES: WhatsAppService[] = [
  { id: 'tow', name: 'Grúa', icon: Construction },
  { id: 'bus', name: 'Colectivo', icon: Bus },
  { id: 'freight', name: 'Flete', icon: Truck },
  { id: 'other', name: 'Otros', icon: Ellipsis },
];

/** Lineas de atencion. `number` va en formato internacional para wa.me (54 9 + area + numero). */
const WHATSAPP_LINES = [
  { label: 'Línea 1 · 351 926-0326', number: '5493519260326' },
  { label: 'Línea 2 · 351 926-0327', number: '5493519260327' },
];

interface WhatsAppTrip {
  origin?: string;
  destination?: string;
}

function buildMessage(service: WhatsAppService, trip: WhatsAppTrip): string {
  const lines = [`Hola, quiero consultar por un servicio de ${service.name} desde la app de Transfer Black.`];
  if (trip.origin) lines.push(`Origen: ${trip.origin}`);
  if (trip.destination) lines.push(`Destino: ${trip.destination}`);
  return lines.join('\n');
}

/**
 * Abre wa.me con el mensaje ya escrito. Devuelve si se pudo abrir, para que
 * quien llama (la reserva) sepa si avisar al usuario que ya se mando.
 */
async function openWhatsApp(number: string, message: string): Promise<boolean> {
  // wa.me abre la app si esta instalada y, si no, WhatsApp Web: no hace falta canOpenURL.
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('No pudimos abrir WhatsApp', 'Escribinos al 351 926-0326 o al 351 926-0327.', [{ text: 'Entendido' }]);
    return false;
  }
}

/** Pregunta con que linea hablar y abre el chat con el pedido ya escrito. */
export function contactWhatsAppService(service: WhatsAppService, trip: WhatsAppTrip = {}): void {
  const message = buildMessage(service, trip);

  Alert.alert(service.name, 'Lo coordinamos por WhatsApp. ¿Con qué línea querés hablar?', [
    ...WHATSAPP_LINES.map((line) => ({ text: line.label, onPress: () => void openWhatsApp(line.number, message) })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

function contactWhatsApp(title: string, prompt: string, message: string): void {
  Alert.alert(title, prompt, [
    ...WHATSAPP_LINES.map((line) => ({
      text: line.label,
      onPress: () => void openWhatsApp(line.number, message),
    })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

export function contactWhatsAppHelp(): void {
  contactWhatsApp(
    'Ayuda',
    '¿Con qué línea querés hablar?',
    'Hola, necesito ayuda con la app de pasajeros de Transfer Black.',
  );
}

export function contactWhatsAppCompanyRegistration(): void {
  contactWhatsApp(
    'Registrar mi empresa',
    '¿Con qué línea querés hablar?',
    'Hola, quiero registrar mi empresa en Transfer Black Empresas.',
  );
}

/** Datos del viaje reservado que van en el mensaje a la agencia. */
export interface ReservationWhatsAppDetails {
  origin: string;
  destination: string;
  scheduledAt: Date;
  /** Cantidad de pasajeros o cualquier aclaracion; `null` si no cargo nada. */
  notes: string | null;
  /** Para que la agencia encuentre la cuenta; `null` solo si el perfil no tiene nombre todavia. */
  passengerName: string | null;
  passengerEmail: string | null;
}

/** Mensaje de la reserva: la agencia arregla precio y horario por esta via, la app no cotiza. */
export function buildReservationMessage(details: ReservationWhatsAppDetails): string {
  const lines = [
    'Hola, quiero reservar un viaje.',
    `Fecha: ${formatReservationDate(details.scheduledAt)}`,
    `Hora: ${formatClockTime(details.scheduledAt)}`,
    `Origen: ${details.origin}`,
    `Destino: ${details.destination}`,
  ];
  if (details.notes) lines.push(`Pasajeros/notas: ${details.notes}`);
  if (details.passengerName) lines.push(`Nombre: ${details.passengerName}`);
  if (details.passengerEmail) lines.push(`Email: ${details.passengerEmail}`);
  return lines.join('\n');
}

/**
 * Pregunta con que linea hablar y abre el chat con la reserva ya escrita.
 * `onOpened` solo se llama si WhatsApp se abrio: si no se pudo, ya se avisa
 * con la alerta de `openWhatsApp` y la pantalla de reserva se queda como esta.
 */
export function contactWhatsAppReservation(details: ReservationWhatsAppDetails, onOpened: () => void): void {
  const message = buildReservationMessage(details);

  Alert.alert('Reservar viaje', 'Lo coordinamos por WhatsApp. ¿Con qué línea querés hablar?', [
    ...WHATSAPP_LINES.map((line) => ({
      text: line.label,
      onPress: () => {
        void openWhatsApp(line.number, message).then((opened) => {
          if (opened) onOpened();
        });
      },
    })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

/** Mensaje para pedirle a la agencia que gestione la cancelación de un viaje reservado ya pago. */
function buildCancelReservationMessage(publicCode: string): string {
  return `Hola, quiero cancelar mi viaje reservado ${publicCode}. ¿Me ayudan con la cancelación?`;
}

/**
 * El backend bloquea la cancelación de un reservado ya pago desde la app
 * (`SCHEDULED_TRIP_CANCEL_VIA_AGENCY`): la agencia es quien la gestiona, y
 * también el reembolso si corresponde.
 */
export function contactWhatsAppToCancelReservation(publicCode: string): void {
  const message = buildCancelReservationMessage(publicCode);

  Alert.alert('Cancelar viaje reservado', '¿Con qué línea querés hablar?', [
    ...WHATSAPP_LINES.map((line) => ({
      text: line.label,
      onPress: () => void openWhatsApp(line.number, message),
    })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}
