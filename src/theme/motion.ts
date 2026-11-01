import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInDown,
  Keyframe,
  ReduceMotion,
  useReducedMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/**
 * Motion tokens. Principles (Apple HIG + animations.dev):
 * - Springs settle without overshoot by default — bounce is reserved for tiny elements.
 * - Entrances use a strong ease-out; nothing grows from scale(0).
 * - Press feedback is felt, not seen (scale ≈ 0.97, ~150ms).
 * - Only transform/opacity animate on the hot path.
 */
export const curves = {
  /** Strong ease-out for entrances and data reveals. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** iOS sheet curve — extremely steep start, gentle settle. */
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
  /** Things already on screen moving between states. */
  inOut: Easing.bezier(0.645, 0.045, 0.355, 1),
};

export const springs = {
  /** Default UI spring — no overshoot. */
  smooth: { duration: 450, dampingRatio: 1 },
  /** Press-in: quick and felt. */
  press: { duration: 160, dampingRatio: 1 },
  /** Release after a press. */
  release: { duration: 320, dampingRatio: 1 },
  /** Small elements only (swatches, checkmarks) — a hint of life. */
  pop: { duration: 400, dampingRatio: 0.72 },
} satisfies Record<string, WithSpringConfig>;

export const timings = {
  /** Data reveal: rings, dial, bars filling up. Long because it's large and seen once per screen. */
  reveal: { duration: 900, easing: curves.out },
  /** Value changes on screen (switching days). */
  change: { duration: 420, easing: curves.inOut },
  /** Fast snap-back, e.g. releasing a hold early. */
  snap: { duration: 200, easing: curves.out },
} satisfies Record<string, WithTimingConfig>;

/**
 * Staggered entrance for a screen's sections. The first (most important) items travel further
 * and arrive first; later ones travel less, so the hierarchy reads top-down instead of uniform.
 * With Reduce Motion on, sections simply fade — the meaning stays, the movement goes.
 */
export function useEntering() {
  const reduceMotion = useReducedMotion();
  // Builders are created once and reused rather than handing Reanimated a new object every render.
  const builders = useMemo(
    () => Array.from({ length: MAX_STAGGER + 1 }, (_, i) => buildEntering(i, reduceMotion)),
    [reduceMotion],
  );
  return useCallback((index = 0) => builders[Math.min(index, MAX_STAGGER)], [builders]);
}

const MAX_STAGGER = 10;

function buildEntering(index: number, reduceMotion: boolean) {
  const delay = 40 + index * 45;
  if (reduceMotion) return FadeIn.duration(200).delay(delay).reduceMotion(ReduceMotion.Never);
  const base = FadeInDown.duration(520).easing(curves.out).delay(delay);
  // Reanimated's web backend pins views with custom initial values to an absolute snapshot after
  // the animation, breaking layout on re-render — so the web build uses the stock preset.
  if (Platform.OS === 'web') return base;
  const distance = Math.max(4, 16 - index * 2);
  return base.withInitialValues({ opacity: 0, transform: [{ translateY: distance }] });
}

/** Entrance for a small element that appears in place (icon, checkmark): scale 0.9 → 1 + fade. */
export const popIn = (delay = 0) =>
  Platform.OS === 'web'
    ? FadeIn.duration(250).delay(delay) // see buildEntering: custom web animations misbehave
    : new Keyframe({
        0: { opacity: 0, transform: [{ scale: 0.9 }] },
        100: { opacity: 1, transform: [{ scale: 1 }], easing: curves.out },
      })
        .duration(380)
        .delay(delay);

/**
 * Tweens a number on the JS thread (for text that counts up/down).
 * Only one Text re-renders, so the per-frame cost is negligible. Respects Reduce Motion.
 */
export function useTween(target: number, duration = 600): number {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      current.current = from + (target - from) * eased;
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduceMotion]);

  return reduceMotion ? target : value;
}
