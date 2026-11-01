import { createAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

const SOUNDS = {
  brown: require('../../assets/sounds/brown-noise.m4a'),
  pink: require('../../assets/sounds/pink-noise.m4a'),
};

const LINES = [
  'Working alongside you.',
  'Still here. Keep going.',
  'One small step at a time.',
  'You don’t have to finish — just continue.',
  'Nice and steady.',
  'Your phone can wait. I’ve got the time.',
];

/**
 * Body doubling: many people with ADHD focus better when someone else is quietly working nearby.
 * This keeps the screen on (so the phone can sit on the desk like a lamp), shows a softly breathing
 * companion with the occasional encouraging line, and can play gentle ambient noise.
 */
export function BodyDouble({ sound }: { sound: 'off' | 'brown' | 'pink' }) {
  useKeepAwake();
  const { accent, accentSoft } = useTheme();
  const reduceMotion = useReducedMotion();
  const [line, setLine] = useState(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % LINES.length), 90_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    // ~6 breaths a minute — slow enough to calm, like a resting companion.
    breathe.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [breathe, reduceMotion]);

  const orb = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + breathe.get() * 0.2 }],
    opacity: 0.55 + breathe.get() * 0.45,
  }));
  const halo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.get() * 0.45 }],
    opacity: 0.35 - breathe.get() * 0.25,
  }));

  return (
    <View style={styles.wrap} accessibilityLabel="Body double is on. The screen will stay awake.">
      <View style={styles.orbBox}>
        <Animated.View style={[styles.halo, { backgroundColor: accentSoft }, halo]} />
        <Animated.View style={[styles.orb, { backgroundColor: accent }, orb]} />
      </View>
      <Animated.View key={line} entering={FadeIn.duration(800)} exiting={FadeOut.duration(400)}>
        <Txt variant="subhead" tone="secondary" align="center">
          {LINES[line]}
        </Txt>
      </Animated.View>
      {sound !== 'off' ? <Ambient source={SOUNDS[sound]} /> : null}
    </View>
  );
}

function Ambient({ source }: { source: number }) {
  useEffect(() => {
    // An imperatively-owned player: created, looped and released with the component.
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0.45;
    player.play();
    return () => {
      try {
        player.remove();
      } catch {
        // Already released.
      }
    };
  }, [source]);
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, marginTop: 8 },
  orbBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  orb: { width: 22, height: 22, borderRadius: 11 },
  halo: { position: 'absolute', width: 56, height: 56, borderRadius: 28 },
});
