import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/useTheme';

import { Card, Sheet } from './Surfaces';

/**
 * Placeholder shapes shown while data loads. The whole group shares ONE gentle opacity pulse
 * (a single animated value on the UI thread), rather than a shimmer per block — cheap on Android.
 */
export function SkeletonPulse({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    o.set(withRepeat(withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [o, reduceMotion]);
  const pulse = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View style={[styles.fill, style, pulse]} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {children}
    </Animated.View>
  );
}

export function Bone({
  w = '100%',
  h = 14,
  r = 7,
  style,
}: {
  w?: DimensionValue;
  h?: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.track }, style]} />;
}

function RowBones({ rows, icon = true }: { rows: number; icon?: boolean }) {
  return (
    <Card>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          {icon ? <Bone w={40} h={40} r={11} /> : null}
          <View style={{ flex: 1, gap: 8 }}>
            <Bone w="55%" h={13} />
            <Bone w="35%" h={10} />
          </View>
          <Bone w={44} h={13} />
        </View>
      ))}
    </Card>
  );
}

/** Today: dial + summary cards + app list. */
export function TodaySkeleton() {
  return (
    <SkeletonPulse>
      <View style={styles.dialWrap}>
        <Bone w={220} h={220} r={110} />
        <Bone w={190} h={12} style={{ marginTop: 24 }} />
        <Bone w={140} h={12} style={{ marginTop: 8 }} />
      </View>
      <Sheet>
        <Card style={styles.stats}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.stat}>
              <Bone w={56} h={16} />
              <Bone w={70} h={10} />
            </View>
          ))}
        </Card>
        <RowBones rows={4} />
      </Sheet>
    </SkeletonPulse>
  );
}

/** Insights: headline number + weekly bars + cards. */
export function InsightsSkeleton() {
  return (
    <SkeletonPulse>
      <View style={styles.head}>
        <Bone w={90} h={11} />
        <Bone w={160} h={30} r={10} />
        <Bone w={200} h={11} />
      </View>
      <View style={styles.bars}>
        {[0.55, 0.8, 0.6, 0.9, 0.5, 0.7, 0.4].map((f, i) => (
          <Bone key={i} w={20} h={130 * f} r={7} />
        ))}
      </View>
      <Sheet>
        <RowBones rows={4} icon={false} />
        <RowBones rows={3} />
      </Sheet>
    </SkeletonPulse>
  );
}

/** Generic detail page: icon + title + chart + list. */
export function DetailSkeleton() {
  return (
    <SkeletonPulse>
      <View style={styles.head}>
        <Bone w={76} h={76} r={20} />
        <Bone w={120} h={26} r={9} />
        <Bone w={80} h={11} />
      </View>
      <View style={styles.bars}>
        {[0.5, 0.7, 0.45, 0.8, 0.6, 0.3, 0.55].map((f, i) => (
          <Bone key={i} w={20} h={110 * f} r={7} />
        ))}
      </View>
      <Sheet>
        <RowBones rows={4} icon={false} />
      </Sheet>
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  // Let the skeleton's sheet stretch to the bottom like the real one.
  fill: { flexGrow: 1 },
  dialWrap: { alignItems: 'center', marginTop: 44, marginBottom: 32 },
  stats: { flexDirection: 'row', paddingVertical: 18 },
  stat: { flex: 1, alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  head: { alignItems: 'center', gap: 10, marginTop: 16 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 28,
  },
});
