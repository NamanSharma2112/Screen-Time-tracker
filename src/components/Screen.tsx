import { useState, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type RefreshControlProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withAlpha } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { BOTTOM_BAR_SPACE, BottomBar } from './Buttons';
import { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';

type Props = {
  header: ScreenHeaderProps;
  children: ReactNode;
  /** Pinned bottom action (e.g. the black pill button). */
  bottom?: ReactNode;
  refreshControl?: (topInset: number) => ReactElement<RefreshControlProps>;
};

/**
 * Standard screen scaffold. The header is pinned; like a UINavigationBar it is transparent at
 * rest and fades in a bar + hairline only once content scrolls underneath it.
 */
export function Screen({ header, children, bottom, refreshControl }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [headerHeight, setHeaderHeight] = useState(insets.top + 64);
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 24], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, flexGrow: 1 }}
        scrollIndicatorInsets={{ top: headerHeight }}
        refreshControl={refreshControl?.(headerHeight)}
      >
        {children}
        {/* Clears the pinned button / home indicator, continuing the sheet colour to the bottom edge. */}
        <View style={{ height: bottom ? BOTTOM_BAR_SPACE - 40 : insets.bottom, backgroundColor: colors.sheet }} />
      </Animated.ScrollView>

      <View
        style={styles.header}
        pointerEvents="box-none"
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: withAlpha(colors.bg, 0.94), borderBottomColor: colors.separator },
            styles.bar,
            barStyle,
          ]}
        />
        <View style={{ paddingTop: insets.top }} pointerEvents="box-none">
          <ScreenHeader {...header} />
        </View>
      </View>

      {bottom ? <BottomBar>{bottom}</BottomBar> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  bar: { borderBottomWidth: StyleSheet.hairlineWidth },
});
