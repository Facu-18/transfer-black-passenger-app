import { useState } from 'react';

import { useAuthStore } from '@/presentation/store/useAuthStore';
import { useReservationStore } from '@/presentation/store/useReservationStore';
import { contactWhatsAppReservation } from '@/presentation/utils/whatsapp-services';

/** Minimo de anticipacion que pide la agencia para poder coordinar la reserva. */
const MIN_LEAD_MINUTES = 30;

/**
 * Validacion y envio de "Reservar viaje". El origen y destino se eligen en la
 * busqueda ya existente (`usePlanTrip` en modo reserva); este hook solo
 * agrega fecha, hora y notas, valida todo junto, y manda el mensaje por
 * WhatsApp. Sin llamada al backend: lo que crea el viaje es la agencia.
 */
export function useReservationForm() {
  const origin = useReservationStore((state) => state.origin);
  const destination = useReservationStore((state) => state.destination);
  const scheduledAt = useReservationStore((state) => state.scheduledAt);
  const notes = useReservationStore((state) => state.notes);
  const setScheduledAt = useReservationStore((state) => state.setScheduledAt);
  const setNotes = useReservationStore((state) => state.setNotes);
  const reset = useReservationStore((state) => state.reset);

  const user = useAuthStore((state) => state.user);

  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const passengerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || null;

  const submit = () => {
    if (!origin || !destination) {
      setError('Elegí el origen y el destino para reservar.');
      return;
    }
    if (!scheduledAt) {
      setError('Elegí la fecha y la hora del viaje.');
      return;
    }

    const minimumDateTime = new Date(Date.now() + MIN_LEAD_MINUTES * 60_000);
    if (scheduledAt < minimumDateTime) {
      setError(`Elegí un horario con al menos ${MIN_LEAD_MINUTES} minutos de anticipación.`);
      return;
    }

    setError(null);
    contactWhatsAppReservation(
      {
        origin: origin.name,
        destination: destination.name,
        scheduledAt,
        notes: notes.trim() || null,
        passengerName,
        passengerEmail: user?.email ?? null,
      },
      () => setSent(true),
    );
  };

  // Al volver al inicio se limpia la reserva: la proxima vez se arranca de cero.
  const startOver = () => {
    reset();
    setSent(false);
    setError(null);
  };

  return {
    origin,
    destination,
    scheduledAt,
    notes,
    setScheduledAt,
    setNotes,
    error,
    sent,
    submit,
    startOver,
  };
}
