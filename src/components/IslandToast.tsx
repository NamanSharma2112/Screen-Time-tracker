import Ionicons from '@expo/vector-icons/Ionicons';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { curves, springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

type ToastInput = {
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  tone?: 'accent' | 'success' | 'neutral';
  /** ms on screen once expanded. */
  duration?: number;
  haptic?: 'success' | 'light' | 'none';
};

const ToastContext = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const PILL_W = 126;
const PILL_H = 37;
const OPEN_H = 64;
/** The island is alive: it may overshoot a little, unlike the rest of the UI. */
const ISLAND_SPRING = { duration: 550, dampingRatio: 0.72 };

/**
 * A Dynamic-Island–style notification. It grows out of a small pill at the top of the screen
 * into a banner, its content fading in once there's room, then folds back into the pill and fades.
 * Swipe it up to dismiss early. Always black — the island is a piece of hardware, not a theme.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { accent } = useTheme();
  const reduceMotion = useReducedMotion();
  const [toast, setToast] = useState<ToastInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openW = Math.min(screenW - 24, 380);
  const w = useSharedValue(PILL_W);
  const h = useSharedValue(PILL_H);
  const shown = useSharedValue(0);
  const content = useSharedValue(0);
  const dragY = useSharedValue(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const collapse = useCallback(() => {
    clearTimer();
    content.set(withTiming(0, { duration: 120 }));
    w.set(withDelay(80, withSpring(PILL_W, springs.smooth)));
    h.set(withDelay(80, withSpring(PILL_H, springs.smooth)));
    shown.set(
      withDelay(
        300,
        withTiming(0, { duration: 200, easing: curves.out }, (finished) => {
          if (finished) scheduleOnRN(setToast, null);
        }),
      ),
    );
  }, [content, h, shown, w]);

  const show = useCallback(
    (t: ToastInput) => {
      clearTimer();
      setToast(t);
      if (t.haptic === 'success') haptics.success();
      else if (t.haptic !== 'none') haptics.light();
      AccessibilityInfo.announceForAccessibility(t.subtitle ? `${t.title}. ${t.subtitle}` : t.title);

      dragY.set(0);
      if (reduceMotion) {
        w.set(openW);
        h.set(OPEN_H);
        shown.set(withTiming(1, { duration: 150 }));
        content.set(withTiming(1, { duration: 150 }));
      } else {
        // Appear as the pill, then bloom outward.
        w.set(PILL_W);
        h.set(PILL_H);
        shown.set(withTiming(1, { duration: 120 }));
        w.set(withDelay(60, withSpring(openW, ISLAND_SPRING)));
        h.set(withDelay(60, withSpring(OPEN_H, ISLAND_SPRING)));
        content.set(withDelay(200, withTiming(1, { duration: 200, easing: curves.out })));
      }
      timer.current = setTimeout(collapse, t.duration ?? 2600);
    },
    [collapse, content, dragY, h, openW, reduceMotion, shown, w],
  );

  useEffect(() => () => clearTimer(), []);

  const pan = usePanGesture({
    activeOffsetY: [-6, 6],
    onUpdate: (e) => {
      // Upwards follows the finger; downwards resists.
      dragY.set(e.translationY < 0 ? e.translationY : e.translationY * 0.15);
    },
    onDeactivate: (e) => {
      if (e.translationY < -24 || e.velocityY < -500) {
        dragY.set(withSpring(-120, { ...springs.smooth, velocity: e.velocityY }));
        shown.set(
          withTiming(0, { duration: 180 }, (finished) => {
            if (finished) scheduleOnRN(setToast, null);
          }),
        );
      } else {
        dragY.set(withSpring(0, springs.release));
      }
    },
  });

  const islandStyle = useAnimatedStyle(() => ({
    width: w.get(),
    height: h.get(),
    borderRadius: h.get() / 2,
    opacity: shown.get(),
    transform: [{ translateY: dragY.get() }, { scale: 0.92 + shown.get() * 0.08 }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: content.get(),
    transform: [{ scale: 0.96 + content.get() * 0.04 }],
  }));

  const toneColor = toast?.tone === 'success' ? '#34C759' : toast?.tone === 'neutral' ? '#FFFFFF' : accent;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 6 }]}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.island, islandStyle]} accessibilityLiveRegion="polite">
              <Animated.View style={[styles.content, contentStyle]}>
                {toast.icon ? (
                  <View style={[styles.icon, { backgroundColor: `${toneColor}26` }]}>
                    <Ionicons name={toast.icon} size={18} color={toneColor} />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Txt variant="callout" weight="600" color="#fff" numberOfLines={1}>
                    {toast.title}
                  </Txt>
                  {toast.subtitle ? (
                    <Txt variant="footnote" color="rgba(255,255,255,0.65)" numberOfLines={1}>
                      {toast.subtitle}
                    </Txt>
                  ) : null}
                </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  island: {
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
