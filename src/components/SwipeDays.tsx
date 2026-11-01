import type { ReactNode } from 'react';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { springs } from '@/theme/motion';

type Props = {
  children: ReactNode;
  /** Whether there is a day in each direction. */
  canPrev: boolean;
  canNext: boolean;
  onChange: (dir: -1 | 1) => void;
};

/**
 * Horizontal swipe to page between days, like flicking between days in Apple's Health app.
 * The content follows the finger with resistance, the next day slides in from the side it was
 * pulled from, and at either end it rubber-bands back with a soft "bump" haptic.
 */
export function SwipeDays({ children, canPrev, canNext, onChange }: Props) {
  const dx = useSharedValue(0);

  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      const blocked = (e.translationX < 0 && !canNext) || (e.translationX > 0 && !canPrev);
      dx.set(e.translationX * (blocked ? 0.12 : 0.45));
    },
    onDeactivate: (e) => {
      const dir: -1 | 0 | 1 =
        e.translationX < -60 || e.velocityX < -650 ? 1 : e.translationX > 60 || e.velocityX > 650 ? -1 : 0;
      const allowed = (dir === 1 && canNext) || (dir === -1 && canPrev);
      if (dir !== 0 && allowed) {
        scheduleOnRN(onChange, dir);
        scheduleOnRN(haptics.selection);
        // New day enters from the side the finger came from.
        dx.set(dir * 70);
        dx.set(withSpring(0, springs.smooth));
      } else {
        if (dir !== 0) scheduleOnRN(haptics.rigid);
        dx.set(withSpring(0, { ...springs.release, velocity: e.velocityX * 0.45 }));
      }
    },
  });

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dx.get()), [0, 90], [1, 0.4], Extrapolation.CLAMP),
    transform: [{ translateX: dx.get() }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}
