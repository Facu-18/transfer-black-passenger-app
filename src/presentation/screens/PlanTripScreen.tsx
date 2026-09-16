import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, Clock, LocateFixed, MapPin } from 'lucide-react-native';
import type { RefObject } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceRow } from '@/presentation/components/PlaceRow';
import { Typography } from '@/presentation/components/Typography';
import { usePlanTrip, type TripField } from '@/presentation/hooks/usePlanTrip';
import { colors } from '@/presentation/theme/colors';

function showComingSoon(feature: string) {
  Alert.alert(feature, 'Esta opción estará disponible pronto.', [{ text: 'Entendido' }]);
}

interface TripInputProps {
  inputRef: RefObject<TextInput | null>;
  field: TripField;
  active: boolean;
  value: string;
  placeholder: string;
  badge?: string | null;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onFocus: (field: TripField) => void;
}

/** Campo de origen o destino: borde gold y cursor gold mientras está activo. */
function TripInput({ inputRef, field, active, value, placeholder, badge, autoFocus, onChangeText, onFocus }: TripInputProps) {
  return (
    <View className={`h-12 flex-row items-center gap-2 rounded-xl border bg-surface px-3 ${active ? 'border-gold' : 'border-transparent'}`}>
      <TextInput
        ref={inputRef}
        className="flex-1 font-semibold text-base text-platinum"
        value={value}
        placeholder={placeholder}
        placeholderTextColor={active ? colors.ash : colors.platinum}
        selectionColor={colors.gold}
        cursorColor={colors.gold}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={field === 'origin' ? 'Punto de partida' : 'Destino'}
        onFocus={() => onFocus(field)}
        onChangeText={onChangeText}
      />
      {badge && !active ? (
        <Typography variant="caption" tone="secondary">
          {badge}
        </Typography>
      ) : null}
    </View>
  );
}

export function PlanTripScreen() {
  const insets = useSafeAreaInsets();
  const trip = usePlanTrip();
  const { search, activeField } = trip;

  const originIsCurrentPlace = trip.origin !== null && trip.origin.placeId === trip.currentPlace?.placeId;
  const showCurrentPlaceOption =
    activeField === 'origin' && trip.currentPlace !== null && !originIsCurrentPlace && !search.isActive;

  return (
    <View className="flex-1 bg-obsidian" style={{ paddingTop: insets.top + 12 }}>
      <View className="gap-5 px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-charcoal bg-surface active:opacity-80"
        >
          <ChevronLeft size={22} color={colors.platinum} />
        </Pressable>

        <Typography variant="h2" className="text-3xl">
          Planifica tu viaje
        </Typography>

        <View className="flex-row gap-3">
          <View className="flex-1 flex-row rounded-2xl border border-charcoal bg-surface p-1">
            <View className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-field py-2">
              <View className="h-1.5 w-1.5 rounded-full bg-gold" />
              <Typography weight="semibold" tone="accent">
                Ahora
              </Typography>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => showComingSoon('Reservar un viaje')}
              className="flex-1 items-center justify-center rounded-xl py-2 active:opacity-70"
            >
              <Typography tone="secondary">Reserva</Typography>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => showComingSoon('Viaje para otra persona')}
            className="flex-1 flex-row items-center justify-between rounded-2xl border border-charcoal bg-surface px-4 active:opacity-80"
          >
            <Typography weight="medium">Para mí</Typography>
            <ChevronDown size={16} color={colors.ash} />
          </Pressable>
        </View>

        <View className="flex-row gap-3 rounded-2xl border border-charcoal bg-surface p-3">
          {/* Línea de tiempo: punto gold (origen), trazo y cuadrado (destino). */}
          <View className="items-center py-5">
            <View className="h-2.5 w-2.5 rounded-full bg-gold" />
            <View className="my-1 w-px flex-1 bg-charcoal" />
            <View className="h-2.5 w-2.5 bg-platinum" />
          </View>

          <View className="flex-1 gap-2">
            <TripInput
              inputRef={trip.originInputRef}
              field="origin"
              active={activeField === 'origin'}
              value={trip.originQuery}
              placeholder={trip.origin?.name ?? 'Punto de partida'}
              badge={originIsCurrentPlace ? 'Ubicación actual' : null}
              onChangeText={trip.setOriginQuery}
              onFocus={trip.setActiveField}
            />
            <View className="h-px bg-charcoal" />
            <TripInput
              inputRef={trip.destinationInputRef}
              field="destination"
              active={activeField === 'destination'}
              value={trip.destinationQuery}
              placeholder={trip.destination?.name ?? '¿A dónde vas?'}
              autoFocus
              onChangeText={trip.setDestinationQuery}
              onFocus={trip.setActiveField}
            />
          </View>
        </View>

        {trip.hint ? (
          <Typography tone="accent" accessibilityLiveRegion="polite">
            {trip.hint}
          </Typography>
        ) : null}
      </View>

      <ScrollView
        className="mt-5 flex-1"
        contentContainerClassName="gap-3 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {search.isActive ? (
          <>
            <View className="flex-row items-center justify-between">
              <Typography variant="caption" weight="semibold" tone="secondary" className="uppercase tracking-widest">
                Sugerencias
              </Typography>
              {search.isLoading ? <ActivityIndicator size="small" color={colors.gold} /> : null}
            </View>

            {search.error ? (
              <Typography tone="danger">{search.error}</Typography>
            ) : search.results.length > 0 ? (
              <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
                {search.results.map((place, index) => (
                  <PlaceRow
                    key={place.placeId}
                    icon={MapPin}
                    title={place.name}
                    subtitle={place.detail}
                    isFirst={index === 0}
                    onPress={() => trip.selectPlace(place)}
                  />
                ))}
              </View>
            ) : !search.isLoading ? (
              <Typography tone="secondary">No encontramos direcciones con ese texto.</Typography>
            ) : null}
          </>
        ) : (
          <>
            {showCurrentPlaceOption && trip.currentPlace ? (
              <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
                <PlaceRow
                  icon={LocateFixed}
                  title="Usar mi ubicación actual"
                  subtitle={trip.currentPlace.name}
                  isFirst
                  onPress={trip.selectCurrentPlaceAsOrigin}
                />
              </View>
            ) : null}

            <Typography variant="caption" weight="semibold" tone="secondary" className="uppercase tracking-widest">
              Recientes
            </Typography>

            {trip.recentPlaces.length > 0 ? (
              <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
                {trip.recentPlaces.map((place, index) => (
                  <PlaceRow
                    key={place.placeId}
                    icon={Clock}
                    title={place.name}
                    subtitle={place.detail}
                    isFirst={index === 0}
                    onPress={() => trip.selectPlace(place)}
                  />
                ))}
              </View>
            ) : (
              <Typography tone="secondary">Escribe una dirección para ver sugerencias.</Typography>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
