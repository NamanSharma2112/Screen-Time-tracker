import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

const VARIANTS = {
  hero: { fontSize: 44, lineHeight: 48, fontWeight: '700', letterSpacing: -1.2 },
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.15 },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: -0.1 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

export type TxtVariant = keyof typeof VARIANTS;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'inverse';

type Props = TextProps & {
  variant?: TxtVariant;
  tone?: Tone;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  tabular?: boolean;
};

/** Rendered font size and line height of a variant, after the user's font-size preference. */
export function useTextMetrics(variant: TxtVariant) {
  const { fontScale } = useTheme();
  const base = VARIANTS[variant];
  return { fontSize: base.fontSize * fontScale, lineHeight: base.lineHeight * fontScale };
}

export function Txt({ variant = 'body', tone = 'primary', color, weight, align, tabular, style, ...rest }: Props) {
  const { colors, accent, fontScale } = useTheme();
  const base = VARIANTS[variant];
  const toneColor = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent,
    inverse: colors.primaryButtonText,
  }[tone];

  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        base,
        {
          fontSize: base.fontSize * fontScale,
          // Explicit line heights + no extra Android font padding keep text optically
          // centred and identical across platforms.
          lineHeight: base.lineHeight * fontScale,
          includeFontPadding: false,
          color: color ?? toneColor,
          fontVariant: tabular ? ['tabular-nums'] : undefined,
        },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
