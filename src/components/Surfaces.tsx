import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

/** The large white panel with rounded top corners that holds the lower half of each screen. */
export function Sheet({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.sheet, { backgroundColor: colors.sheet }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card }, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: inset }} />;
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionLabel}>
      <Txt variant="callout" tone="secondary">
        {children}
      </Txt>
      {right}
    </View>
  );
}

/** Pill shown in headers, e.g. "Demo data". */
export function Badge({ label, color }: { label: string; color?: string }) {
  const { colors, accent, accentSoft } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color ? undefined : accentSoft, borderColor: colors.separator }]}>
      <Txt variant="caption" color={color ?? accent}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
