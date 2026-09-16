import type { Tabs } from 'expo-router';
import { CarFront, Clock, UserRound, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, LucideIcon> = {
  home: CarFront,
  activity: Clock,
  account: UserRound,
};

/** Barra inferior flotante (píldora) del diseño, en lugar de la barra estándar de React Navigation. */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 px-6"
      style={{ bottom: Math.max(insets.bottom, 12) }}
      pointerEvents="box-none"
    >
      <View className="flex-row items-center justify-around rounded-full border border-charcoal bg-surface/95 px-2 py-2">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const descriptor = descriptors[route.key];
          const label = descriptor?.options.title ?? route.name;
          const Icon = TAB_ICONS[route.name] ?? CarFront;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              className="flex-1 items-center gap-1 rounded-full py-2 active:opacity-70"
            >
              <Icon size={20} color={focused ? colors.gold : colors.ash} />
              <Typography variant="caption" weight={focused ? 'semibold' : 'medium'} tone={focused ? 'accent' : 'secondary'}>
                {label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
