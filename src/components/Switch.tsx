import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const W = 51;
const H = 31;
const KNOB = 27;
const STRETCH = 7;

/**
 * iOS-style switch (Android's is Material). Like UISwitch, the knob stretches toward the
 * opposite side while your finger is down, then springs across when released.
 */
export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors, accent } = useTheme();
  const on = useSharedValue(value ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    on.set(withSpring(value ? 1 : 0, springs.smooth));
  }, [value, on]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.get(), [0, 1], [colors.track, accent]),
  }));
  const knob = useAnimatedStyle(() => {
    const stretch = pressed.get() * STRETCH;
    const travel = W - KNOB - 4;
    // Grow toward the centre: from the left edge when off, from the right edge when on.
    return { width: KNOB + stretch, transform: [{ translateX: on.get() * (travel - stretch) }] };
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPressIn={() => pressed.set(withSpring(1, springs.press))}
      onPressOut={() => pressed.set(withSpring(0, springs.release))}
      onPress={() => {
        haptics.light();
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, padding: 2 },
  knob: {
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
