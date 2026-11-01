import { haptics } from '@/lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withAlpha } from '@/theme/colors';
import { springs, timings } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      haptic="light"
      scaleTo={0.97}
      style={[styles.button, { backgroundColor: colors.primaryButton, opacity: disabled ? 0.4 : 1 }]}
    >
      <ButtonSheen />
      <Txt variant="callout" weight="600" tone="inverse">
        {label}
      </Txt>
    </PressableScale>
  );
}

/**
 * Press-and-hold confirmation. Timing is deliberately asymmetric: while held, the fill sweeps
 * across *linearly* (it visualises time passing) with haptic ticks that build up; let go early
 * and it snaps back fast. Completion lands with a success haptic.
 */
export function HoldButton({
  label,
  onComplete,
  duration = 1200,
}: {
  label: string;
  onComplete: () => void;
  duration?: number;
}) {
  const { colors, accent } = useTheme();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const pressed = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -width * (1 - progress.value) }] }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.03 * pressed.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold to confirm"
      onPressIn={() => {
        done.current = false;
        pressed.set(withSpring(1, springs.press));
        progress.set(withTiming(1, { duration, easing: Easing.linear }));
        haptics.light();
        // Ticks speed up as the fill approaches the end.
        [0.3, 0.5, 0.65, 0.78, 0.88, 0.95].forEach((f) =>
          timers.current.push(setTimeout(() => (f > 0.8 ? haptics.medium() : haptics.light()), duration * f)),
        );
        timers.current.push(
          setTimeout(() => {
            done.current = true;
            haptics.success();
            pressed.set(withSpring(0, springs.release));
            onComplete();
            timers.current.push(setTimeout(() => progress.set(withTiming(0, timings.change)), 450));
          }, duration),
        );
      }}
      onPressOut={() => {
        if (done.current) return;
        clear();
        pressed.set(withSpring(0, springs.release));
        progress.set(withTiming(0, timings.snap));
      }}
      // Screen readers can't hold, so a double-tap activates directly.
      onAccessibilityTap={onComplete}
    >
      <Animated.View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.button, { backgroundColor: colors.primaryButton }, scaleStyle]}
      >
        <Animated.View style={[styles.fill, { backgroundColor: accent, opacity: width ? 0.9 : 0 }, fillStyle]} />
        <ButtonSheen />
        <Txt variant="callout" weight="600" tone="inverse">
          {label}
        </Txt>
      </Animated.View>
    </Pressable>
  );
}

/** Subtle top highlight that gives the black pill its glassy depth. */
function ButtonSheen() {
  const { scheme } = useTheme();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={
        scheme === 'dark'
          ? ['rgba(255,255,255,0.0)', 'rgba(0,0,0,0.06)']
          : ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']
      }
      style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
    />
  );
}

/** Pins its children to the bottom of the screen above a soft fade, like iOS toolbars. */
export function BottomBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.bottomBar} pointerEvents="box-none">
      <LinearGradient pointerEvents="none" colors={[withAlpha(colors.sheet, 0), colors.sheet]} style={styles.fade} />
      <View
        style={{ backgroundColor: colors.sheet, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {children}
      </View>
    </View>
  );
}

export const BOTTOM_BAR_SPACE = 120;

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { height: 32 },
});
