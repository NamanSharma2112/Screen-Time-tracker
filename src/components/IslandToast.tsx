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
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { curves, gestureSpring } from '@/theme/motion';
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

/**
 * A Dynamic-Island–style notification: a black capsule that slides down from the top, stays a
 * moment, then fades away. Swipe it up to dismiss early. Animates only transform + opacity.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { accent } = useTheme();
  const [toast, setToast] = useState<ToastInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const width = Math.min(screenW - 24, 380);
  // One value drives the whole entrance/exit (transform + opacity only — cheap on Android).
  const shown = useSharedValue(0);
  const dragY = useSharedValue(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const hide = useCallback(() => {
    clearTimer();
    shown.set(
      withTiming(0, { duration: 180, easing: curves.out }, (finished) => {
        if (finished) scheduleOnRN(setToast, null);
      }),
    );
  }, [shown]);

  const show = useCallback(
    (t: ToastInput) => {
      clearTimer();
      setToast(t);
      if (t.haptic === 'success') haptics.success();
      else if (t.haptic !== 'none') haptics.light();
      AccessibilityInfo.announceForAccessibility(t.subtitle ? `${t.title}. ${t.subtitle}` : t.title);
      dragY.set(0);
      shown.set(withTiming(1, { duration: 200, easing: curves.out }));
      timer.current = setTimeout(hide, t.duration ?? 2600);
    },
    [dragY, hide, shown],
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
        shown.set(
          withTiming(0, { duration: 150 }, (finished) => {
            if (finished) scheduleOnRN(setToast, null);
          }),
        );
      } else {
        dragY.set(withSpring(0, { ...gestureSpring, velocity: e.velocityY }));
      }
    },
  });

  const style = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateY: dragY.get() + (1 - shown.get()) * -16 }],
  }));

  const toneColor = toast?.tone === 'success' ? '#34C759' : toast?.tone === 'neutral' ? '#FFFFFF' : accent;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 6 }]}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.island, { width }, style]} accessibilityLiveRegion="polite">
              <View style={styles.content}>
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
              </View>
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
    height: 64,
    borderRadius: 32,
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
