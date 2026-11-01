import { memo, useEffect, useId, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Mask, Rect } from 'react-native-svg';

import { timings } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Ring = { r: number; count: number; size: number; opacity: number; dash?: boolean };

/** Concentric rings of dots; the inner one uses short radial dashes, outer ones fade away. */
const RINGS: Ring[] = [
  { r: 0.64, count: 44, size: 3.6, opacity: 1, dash: true },
  { r: 0.75, count: 56, size: 2.6, opacity: 0.85 },
  { r: 0.86, count: 66, size: 1.9, opacity: 0.6 },
  { r: 0.97, count: 78, size: 1.4, opacity: 0.38 },
];

type Props = {
  size: number;
  /** 0–1, how much of the dial is lit. */
  progress: number;
  color?: string;
  /** Gently "breathes" the centre, for live/ongoing states. */
  live?: boolean;
  children?: ReactNode;
};

type Dot = { key: string; x: number; y: number; deg: number; size: number; opacity: number; dash?: boolean };

function renderDots(dots: Dot[], fill: string) {
  return dots.map((d) =>
    d.dash ? (
      <Rect
        key={d.key}
        x={-d.size * 0.9}
        y={-d.size / 2}
        width={d.size * 1.8}
        height={d.size}
        rx={d.size / 2.5}
        fill={fill}
        opacity={d.opacity}
        transform={`translate(${d.x} ${d.y}) rotate(${d.deg})`}
      />
    ) : (
      <Circle key={d.key} cx={d.x} cy={d.y} r={d.size / 2} fill={fill} opacity={d.opacity} />
    ),
  );
}

export const DottedDial = memo(function DottedDial({ size, progress, color, live, children }: Props) {
  const { colors, accent, accentSoft } = useTheme();
  const tint = color ?? accent;
  const reduceMotion = useReducedMotion();
  const maskId = `dial${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const c = size / 2;
  const R = size / 2;
  const sweepR = R * 0.8;
  const circumference = 2 * Math.PI * sweepR;

  const dots = useMemo(
    () =>
      RINGS.flatMap((ring, ri) =>
        Array.from({ length: ring.count }, (_, i) => {
          const a = (i / ring.count) * Math.PI * 2 - Math.PI / 2;
          return {
            key: `${ri}-${i}`,
            x: c + Math.cos(a) * R * ring.r,
            y: c + Math.sin(a) * R * ring.r,
            deg: (a * 180) / Math.PI,
            ...ring,
          };
        }),
      ),
    [c, R],
  );

  // ~240 SVG nodes per layer: build them once per colour, not on every render.
  const trackDots = useMemo(() => renderDots(dots, colors.track), [dots, colors.track]);
  const litDots = useMemo(() => renderDots(dots, tint), [dots, tint]);

  // Sweep the lit dots in like an Activity ring filling up.
  const p = useSharedValue(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    p.set(reduceMotion ? target : withTiming(target, timings.reveal));
  }, [progress, reduceMotion, p]);

  const sweepProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - p.value),
  }));

  const breathe = useSharedValue(1);
  useEffect(() => {
    if (!live || reduceMotion) {
      breathe.set(withTiming(1));
      return;
    }
    breathe.set(
      withRepeat(
        withSequence(
          withTiming(1.045, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [live, reduceMotion, breathe]);
  const coreStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  const coreSize = size * 0.54;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
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
          coreStyle,
        ]}
      />
      <Svg width={size} height={size}>
        <Defs>
          <Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
            <AnimatedCircle
              cx={c}
              cy={c}
              r={sweepR}
              stroke="#fff"
              strokeWidth={R * 0.5}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={sweepProps}
              transform={`rotate(-90 ${c} ${c})`}
            />
          </Mask>
        </Defs>
        <G>{trackDots}</G>
        <G mask={`url(#${maskId})`}>{litDots}</G>
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
