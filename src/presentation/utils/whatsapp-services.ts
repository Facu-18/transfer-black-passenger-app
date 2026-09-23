import { Bus, Construction, Ellipsis, Truck, type LucideIcon } from 'lucide-react-native';
import { Alert, Linking } from 'react-native';

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

async function openChat(number: string, message: string): Promise<void> {
  // wa.me abre la app si esta instalada y, si no, WhatsApp Web: no hace falta canOpenURL.
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No pudimos abrir WhatsApp', 'Escribinos al 351 926-0326 o al 351 926-0327.', [{ text: 'Entendido' }]);
  }
}

/** Pregunta con que linea hablar y abre el chat con el pedido ya escrito. */
export function contactWhatsAppService(service: WhatsAppService, trip: WhatsAppTrip = {}): void {
  const message = buildMessage(service, trip);

  Alert.alert(service.name, 'Lo coordinamos por WhatsApp. ¿Con qué línea querés hablar?', [
    ...WHATSAPP_LINES.map((line) => ({ text: line.label, onPress: () => void openChat(line.number, message) })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}
