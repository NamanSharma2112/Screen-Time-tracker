import { haptics } from '@/lib/haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { timings } from '@/theme/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Layout style for the outer touch target (e.g. `flex: 1` in a row). */
  containerStyle?: StyleProp<ViewStyle>;
  /** How far the element shrinks while pressed. */
  scaleTo?: number;
  haptic?: 'selection' | 'light' | 'none';
};

/**
 * The basic touchable of the app: shrinks with a quick, non-bouncy spring while the finger is down
 * and settles back on release — the same felt-not-seen feedback as iOS buttons and widgets.
 * Keep `scaleTo` subtle: ~0.97 for large surfaces, ~0.94 for small round controls.
 */
export function PressableScale({
  children,
  style,
  containerStyle,
  scaleTo = 0.97,
  haptic = 'selection',
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
    opacity: 1 - 0.06 * pressed.value,
  }));

  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => {
        pressed.set(withTiming(1, timings.press));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, timings.release));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === 'selection') haptics.selection();
        if (haptic === 'light') haptics.light();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
