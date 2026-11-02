import { useEffect, useState } from 'react';
import { Image, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LEGAL } from '@/legal/config';

/** Must match the native splash in app.json (expo-splash-screen) so the hand-off is invisible. */
const SPLASH_BG = { light: '#F2F2F4', dark: '#000000' };
const SPLASH_IMAGE_WIDTH = 160;

/**
 * In-app launch screen. It takes over from the native splash pixel-for-pixel, then — only if
 * loading takes a moment — reveals the app name and a gentle three-dot loader. As soon as the app
 * is ready it fades out. There is no minimum duration: a fast start is never slowed down.
 */
export function LaunchScreen({ done, onHidden }: { done: boolean; onHidden: () => void }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduceMotion = useReducedMotion();
  const fade = useSharedValue(1);
  const caption = useSharedValue(0);
  const logo = useSharedValue(1);
  const [dots] = useState(() => [0, 1, 2]);

  // If we're still here after a beat, show the name + loader so it never looks frozen.
  useEffect(() => {
    caption.set(withDelay(350, withTiming(1, { duration: 300 })));
    if (!reduceMotion) {
      logo.set(
        withDelay(
          350,
          withRepeat(
            withSequence(
              withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
          ),
        ),
      );
    }
  }, [caption, logo, reduceMotion]);

  useEffect(() => {
    if (!done) return;
    fade.set(
      withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) scheduleOnRN(onHidden);
      }),
    );
  }, [done, fade, onHidden]);

  const root = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const mark = useAnimatedStyle(() => ({ transform: [{ scale: logo.get() }] }));
  const text = useAnimatedStyle(() => ({ opacity: caption.get() }));
  const fg = scheme === 'dark' ? '#F5F5F7' : '#0B0B0F';
  const sub = scheme === 'dark' ? '#9C9CA4' : '#6E6E76';

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: SPLASH_BG[scheme] }, root]}
      pointerEvents={done ? 'none' : 'auto'}
      accessibilityLabel={`${LEGAL.appName} is loading`}
    >
      <Animated.View style={mark}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={{ width: SPLASH_IMAGE_WIDTH, height: SPLASH_IMAGE_WIDTH }}
          fadeDuration={0}
        />
      </Animated.View>
      <Animated.View style={[styles.caption, text]}>
        <Animated.Text style={[styles.name, { color: fg }]}>{LEGAL.appName}</Animated.Text>
        <View style={styles.dots}>
          {dots.map((i) => (
            <Dot key={i} index={i} color={sub} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const reduceMotion = useReducedMotion();
  const o = useSharedValue(0.3);
  useEffect(() => {
    if (reduceMotion) return;
    o.set(
      withDelay(
        index * 160,
        withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1),
      ),
    );
  }, [index, o, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 2000, elevation: 2000 },
  caption: { position: 'absolute', bottom: '22%', alignItems: 'center', gap: 14 },
  name: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
