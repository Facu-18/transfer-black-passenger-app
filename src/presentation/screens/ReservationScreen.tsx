import { router } from 'expo-router';
import { CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { ReservationScheduleField } from '@/presentation/components/ReservationScheduleField';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useReservationForm } from '@/presentation/hooks/useReservationForm';
import { colors } from '@/presentation/theme/colors';

interface ReservationStopRowProps {
  label: string;
  placeholder: string;
  value: string | null;
  isFirst?: boolean;
  onPress: () => void;
}

/** Fila de origen o destino: igual al resto de la app, se completa tocando (abre la busqueda). */
function ReservationStopRow({ label, placeholder, value, isFirst = false, onPress }: ReservationStopRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-80 ${isFirst ? '' : 'border-t border-charcoal'}`}
    >
      <View className={isFirst ? 'h-2.5 w-2.5 rounded-full bg-gold' : 'h-2.5 w-2.5 bg-platinum'} />
      <View className="flex-1 gap-0.5">
        <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
          {label}
        </Typography>
        <Typography weight="medium" numberOfLines={1} tone={value ? 'primary' : 'secondary'}>
          {value ?? placeholder}
        </Typography>
      </View>
      <ChevronRight size={18} color={colors.ash} />
    </Pressable>
  );
}

export function ReservationScreen() {
  const { origin, destination, scheduledAt, notes, setScheduledAt, setNotes, error, sent, submit, startOver } =
    useReservationForm();

  const goHome = () => {
    startOver();
    router.dismissTo('/home');
  };

  if (sent) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-5 px-2">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-gold/15">
            <CheckCircle2 size={32} color={colors.gold} />
          </View>
          <Typography variant="h2" className="text-center">
            Ya te contactamos por WhatsApp
          </Typography>
          <Typography tone="secondary" className="text-center">
            Confirmamos ahí el precio y el horario. El viaje va a aparecer en tu cuenta cuando la agencia lo
            confirme.
          </Typography>
          <VIPButton title="Volver al inicio" onPress={goHome} className="mt-2" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="gap-6">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>
        <View className="h-11 w-11" />
      </View>

      <View className="gap-2">
        <Typography variant="h2">Reservar viaje</Typography>
        <Typography tone="secondary">
          Elegí origen, destino, fecha y hora. Coordinamos el precio y el horario por WhatsApp.
        </Typography>
      </View>

      <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
        <ReservationStopRow
          label="Origen"
          placeholder="Elegir punto de partida"
          value={origin?.name ?? null}
          isFirst
          onPress={() => router.push({ pathname: '/search', params: { mode: 'reserve', field: 'origin' } })}
        />
        <ReservationStopRow
          label="Destino"
          placeholder="Elegir destino"
          value={destination?.name ?? null}
          onPress={() => router.push({ pathname: '/search', params: { mode: 'reserve', field: 'destination' } })}
        />
      </View>

      <ReservationScheduleField value={scheduledAt} onChange={setScheduledAt} />

      <VIPTextInput
        label="Pasajeros o notas (opcional)"
        icon={Users}
        placeholder="Ej. 2 pasajeros, con equipaje"
        returnKeyType="done"
        value={notes}
        onChangeText={setNotes}
      />

      {error ? (
        <Typography tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Typography>
      ) : null}

      <VIPButton title="Enviar por WhatsApp" trailingIcon={MessageCircle} onPress={submit} />
    </Screen>
  );
}
