import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import { formatClockTime, formatReservationDate } from '@/presentation/utils/format-date';

import { Typography } from './Typography';

interface ReservationScheduleFieldProps {
  value: Date | null;
  error?: string | undefined;
  disabled?: boolean;
  onChange: (date: Date) => void;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Hora redondeada al proximo cuarto, para no proponer siempre la hora en punto. */
function roundUpToQuarterHour(date: Date): Date {
  const rounded = new Date(date);
  const remainder = rounded.getMinutes() % 15;
  if (remainder !== 0) rounded.setMinutes(rounded.getMinutes() + (15 - remainder));
  rounded.setSeconds(0, 0);
  return rounded;
}

function mergeDatePart(base: Date, datePart: Date): Date {
  const merged = new Date(base);
  merged.setFullYear(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
  return merged;
}

function mergeTimePart(base: Date, timePart: Date): Date {
  const merged = new Date(base);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
}

/**
 * Fecha y hora de retiro de una reserva: dos campos (no uno combinado) porque
 * el selector nativo de iOS/Android no tiene un modo "datetime" prolijo en
 * ambas plataformas. La fecha restringe el pasado (`minimumDate`); la hora
 * no, porque el minimo real (30 minutos desde ahora) depende de que dia se
 * elija y eso lo valida el formulario, no el selector.
 */
export function ReservationScheduleField({ value, error, disabled = false, onChange }: ReservationScheduleFieldProps) {
  const current = value ?? roundUpToQuarterHour(new Date());
  const minimumDate = startOfToday();
  const borderClass = error ? 'border-danger' : 'border-charcoal';
  const iconColor = error ? colors.danger : colors.ash;

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) onChange(mergeDatePart(current, date));
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) onChange(mergeTimePart(current, date));
  };

  const openAndroidDatePicker = () => {
    if (disabled) return;
    DateTimePickerAndroid.open({ value: current, mode: 'date', display: 'calendar', minimumDate, onChange: handleDateChange });
  };

  const openAndroidTimePicker = () => {
    if (disabled) return;
    DateTimePickerAndroid.open({ value: current, mode: 'time', display: 'clock', is24Hour: true, onChange: handleTimeChange });
  };

  return (
    <View className="gap-3">
      <View className="gap-2">
        <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-widest">
          Fecha
        </Typography>

        {Platform.OS === 'ios' ? (
          <View className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 ${borderClass}`}>
            <CalendarDays size={18} color={iconColor} />
            <DateTimePicker
              value={current}
              mode="date"
              display="compact"
              locale="es-AR"
              minimumDate={minimumDate}
              disabled={disabled}
              themeVariant="dark"
              accentColor={colors.gold}
              onChange={handleDateChange}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir fecha de la reserva"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={openAndroidDatePicker}
            className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 active:opacity-80 ${borderClass}`}
          >
            <CalendarDays size={18} color={iconColor} />
            <Typography tone={value ? 'primary' : 'secondary'}>
              {value ? formatReservationDate(current) : 'Elegir fecha'}
            </Typography>
          </Pressable>
        )}
      </View>

      <View className="gap-2">
        <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-widest">
          Hora
        </Typography>

        {Platform.OS === 'ios' ? (
          <View className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 ${borderClass}`}>
            <Clock size={18} color={iconColor} />
            <DateTimePicker
              value={current}
              mode="time"
              display="compact"
              locale="es-AR"
              disabled={disabled}
              themeVariant="dark"
              accentColor={colors.gold}
              onChange={handleTimeChange}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir hora de la reserva"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={openAndroidTimePicker}
            className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 active:opacity-80 ${borderClass}`}
          >
            <Clock size={18} color={iconColor} />
            <Typography tone={value ? 'primary' : 'secondary'}>
              {value ? formatClockTime(current) : 'Elegir hora'}
            </Typography>
          </Pressable>
        )}
      </View>

      {error ? (
        <Typography variant="caption" tone="danger">
          {error}
        </Typography>
      ) : null}
    </View>
  );
}
