// Fechas del historial de viajes: relativas los primeros 7 dias, absolutas despues.
//
// El calculo de "hace cuantos dias" es manual en lugar de `Intl.RelativeTimeFormat`:
// el formato que pide el diseno ("Hoy, 15:30", "Hace 3 dias") no es el que arma ese
// formateador, asi que de cualquier manera hacia falta esta logica.

const MS_PER_DAY = 86_400_000;

const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayMonthFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const dayMonthYearFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * "Hoy, 15:30" / "Ayer, 15:30" / "Hace 3 días" para los ultimos 7 dias, y
 * "14 de agosto, 15:30" (con el año si no es el actual) para el resto.
 *
 * `now` es un parametro y no `new Date()` adentro para que el resultado sea
 * determinista y facil de verificar.
 */
export function formatTripDate(date: Date, now: Date): string {
  const time = timeFormatter.format(date);
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / MS_PER_DAY);

  if (dayDiff === 0) {
    return `Hoy, ${time}`;
  }
  if (dayDiff === 1) {
    return `Ayer, ${time}`;
  }
  if (dayDiff > 1 && dayDiff < 7) {
    return `Hace ${dayDiff} días`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const dayLabel = sameYear ? dayMonthFormatter.format(date) : dayMonthYearFormatter.format(date);
  return `${dayLabel}, ${time}`;
}

/**
 * "sábado 3 de octubre": fecha futura para una reserva. Sin la coma que agrega
 * `Intl` entre el dia de la semana y la fecha, para que quede igual al resto
 * de las etiquetas de la app.
 */
export function formatReservationDate(date: Date): string {
  return `${weekdayFormatter.format(date)} ${dayMonthFormatter.format(date)}`;
}

/** "18:30": hora de reloj en formato 24 horas, para la reserva y el mensaje de WhatsApp. */
export function formatClockTime(date: Date): string {
  return timeFormatter.format(date);
}
