import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

type Ring = { r: number; count: number; size: number; opacity: number; dash?: boolean };

/**
 * Concentric rings of dots; the inner one uses short radial dashes, outer ones fade away.
 * Tuned for Android: fewer dots than before, and a single static SVG layer (no mask, no per-frame
 * animated props), so drawing it costs one pass.
 */
const RINGS: Ring[] = [
  { r: 0.64, count: 40, size: 3.6, opacity: 1, dash: true },
  { r: 0.77, count: 48, size: 2.4, opacity: 0.8 },
  { r: 0.9, count: 56, size: 1.6, opacity: 0.45 },
];

type Props = {
  size: number;
  /** 0–1, how much of the dial is lit. */
  progress: number;
  color?: string;
  /** Kept for API compatibility; the dial no longer animates. */
  live?: boolean;
  children?: ReactNode;
};

export const DottedDial = memo(function DottedDial({ size, progress, color, children }: Props) {
  const { colors, accent, accentSoft } = useTheme();
  const tint = color ?? accent;
  const c = size / 2;
  const R = size / 2;
  const scale = size / 268;
  // Quantise so tiny changes (a few seconds of screen time) don't redraw the SVG.
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * 200) / 200;

  const dots = useMemo(
    () =>
      RINGS.flatMap((ring, ri) =>
        Array.from({ length: ring.count }, (_, i) => {
          const frac = i / ring.count;
          const a = frac * Math.PI * 2 - Math.PI / 2;
          const x = c + Math.cos(a) * R * ring.r;
          const y = c + Math.sin(a) * R * ring.r;
          const fill = frac < lit ? tint : colors.track;
          const s = ring.size * Math.max(0.6, scale);
          return ring.dash ? (
            <Rect
              key={`${ri}-${i}`}
              x={-s * 0.9}
              y={-s / 2}
              width={s * 1.8}
              height={s}
              rx={s / 2.5}
              fill={fill}
              opacity={ring.opacity}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})`}
            />
          ) : (
            <Circle key={`${ri}-${i}`} cx={x} cy={y} r={s / 2} fill={fill} opacity={ring.opacity} />
          );
        }),
      ),
    [c, R, scale, lit, tint, colors.track],
  );

  const coreSize = size * 0.54;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            left: c - coreSize / 2,
            top: c - coreSize / 2,
            backgroundColor: accentSoft,
          },
        ]}
      />
      <Svg width={size} height={size}>
        {dots}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  core: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
