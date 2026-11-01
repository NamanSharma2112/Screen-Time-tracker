import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

type IconName = ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<string, [IconName, IconName]> = {
  index: ['time-outline', 'time'],
  tools: ['sparkles-outline', 'sparkles'],
  analytics: ['bar-chart-outline', 'bar-chart'],
};

/** iOS-style tab bar: instant switch, filled icon + accent for the current tab, hairline on top. */
export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const { colors, accent } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.sheet, borderTopColor: colors.separator, paddingBottom: insets.bottom },
      ]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const label = descriptors[route.key].options.title ?? route.name;
        const [outline, filled] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.item}
            onPress={() => {
              if (focused) return;
              haptics.selection();
              navigateToTab(route.key);
            }}
          >
            <Ionicons name={focused ? filled : outline} size={24} color={focused ? accent : colors.textTertiary} />
            <Txt variant="caption" weight={focused ? '700' : '500'} color={focused ? accent : colors.textTertiary}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
    minHeight: 52,
  },
});
