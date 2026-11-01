import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { springs, timings } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

/**
 * Animates 0 → `target` (and between targets). Everything in this file animates only
 * `transform`/`opacity`, so the reveal runs on the UI thread without triggering layout.
 */
export function useGrow(target: number, delay = 0, config: WithTimingConfig = timings.reveal) {
  const reduceMotion = useReducedMotion();
  const v = useSharedValue(reduceMotion ? target : 0);
  useEffect(() => {
    v.set(reduceMotion ? target : withDelay(delay, withTiming(target, config)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay, reduceMotion, v]);
  return v;
}

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(e.nativeEvent.layout.width)];
}

/** Thin rounded progress line; the fill slides in from the left. */
export function ProgressLine({
  value,
  color,
  height = 4,
  delay = 0,
  style,
}: {
  value: number;
  color: string;
  height?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [width, onLayout] = useWidth();
  const v = useGrow(Math.max(0, Math.min(1, value)), delay);
  // Hidden until measured so the first frame never flashes a full bar.
  const fill = useAnimatedStyle(() => ({
    opacity: width ? 1 : 0,
    transform: [{ translateX: -width * (1 - v.value) }],
  }));
  return (
    <View
      onLayout={onLayout}
      style={[{ height, borderRadius: height / 2, backgroundColor: colors.track, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

/** Horizontal stacked bar (e.g. the day's category split) revealed left → right. */
export function StackedLine({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string }[];
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, onLayout] = useWidth();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const v = useGrow(1, 150);
  const style = useAnimatedStyle(() => ({
    opacity: width ? 1 : 0,
    transform: [{ translateX: -width * (1 - v.value) }],
  }));
  return (
    <View
      onLayout={onLayout}
      style={[styles.stackTrack, { height, borderRadius: height / 2, backgroundColor: colors.track }]}
    >
      <Animated.View style={[styles.stackInner, { borderRadius: height / 2 }, style]}>
        {total > 0
          ? segments
              .filter((s) => s.value > 0)
              .map((s, i) => <View key={i} style={{ flex: s.value / total, backgroundColor: s.color, height }} />)
          : null}
      </Animated.View>
    </View>
  );
}

/**
 * A vertical bar that rises out of the baseline: the fixed-size slot clips a fully rounded bar
 * that slides up into place, so the rounded top is intact for the whole animation.
 */
export function RiseBar({
  height,
  delay,
  width,
  radius,
  children,
  dim,
}: {
  height: number;
  delay: number;
  width: number;
  radius: number;
  children: ReactNode;
  dim?: boolean;
}) {
  const p = useGrow(1, delay, { ...timings.reveal, duration: 650 });
  const o = useSharedValue(dim ? 0.38 : 1);
  useEffect(() => {
    o.set(withSpring(dim ? 0.38 : 1, springs.smooth));
  }, [dim, o]);
  const slot = useAnimatedStyle(() => ({ opacity: o.value }));
  const bar = useAnimatedStyle(() => ({ transform: [{ translateY: height * (1 - p.value) }] }));
  return (
    <Animated.View style={[{ width, height, overflow: 'hidden' }, slot]}>
      <Animated.View
        style={[{ width, height, borderRadius: radius, overflow: 'hidden', flexDirection: 'column-reverse' }, bar]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

/** A pill bar that grows symmetrically from its centre line, like an audio waveform. */
export function WaveBar({
  height,
  delay,
  width,
  color,
}: {
  height: number;
  delay: number;
  width: number;
  color: string;
}) {
  const p = useGrow(1, delay, { ...timings.reveal, duration: 550 });
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: p.value }] }));
  return <Animated.View style={[{ width, height, borderRadius: width / 2, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  stackTrack: { overflow: 'hidden' },
  stackInner: { flexDirection: 'row', height: '100%', gap: 2, overflow: 'hidden' },
});
