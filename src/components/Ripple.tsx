import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { curves } from '@/theme/motion';

/** A one-shot celebration: soft rings expand out of the dial when a session completes. */
export function Ripple({ size, color, trigger }: { size: number; color: string; trigger: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || trigger === 0) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {[0, 1, 2].map((i) => (
        <Ring key={`${trigger}-${i}`} size={size} color={color} delay={i * 160} />
      ))}
    </View>
  );
}

function Ring({ size, color, delay }: { size: number; color: string; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration: 1100, easing: curves.out })));
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - p.get()) * 0.5,
    transform: [{ scale: 0.6 + p.get() * 0.55 }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
