import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { timings } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const W = 51;
const H = 31;
const KNOB = 27;

/** iOS-style switch. The knob slides (transform only); the track colour switches instantly. */
export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors, accent } = useTheme();
  const x = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    x.set(withTiming(value ? 1 : 0, timings.change));
  }, [value, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * (W - KNOB - 4) }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      unstable_pressDelay={0}
      onPress={() => {
        haptics.light();
        onChange(!value);
      }}
    >
      <View style={[styles.track, { backgroundColor: value ? accent : colors.track }]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, padding: 2 },
  knob: {
    width: KNOB,
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
