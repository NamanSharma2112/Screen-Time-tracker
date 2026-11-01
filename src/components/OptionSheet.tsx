import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, popIn, springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

import { Divider } from './Surfaces';
import { Txt } from './Txt';

export type Option<T> = { value: T; label: string; detail?: string };

type Props<T> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Used until the sheet has been measured. */
const FALLBACK_HEIGHT = 600;

/**
 * iOS-style bottom sheet. It presents on the iOS sheet curve, tracks the finger 1:1 while dragged
 * (rubber-banding upwards), and on release either springs home or is flung away using the
 * gesture's velocity. The dimmed backdrop is derived from the sheet position — one source of
 * truth, so it stays in sync even when a drag is reversed mid-way.
 */
export function OptionSheet<T extends string | number>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
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
    activeOffsetY: [-8, 8],
    onUpdate: (e) => {
      // Track the finger exactly; resist when pulled past the top.
      y.set(e.translationY > 0 ? e.translationY : e.translationY * 0.2);
    },
    onDeactivate: (e) => {
      const fling = e.velocityY > 600;
      const far = e.translationY > height.value * 0.4;
      if (fling || far) {
        y.set(
          withSpring(height.value, { ...springs.smooth, velocity: e.velocityY }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        y.set(withSpring(0, { ...springs.release, velocity: e.velocityY }));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, height.value], [1, 0], Extrapolation.CLAMP),
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
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={(e) => {
              height.set(e.nativeEvent.layout.height);
            }}
            style={[styles.sheet, { backgroundColor: colors.sheet, paddingBottom: insets.bottom + 12 }, sheetStyle]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.track }]} />
            <Txt variant="headline" align="center" style={styles.title}>
              {title}
            </Txt>
            <View style={[styles.group, { backgroundColor: colors.card }]}>
              {options.map((opt, i) => {
                const selected = opt.value === value;
                return (
                  <View key={String(opt.value)}>
                    {i > 0 ? <Divider inset={16} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        onSelect(opt.value);
                        setTimeout(onClose, 140);
                      }}
                      style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.separator }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Txt variant="body" weight={selected ? '600' : '400'}>
                          {opt.label}
                        </Txt>
                        {opt.detail ? (
                          <Txt variant="footnote" tone="secondary">
                            {opt.detail}
                          </Txt>
                        ) : null}
                      </View>
                      {selected ? (
                        <Animated.View entering={popIn()}>
                          <Ionicons name="checkmark" size={20} color={accent} />
                        </Animated.View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 12 },
  title: { marginBottom: 16 },
  group: { borderRadius: 18, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 16, paddingVertical: 10 },
});
