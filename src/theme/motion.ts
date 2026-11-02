import { useCallback, useEffect, useRef, useState } from 'react';

import { Easing, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Motion tokens.
 * - Taps, toggles and selections use short, eased *timings*: they finish in a fixed, tiny amount of
 *   time, so the UI is settled the moment your finger lifts. (Springs keep moving while they settle,
 *   which reads as lag — especially on a busy JS thread.)
 * - Springs are kept only for releasing a drag, where carrying the finger's velocity matters.
 * - Nothing grows from scale(0); only transform/opacity animate on the hot path.
 */
export const curves = {
  /** Strong ease-out: fast start, gentle settle. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** iOS sheet curve — extremely steep start, gentle settle. */
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
  /** Things already on screen moving between states. */
  inOut: Easing.bezier(0.645, 0.045, 0.355, 1),
};

export const timings = {
  /** Finger down: near-instant. */
  press: { duration: 80, easing: curves.out },
  /** Finger up. */
  release: { duration: 140, easing: curves.out },
  /** Selection, toggle, colour or value change. */
  change: { duration: 180, easing: curves.out },
  /** Fast snap-back, e.g. releasing a hold early. */
  snap: { duration: 160, easing: curves.out },
  /** Data reveal: rings, dial, bars filling up. */
  reveal: { duration: 600, easing: curves.out },
} satisfies Record<string, WithTimingConfig>;

/** Releasing a drag (sheets, swipe rows, day swipe): critically damped, no wobble. */
export const gestureSpring = { duration: 280, dampingRatio: 1 } satisfies WithSpringConfig;

/**
 * Screen sections render immediately with no entrance animation: on mid-range Android phones,
 * dozens of simultaneous layout animations during a screen transition were the main source of
 * dropped frames. Returns `undefined` so existing `entering={enter(i)}` call sites are no-ops.
 */
export function useEntering() {
  return useCallback((_index = 0): undefined => undefined, []);
}

/** Entrance for a small element that appears in place (icon, checkmark): scale 0.9 → 1 + fade. */
export const popIn = (_delay = 0): undefined => undefined;

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
