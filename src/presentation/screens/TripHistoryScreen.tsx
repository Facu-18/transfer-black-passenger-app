import { router } from 'expo-router';
import { CarFront } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TripHistoryFilter, TripHistoryItem } from '@/infrastructure/interfaces/trips';
import { FINISHED_TRIP_STATUSES } from '@/infrastructure/interfaces/trips';
import { Skeleton } from '@/presentation/components/Skeleton';
import { TripHistoryCard } from '@/presentation/components/TripHistoryCard';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { useTripHistory } from '@/presentation/hooks/useTripHistory';
import { colors } from '@/presentation/theme/colors';

/** Espacio que ocupa la barra de navegación flotante sobre el contenido, igual que en el Home. */
const TAB_BAR_SPACE = 112;

const FILTERS: { value: TripHistoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const EMPTY_COPY: Record<TripHistoryFilter, string> = {
  all: 'Todavía no hiciste ningún viaje. Tu próximo destino te espera.',
  completed: 'Todavía no tenés viajes completados.',
  cancelled: 'No tenés viajes cancelados.',
};

function FilterChips({ value, onChange }: { value: TripHistoryFilter; onChange: (filter: TripHistoryFilter) => void }) {
  return (
    <View className="flex-row gap-2">
      {FILTERS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center rounded-full border px-3 py-2 active:opacity-80 ${
              selected ? 'border-gold/60 bg-gold/15' : 'border-charcoal bg-surface'
            }`}
          >
            <Typography variant="caption" weight="semibold" tone={selected ? 'accent' : 'secondary'}>
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyState({ filter }: { filter: TripHistoryFilter }) {
  return (
    <View className="items-center gap-4 rounded-2xl border border-charcoal bg-surface px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
        <CarFront size={26} color={colors.gold} />
      </View>
      <Typography className="text-center" tone="secondary">
        {EMPTY_COPY[filter]}
      </Typography>
      {filter === 'all' ? <VIPButton title="Pedir un viaje" onPress={() => router.push('/home')} /> : null}
    </View>
  );
}

/** Historial de viajes: filtros, scroll infinito, pull to refresh y estado vacío. */
export function TripHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, filter, setFilter, isLoading, isLoadingMore, isRefreshing, error, loadMore, refresh, retry } =
    useTripHistory();

  // Se calcula una vez por montaje: alcanza para que "Hoy" / "Ayer" tengan sentido en la sesión.
  const [now] = useState(() => new Date());

  const goToTrip = (item: TripHistoryItem) => {
    if (!FINISHED_TRIP_STATUSES.includes(item.status)) {
      router.push({ pathname: '/trip/[tripId]', params: { tripId: item.id } });
      return;
    }
    router.push({ pathname: '/trips/[tripId]', params: { tripId: item.id } });
  };

  return (
    <View className="flex-1 bg-obsidian px-5" style={{ paddingTop: insets.top + 16 }}>
      <Typography variant="h2" className="mb-4">
        Tus viajes
      </Typography>

      <FilterChips value={filter} onChange={setFilter} />

      <View className="mt-4 flex-1">
        {isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : error && items.length === 0 ? (
          <View className="gap-4 rounded-2xl border border-charcoal bg-surface px-6 py-10">
            <Typography tone="danger" className="text-center">
              {error}
            </Typography>
            <VIPButton title="Reintentar" onPress={retry} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripHistoryCard item={item} now={now} onPress={() => goToTrip(item)} />}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.gold} colors={[colors.gold]} />
            }
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListEmptyComponent={<EmptyState filter={filter} />}
            ListFooterComponent={
              isLoadingMore ? (
                <View className="items-center py-4">
                  <ActivityIndicator color={colors.gold} />
                </View>
              ) : error && items.length > 0 ? (
                <View className="items-center gap-3 py-4">
                  <Typography tone="danger" variant="caption" className="text-center">
                    {error}
                  </Typography>
                  <Pressable accessibilityRole="button" onPress={retry}>
                    <Typography weight="semibold" tone="accent">
                      Reintentar
                    </Typography>
                  </Pressable>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}
