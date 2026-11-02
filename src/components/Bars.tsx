import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

/**
 * Static chart primitives. Sizes are plain percentages/flex — no measuring pass and no animation —
 * so charts draw in the same frame as the rest of the screen.
 */

/** Thin rounded progress line. */
export function ProgressLine({
  value,
  color,
  height = 4,
  style,
}: {
  value: number;
  color: string;
  height?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: colors.track, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

/** Horizontal stacked bar (e.g. the day's category split). */
export function StackedLine({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string }[];
  height?: number;
}) {
  const { colors } = useTheme();
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <View style={[styles.stack, { height, borderRadius: height / 2, backgroundColor: colors.track }]}>
      {total > 0
        ? segments
            .filter((s) => s.value > 0)
            .map((s, i) => <View key={i} style={{ flex: s.value / total, backgroundColor: s.color, height }} />)
        : null}
    </View>
  );
}

/** A vertical bar (bottom-anchored); `children` are the stacked segments, bottom → top. */
export function RiseBar({
  height,
  width,
  radius,
  children,
  dim,
}: {
  height: number;
  delay?: number;
  width: number;
  radius: number;
  children: ReactNode;
  dim?: boolean;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        flexDirection: 'column-reverse',
        opacity: dim ? 0.38 : 1,
      }}
    >
      {children}
    </View>
  );
}

/** A pill bar centred on its line, like an audio waveform. */
export function WaveBar({ height, width, color }: { height: number; delay?: number; width: number; color: string }) {
  return <View style={{ width, height, borderRadius: width / 2, backgroundColor: color }} />;
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', overflow: 'hidden', gap: 2 },
});
