import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { springs } from '@/theme/motion';

import { Txt, useTextMetrics, type TxtVariant } from './Txt';

type Props = {
  text: string;
  variant?: TxtVariant;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Text whose digits roll like an odometer when they change — the iOS `.numericText()` content
 * transition. Non-digit characters (h, m, :) stay put. Digits are laid out on a fixed tabular grid,
 * so nothing shifts sideways while numbers roll.
 */
export function RollingText({ text, variant = 'hero', tone, color, style, accessibilityLabel }: Props) {
  const { lineHeight } = useTextMetrics(variant);
  const [digitWidth, setDigitWidth] = useState(0);
  const chars = text.split('');

  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? text}>
      {/* Measures one tabular digit so every column is exactly that wide. */}
      <Txt
        variant={variant}
        tabular
        style={styles.measure}
        onLayout={(e) => setDigitWidth(e.nativeEvent.layout.width)}
        importantForAccessibility="no-hide-descendants"
      >
        0
      </Txt>
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <DigitColumn
            // Key by position from the right so units stay units when the length changes.
            key={`d${chars.length - i}`}
            digit={Number(c)}
            index={chars.length - 1 - i}
            width={digitWidth}
            lineHeight={lineHeight}
            variant={variant}
            tone={tone}
            color={color}
            style={style}
          />
        ) : (
          <Txt key={`c${chars.length - i}`} variant={variant} tone={tone} color={color} style={style} tabular>
            {c}
          </Txt>
        ),
      )}
    </View>
  );
}

function DigitColumn({
  digit,
  index,
  width,
  lineHeight,
  variant,
  tone,
  color,
  style,
}: {
  digit: number;
  index: number;
  width: number;
  lineHeight: number;
  variant: TxtVariant;
  tone?: Props['tone'];
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(reduceMotion ? -digit * lineHeight : 0);

  useEffect(() => {
    const target = -digit * lineHeight;
    // Lower-order digits move first, like a mechanical counter.
    y.set(reduceMotion ? target : withDelay(index * 30, withSpring(target, springs.smooth)));
  }, [digit, lineHeight, index, reduceMotion, y]);

  const strip = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <View style={{ width: width || undefined, height: lineHeight, overflow: 'hidden' }}>
      <Animated.View style={strip}>
        {DIGITS.map((d) => (
          <Txt key={d} variant={variant} tone={tone} color={color} style={style} tabular align="center">
            {d}
          </Txt>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  measure: { position: 'absolute', opacity: 0 },
});
