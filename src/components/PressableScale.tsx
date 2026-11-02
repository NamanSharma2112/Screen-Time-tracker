import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';

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
 * The basic touchable. Pressed feedback is a plain style switch (slight dim + shrink) applied by
 * React Native itself — no animation driver, nothing to schedule, so it shows on the very first
 * frame of the touch even when the JS thread is busy.
 */
export function PressableScale({
  children,
  style,
  containerStyle,
  scaleTo = 0.97,
  haptic = 'selection',
  onPress,
  ...rest
}: Props) {
  return (
    <Pressable
      {...rest}
      unstable_pressDelay={0}
      style={containerStyle}
      onPress={(e) => {
        if (haptic === 'selection') haptics.selection();
        if (haptic === 'light') haptics.light();
        onPress?.(e);
      }}
    >
      {({ pressed }) => (
        // Inner view carries the visual style so `containerStyle` can own layout.
        <PressedView pressed={pressed} scaleTo={scaleTo} style={style}>
          {children}
        </PressedView>
      )}
    </Pressable>
  );
}

function PressedView({
  pressed,
  scaleTo,
  style,
  children,
}: {
  pressed: boolean;
  scaleTo: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return <View style={[style, pressed && { opacity: 0.75, transform: [{ scale: scaleTo }] }]}>{children}</View>;
}
