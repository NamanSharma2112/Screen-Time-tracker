import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';

import { BODY, COOKIE, EAR_L, EAR_R, eyes, face, PAWS, PAWS_UP, SPARKLE, type Mood } from './art';

const inOut = Easing.inOut(Easing.sin);
const out = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  size: number;
  /** Base mood from the session's progress. */
  mood: Mood;
  /** How many cookies have been earned; each increase plays the feeding animation once. */
  feeds: number;
  /** Timer finished: hop, paws up, sparkles. */
  celebrating: boolean;
};

/**
 * The Focus Buddy: a hamster that lives on the focus screen.
 *
 * Every layer is a static SVG drawn once; all motion is transform/opacity on Animated.Views, run on
 * the UI thread — so it stays smooth on mid-range Android. Idle loops use deliberately
 * non-syncing durations (breath 2.6 s, sway 3.4 s, blink ~4 s, ear twitches 5.3 s / 7.1 s) so the
 * character reads as alive rather than mechanical.
 */
export const FocusBuddy = memo(function FocusBuddy({ size, mood, feeds, celebrating }: Props) {
  const reduceMotion = useReducedMotion();
  const [eating, setEating] = useState(false);
  const shown: Mood = eating ? 'eating' : celebrating ? 'overjoyed' : mood;

  // Static artwork, built once per size/mood.
  const layers = useMemo(() => ({ body: BODY, earL: EAR_L, earR: EAR_R, paws: PAWS, pawsUp: PAWS_UP }), []);
  const faceXml = useMemo(() => face(shown), [shown]);
  const eyesXml = useMemo(() => eyes(shown), [shown]);

  // ---------- ambient life ----------
  const breathe = useSharedValue(0);
  const sway = useSharedValue(0);
  const blink = useSharedValue(1);
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breathe.set(withRepeat(withTiming(1, { duration: 2600, easing: inOut }), -1, true));
    sway.set(withRepeat(withTiming(1, { duration: 3400, easing: inOut }), -1, true));
    blink.set(
      withDelay(
        1200,
        withRepeat(
          withSequence(withDelay(3700, withTiming(0.08, { duration: 70 })), withTiming(1, { duration: 110 })),
          -1,
        ),
      ),
    );
    const twitch = (v: typeof earL, wait: number, dir: number) =>
      v.set(
        withRepeat(
          withSequence(
            withDelay(wait, withTiming(-16 * dir, { duration: 80 })),
            withTiming(7 * dir, { duration: 90 }),
            withTiming(-3 * dir, { duration: 90 }),
            withTiming(0, { duration: 140 }),
          ),
          -1,
        ),
      );
    twitch(earL, 5300, 1);
    twitch(earR, 7100, -1);
    return () => [breathe, sway, blink, earL, earR].forEach((v) => cancelAnimation(v));
  }, [reduceMotion, breathe, sway, blink, earL, earR]);

  // ---------- mood change: a small happy "pop" ----------
  const pop = useSharedValue(1);
  const firstMood = useRef(true);
  useEffect(() => {
    if (firstMood.current) {
      firstMood.current = false;
      return;
    }
    if (reduceMotion) return;
    pop.set(
      withSequence(withTiming(1.06, { duration: 140, easing: out }), withTiming(1, { duration: 260, easing: inOut })),
    );
  }, [shown, pop, reduceMotion]);

  // ---------- feeding: cookie arcs in, then chew ----------
  const cookieP = useSharedValue(0);
  const cookieO = useSharedValue(0);
  const chew = useSharedValue(0);
  const lastFeeds = useRef(feeds);
  useEffect(() => {
    if (feeds <= lastFeeds.current) {
      lastFeeds.current = feeds;
      return;
    }
    lastFeeds.current = feeds;
    const finishChewing = () => setEating(false);
    const startChewing = () => {
      setEating(true);
      haptics.light();
      if (reduceMotion) {
        setTimeout(finishChewing, 900);
        return;
      }
      chew.set(
        withSequence(
          ...Array.from({ length: 5 }, () =>
            withSequence(
              withTiming(1, { duration: 120, easing: inOut }),
              withTiming(0, { duration: 120, easing: inOut }),
            ),
          ),
          withTiming(0, { duration: 10 }, (done) => {
            if (done) scheduleOnRN(finishChewing);
          }),
        ),
      );
    };
    if (reduceMotion) {
      startChewing();
      return;
    }
    cookieP.set(0);
    cookieO.set(withSequence(withTiming(1, { duration: 120 }), withDelay(440, withTiming(0, { duration: 80 }))));
    cookieP.set(
      withTiming(1, { duration: 560, easing: out }, (done) => {
        if (done) scheduleOnRN(startChewing);
      }),
    );
  }, [feeds, reduceMotion, chew, cookieP, cookieO]);

  // ---------- celebration: hops + sparkles ----------
  const hop = useSharedValue(0);
  const sparkle = useSharedValue(0);
  useEffect(() => {
    if (!celebrating) {
      sparkle.set(withTiming(0, { duration: 200 }));
      return;
    }
    haptics.success();
    sparkle.set(withTiming(1, { duration: 250 }));
    if (reduceMotion) return;
    // Three happy hops, each a little smaller, then settle.
    hop.set(
      withSequence(
        withTiming(-22, { duration: 220, easing: out }),
        withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
        withTiming(-14, { duration: 190, easing: out }),
        withTiming(0, { duration: 210, easing: Easing.in(Easing.quad) }),
        withTiming(-7, { duration: 160, easing: out }),
        withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [celebrating, hop, sparkle, reduceMotion]);

  // ---------- styles (UI thread) ----------
  const whole = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.get() }, { rotate: `${(sway.get() - 0.5) * 2.4}deg` }, { scale: pop.get() }],
  }));
  const body = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + breathe.get() * 0.022 }, { scaleX: 1 - breathe.get() * 0.008 }],
  }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.get() }] }));
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: chew.get() * 2.4 * (size / 200) }] }));
  const earLStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${earL.get()}deg` }] }));
  const earRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${earR.get()}deg` }] }));
  const cookieStyle = useAnimatedStyle(() => {
    const p = cookieP.get();
    const k = size / 200;
    // From the lower right, up in an arc, into the paws at the chest.
    const x = (1 - p) * 90 * k;
    const y = (1 - p) * 60 * k - Math.sin(p * Math.PI) * 46 * k;
    return {
      opacity: cookieO.get(),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${(1 - p) * 220}deg` }, { scale: 0.85 + p * 0.15 }],
    };
  });
  const sparkleStyle = useAnimatedStyle(() => ({ opacity: sparkle.get() }));

  const S = size;
  const cookieSize = 40 * (S / 200);
  return (
    <View
      style={{ width: S, height: S }}
      accessibilityRole="image"
      accessibilityLabel={`Your focus buddy looks ${shown}`}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.bottomOrigin, whole]}>
        {/* ears sit behind the head and twitch from their base */}
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '33% 36%' }, earLStyle]}>
          <SvgXml xml={layers.earL} width={S} height={S} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '67% 36%' }, earRStyle]}>
          <SvgXml xml={layers.earR} width={S} height={S} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.bottomOrigin, body]}>
          <SvgXml xml={layers.body} width={S} height={S} />
          {shown === 'eating' ? (
            <View style={{ position: 'absolute', left: S * 0.4, top: S * 0.61, width: cookieSize, height: cookieSize }}>
              <SvgXml xml={COOKIE} width={cookieSize} height={cookieSize} />
            </View>
          ) : null}
          <View style={StyleSheet.absoluteFill}>
            <SvgXml xml={celebrating && !eating ? layers.pawsUp : layers.paws} width={S} height={S} />
          </View>
          {eyesXml ? (
            <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 42%' }, eyesStyle]}>
              <SvgXml xml={eyesXml} width={S} height={S} />
            </Animated.View>
          ) : null}
          <Animated.View style={[StyleSheet.absoluteFill, faceStyle]}>
            <SvgXml xml={faceXml} width={S} height={S} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* the cookie on its way in */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: S * 0.4, top: S * 0.61, width: cookieSize, height: cookieSize },
          cookieStyle,
        ]}
      >
        <SvgXml xml={COOKIE} width={cookieSize} height={cookieSize} />
      </Animated.View>

      {celebrating ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, sparkleStyle]}>
          <Sparkle x={0.1} y={0.16} size={S * 0.12} period={1300} reduce={reduceMotion} />
          <Sparkle x={0.8} y={0.08} size={S * 0.1} period={1700} reduce={reduceMotion} />
          <Sparkle x={0.86} y={0.44} size={S * 0.08} period={1100} reduce={reduceMotion} />
          <Sparkle x={0.04} y={0.5} size={S * 0.07} period={1500} reduce={reduceMotion} />
        </Animated.View>
      ) : null}
    </View>
  );
});

/** One twinkling star; each has its own period so they never pulse in unison. */
function Sparkle({
  x,
  y,
  size,
  period,
  reduce,
}: {
  x: number;
  y: number;
  size: number;
  period: number;
  reduce: boolean;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      t.set(1);
      return;
    }
    t.set(withRepeat(withTiming(1, { duration: period, easing: inOut }), -1, true));
    return () => cancelAnimation(t);
  }, [t, period, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + t.get() * 0.55,
    transform: [{ scale: 0.7 + t.get() * 0.35 }, { rotate: `${t.get() * 25}deg` }],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: size, height: size }, style]}
    >
      <SvgXml xml={SPARKLE} width={size} height={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Breathing and hopping pivot on the feet.
  bottomOrigin: { transformOrigin: '50% 92%' },
});
