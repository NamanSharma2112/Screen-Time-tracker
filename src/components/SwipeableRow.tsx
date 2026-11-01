import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { curves, gestureSpring, timings } from '@/theme/motion';

const THRESHOLD = 110;

/**
 * Swipe left to delete, like iOS Mail. The row tracks the finger 1:1, the trash icon grows as you
 * pull, a haptic tick marks the point of no return, and a fling or a long pull commits.
 */
export function SwipeableRow({
  children,
  onDelete,
  label,
}: {
  children: ReactNode;
  onDelete: () => void;
  label: string;
}) {
  const x = useSharedValue(0);
  const width = useSharedValue(360);
  const armed = useSharedValue(false);

  useAnimatedReaction(
    () => x.get() < -THRESHOLD,
    (now, prev) => {
      if (prev !== null && now !== prev) {
        armed.set(now);
        scheduleOnRN(haptics.rigid);
      }
    },
  );

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-10, 10],
    onUpdate: (e) => {
      x.set(e.translationX < 0 ? e.translationX : e.translationX * 0.15);
    },
    onDeactivate: (e) => {
      if (x.get() < -THRESHOLD || e.velocityX < -900) {
        x.set(
          withTiming(-width.get(), { duration: 220, easing: curves.out }, (finished) => {
            if (finished) scheduleOnRN(onDelete);
          }),
        );
      } else {
        x.set(withSpring(0, { ...gestureSpring, velocity: e.velocityX }));
      }
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const actionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, -40], [0, 1], Extrapolation.CLAMP),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: armed.get()
          ? withTiming(1.15, timings.change)
          : interpolate(x.get(), [-20, -THRESHOLD], [0.7, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View
      onLayout={(e) => width.set(e.nativeEvent.layout.width)}
      accessibilityActions={[{ name: 'delete', label: `Delete ${label}` }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onDelete()}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.action, actionStyle]}>
        <Animated.View style={iconStyle}>
          <Ionicons name="trash" size={22} color="#fff" />
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    backgroundColor: '#FF3B30',
    borderRadius: 18,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 24,
  },
});
