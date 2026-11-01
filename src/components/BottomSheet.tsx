import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

/** Used until the sheet has been measured. */
const FALLBACK_HEIGHT = 600;

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Disable drag-to-dismiss, e.g. while a destructive action is in flight. */
  locked?: boolean;
  /** Turn off the drag gesture (e.g. when the sheet holds its own scrolling content). */
  draggable?: boolean;
};

/**
 * iOS-style bottom sheet. Presents on the iOS sheet curve, tracks the finger 1:1 while dragged
 * (rubber-banding upwards), and on release springs home or is flung away using the gesture's
 * velocity. The dimmed backdrop is derived from the sheet position — one source of truth, so it
 * stays in sync even when a drag is reversed. Rides above the keyboard for text input.
 */
export function BottomSheet({ visible, onClose, title, children, locked, draggable = true }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const keyboard = useAnimatedKeyboard();
  const [mounted, setMounted] = useState(visible);
  const height = useSharedValue(FALLBACK_HEIGHT);
  const y = useSharedValue(FALLBACK_HEIGHT);

  const unmount = () => setMounted(false);
  // Mount as soon as we're asked to show; unmounting waits for the exit animation.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      y.set(height.get());
      y.set(withTiming(0, { duration: reduceMotion ? 0 : 500, easing: curves.sheet }));
    } else if (mounted) {
      // Exits are quicker than entrances: the user already decided.
      y.set(
        withTiming(height.get(), { duration: reduceMotion ? 0 : 260, easing: curves.out }, (finished) => {
          if (finished) scheduleOnRN(unmount);
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = usePanGesture({
    enabled: draggable && !locked,
    activeOffsetY: [-8, 8],
    onUpdate: (e) => {
      y.set(e.translationY > 0 ? e.translationY : e.translationY * 0.2);
    },
    onDeactivate: (e) => {
      if (e.velocityY > 600 || e.translationY > height.get() * 0.4) {
        y.set(
          withSpring(height.get(), { ...springs.smooth, velocity: e.velocityY }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        y.set(withSpring(0, { ...springs.release, velocity: e.velocityY }));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() - keyboard.height.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, height.get()], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={locked ? undefined : onClose}
            accessibilityLabel="Close"
          />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            onLayout={(e) => height.set(e.nativeEvent.layout.height)}
            style={[styles.sheet, { backgroundColor: colors.sheet, paddingBottom: insets.bottom + 12 }, sheetStyle]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.track }]} />
            {title ? (
              <Txt variant="headline" align="center" style={styles.title} accessibilityRole="header">
                {title}
              </Txt>
            ) : null}
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 16, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 12 },
  title: { marginBottom: 16 },
});
