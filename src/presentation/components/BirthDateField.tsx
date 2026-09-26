import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

interface BirthDateFieldProps {
  value: string;
  error?: string | undefined;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const MINIMUM_DATE = new Date(1900, 0, 1, 12);
const DEFAULT_DATE = new Date(1990, 0, 1, 12);
const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return DEFAULT_DATE;

  const [, year = '', month = '', day = ''] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return Number.isNaN(date.getTime()) ? DEFAULT_DATE : date;
}

function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BirthDateField({ value, error, disabled = false, onChange, onBlur }: BirthDateFieldProps) {
  const selectedDate = parseLocalDate(value);
  const maximumDate = new Date();
  const borderClass = error ? 'border-danger' : 'border-charcoal';

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      onChange(toApiDate(date));
    }
    onBlur();
  };

  const openAndroidPicker = () => {
    if (disabled) return;
    DateTimePickerAndroid.open({
      value: selectedDate,
      mode: 'date',
      display: 'calendar',
      minimumDate: MINIMUM_DATE,
      maximumDate,
      onChange: handleChange,
    });
  };

  return (
    <View className="gap-2">
      <Typography variant="caption" weight="medium" tone="secondary" className="uppercase tracking-widest">
        Fecha de nacimiento
      </Typography>

      {Platform.OS === 'ios' ? (
        <View className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 ${borderClass}`}>
          <CalendarDays size={18} color={error ? colors.danger : colors.ash} />
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="compact"
            locale="es-AR"
            minimumDate={MINIMUM_DATE}
            maximumDate={maximumDate}
            disabled={disabled}
            themeVariant="dark"
            accentColor={colors.gold}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seleccionar fecha de nacimiento"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={openAndroidPicker}
          className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-field px-4 active:opacity-80 ${borderClass}`}
        >
          <CalendarDays size={18} color={error ? colors.danger : colors.ash} />
          <Typography tone={value ? 'primary' : 'secondary'}>
            {value ? dateFormatter.format(selectedDate) : 'Seleccionar fecha'}
          </Typography>
        </Pressable>
      )}

      {error ? <Typography variant="caption" tone="danger">{error}</Typography> : null}
    </View>
  );
}
