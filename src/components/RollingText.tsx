import type { StyleProp, TextStyle } from 'react-native';

import { Txt, type TxtVariant } from './Txt';

type Props = {
  text: string;
  variant?: TxtVariant;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * Numeric text on a tabular grid, so digits never shift sideways as values change.
 * (The odometer roll was removed: ten stacked Text nodes per digit cost too much on Android.)
 */
export function RollingText({ text, variant = 'hero', tone, color, style, accessibilityLabel }: Props) {
  return (
    <Txt variant={variant} tone={tone} color={color} style={style} tabular accessibilityLabel={accessibilityLabel}>
      {text}
    </Txt>
  );
}
