import { router } from 'expo-router';
import { ArrowDownUp, ChevronDown, ChevronLeft, Clock, LocateFixed, Map as MapIcon, MapPin, Plus, X } from 'lucide-react-native';
import { Fragment, type RefObject } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceRow } from '@/presentation/components/PlaceRow';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { stopField, usePlanTrip, type TripField } from '@/presentation/hooks/usePlanTrip';
import { colors } from '@/presentation/theme/colors';
import { MAX_FONT_SCALE } from '@/presentation/theme/font-scale';

/** Un nombre largo como placeholder ocupa dos lineas y queda cortado en el campo de una linea. */
function shortPlaceholder(text: string, max = 32): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

interface TripInputProps {
  inputRef: RefObject<TextInput | null>;
  field: TripField;
  active: boolean;
  value: string;
  placeholder: string;
  badge?: string | null;
  autoFocus?: boolean;
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  onFocus: (field: TripField) => void;
  /** Solo las paradas: quita el campo del recorrido. */
  onRemove?: () => void;
  /** Solo las paradas con direccion: la intercambia con el punto de abajo. */
  onSwapDown?: () => void;
}

/** Campo del recorrido (origen, parada o destino): borde gold y cursor gold mientras está activo. */
function TripInput({
  inputRef,
  field,
  active,
  value,
  placeholder,
  badge,
  autoFocus,
  accessibilityLabel,
  onChangeText,
  onFocus,
  onRemove,
  onSwapDown,
}: TripInputProps) {
  return (
    <View className={`h-12 flex-row items-center gap-2 rounded-xl border bg-surface px-3 ${active ? 'border-gold' : 'border-transparent'}`}>
      <TextInput
        ref={inputRef}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        className="flex-1 font-semibold text-base text-platinum"
        value={value}
        placeholder={placeholder}
        placeholderTextColor={active ? colors.ash : colors.platinum}
        selectionColor={colors.gold}
        cursorColor={colors.gold}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel}
        onFocus={() => onFocus(field)}
        onChangeText={onChangeText}
      />
      {badge && !active ? (
        <Typography variant="caption" tone="secondary">
          {badge}
        </Typography>
      ) : null}
      {onSwapDown ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mover ${accessibilityLabel.toLowerCase()} después del punto siguiente`}
          hitSlop={8}
          onPress={onSwapDown}
          className="h-7 w-7 items-center justify-center rounded-full active:opacity-70"
        >
          <ArrowDownUp size={16} color={colors.gold} />
        </Pressable>
      ) : null}
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${accessibilityLabel.toLowerCase()}`}
          hitSlop={8}
          onPress={onRemove}
          className="h-7 w-7 items-center justify-center rounded-full active:opacity-70"
        >
          <X size={16} color={colors.ash} />
        </Pressable>
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

  // Destino o parada (la reserva no usa este selector: guarda en otro store).
  const showMapPickerOption = (activeField === 'destination' || activeField.startsWith('stop-')) && !trip.isReserveMode;
  const mapPickerTarget = activeField.startsWith('stop-') ? 'la parada' : 'el destino';

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

        {/* Mientras se escribe, sin titulo ni selectores: mas lugar para las sugerencias. */}
        {!search.isActive ? (
          <Typography variant="h2" className="text-3xl">
            {trip.isReserveMode ? 'Reservá tu viaje' : 'Planificá tu viaje'}
          </Typography>
        ) : null}

        {/* La reserva ya eligio "Reserva" y no admite invitado: el selector solo confunde. */}
        {!trip.isReserveMode && !search.isActive ? (
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
              onPress={() => router.replace('/reserve')}
              className="flex-1 items-center justify-center rounded-xl py-2 active:opacity-70"
            >
              <Typography tone="secondary">Reserva</Typography>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={trip.guestName ? `Viaja ${trip.guestName}. Cambiar pasajero` : 'Viajo yo. Pedir para un invitado'}
            onPress={() => router.push('/guest')}
            className="flex-1 flex-row items-center justify-between gap-2 rounded-2xl border border-charcoal bg-surface px-4 active:opacity-80"
          >
            <Typography weight="medium" numberOfLines={1} className="flex-1">
              {trip.guestName ? `Para ${trip.guestName.split(' ')[0]}` : 'Para mí'}
            </Typography>
            <ChevronDown size={16} color={colors.ash} />
          </Pressable>
        </View>
        ) : null}

        <View className="flex-row gap-3 rounded-2xl border border-charcoal bg-surface p-3">
          {/* Línea de tiempo: punto gold (origen), aro gold por parada y cuadrado (destino). */}
          <View className="items-center py-5">
            <View className="h-2.5 w-2.5 rounded-full bg-gold" />
            {trip.stops.map((_, index) => (
              <Fragment key={index}>
                <View className="my-1 w-px flex-1 bg-charcoal" />
                <View className="h-2.5 w-2.5 rounded-full border border-gold" />
              </Fragment>
            ))}
            <View className="my-1 w-px flex-1 bg-charcoal" />
            <View className="h-2.5 w-2.5 bg-platinum" />
          </View>

          <View className="flex-1 gap-2">
            <TripInput
              inputRef={trip.originInputRef}
              field="origin"
              active={activeField === 'origin'}
              value={trip.originQuery}
              placeholder={shortPlaceholder(trip.origin?.name ?? 'Punto de partida')}
              badge={originIsCurrentPlace ? 'Ubicación actual' : null}
              accessibilityLabel="Punto de partida"
              // Autofoco solo si se entro a elegir justo este campo (p. ej. desde la reserva).
              autoFocus={activeField === 'origin'}
              onChangeText={trip.setOriginQuery}
              onFocus={trip.setActiveField}
            />
            {trip.stops.map((stop, index) => (
              <Fragment key={index}>
                <View className="h-px bg-charcoal" />
                <TripInput
                  inputRef={trip.stopInputRefs[index]!}
                  field={stopField(index)}
                  active={activeField === stopField(index)}
                  value={trip.stopQueries[index] ?? ''}
                  placeholder={shortPlaceholder(stop?.name ?? `Parada ${index + 1}`)}
                  accessibilityLabel={`Parada ${index + 1}`}
                  // Una parada recien agregada se monta activa y abre el teclado.
                  autoFocus={activeField === stopField(index)}
                  onChangeText={(text) => trip.setStopQuery(index, text)}
                  onFocus={trip.setActiveField}
                  onRemove={() => trip.removeStop(index)}
                  // Solo con direccion, y si abajo hay algo con que intercambiar.
                  onSwapDown={
                    stop && (index < trip.stops.length - 1 || trip.destination) ? () => trip.swapStopWithNext(index) : undefined
                  }
                />
              </Fragment>
            ))}
            <View className="h-px bg-charcoal" />
            <TripInput
              inputRef={trip.destinationInputRef}
              field="destination"
              active={activeField === 'destination'}
              value={trip.destinationQuery}
              placeholder={shortPlaceholder(trip.destination?.name ?? '¿A dónde vas?')}
              accessibilityLabel="Destino"
              // Por defecto el flujo arranca pidiendo el destino.
              autoFocus={activeField === 'destination'}
              onChangeText={trip.setDestinationQuery}
              onFocus={trip.setActiveField}
            />
          </View>
        </View>

        {trip.canAddStop || trip.isRouteComplete ? (
          <View className="flex-row items-center justify-between gap-3">
            {trip.canAddStop ? (
              <Pressable
                accessibilityRole="button"
                onPress={trip.addStop}
                className="flex-row items-center gap-2 rounded-full border border-charcoal bg-surface px-4 py-2 active:opacity-80"
              >
                <Plus size={16} color={colors.gold} />
                <Typography weight="medium">Agregar parada</Typography>
              </Pressable>
            ) : (
              <View />
            )}
            {trip.isRouteComplete ? (
              <View className="flex-1">
                <VIPButton title="Ver tarifas" onPress={trip.goToPricing} />
              </View>
            ) : null}
          </View>
        ) : null}

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
              {search.isLoading || trip.isResolvingSuggestion ? <ActivityIndicator size="small" color={colors.gold} /> : null}
            </View>

            {search.error ? (
              <Typography tone="danger">{search.error}</Typography>
            ) : search.results.length > 0 ? (
              <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
                {search.results.map((suggestion, index) => (
                  <PlaceRow
                    key={suggestion.placeId}
                    icon={MapPin}
                    title={suggestion.primaryText}
                    subtitle={suggestion.secondaryText}
                    isFirst={index === 0}
                    onPress={() => void trip.selectSuggestion(suggestion)}
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

            {/* Solo al pedir un viaje: la reserva guarda en otro store y no usa este selector. */}
            {showMapPickerOption ? (
              <View className="overflow-hidden rounded-2xl border border-charcoal bg-surface">
                <PlaceRow
                  icon={MapIcon}
                  title="Elegir en el mapa"
                  subtitle={`Mové el mapa y marcá ${mapPickerTarget}`}
                  isFirst
                  onPress={() => router.push({ pathname: '/search-map', params: { field: activeField } })}
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
