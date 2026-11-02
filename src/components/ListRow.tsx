import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

type Props = {
  label: string;
  value?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Coloured vertical tick (like the category markers in analytics). */
  marker?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  muted?: boolean;
  /** Colours the label, e.g. red for destructive actions. Hides the chevron. */
  labelColor?: string;
};

/** A grouped-table cell. Tappable rows highlight instantly while pressed, like UITableView cells. */
export function ListRow({ label, value, icon, marker, left, right, onPress, muted, labelColor }: Props) {
  const { colors, accent } = useTheme();
  const content = (
    <View style={styles.row}>
      {marker ? <View style={[styles.marker, { backgroundColor: marker }]} /> : null}
      {icon ? <Ionicons name={icon} size={19} color={labelColor ?? accent} style={styles.icon} /> : null}
      {left}
      <Txt
        variant="callout"
        tone={muted ? 'tertiary' : 'secondary'}
        color={labelColor}
        weight={labelColor ? '600' : undefined}
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </Txt>
      {value != null ? (
        <Txt variant="callout" weight="700" tone={muted ? 'tertiary' : 'primary'} tabular>
          {value}
        </Txt>
      ) : null}
      {right}
      {onPress && !labelColor && !right ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevron} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      unstable_pressDelay={0}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => pressed && { backgroundColor: colors.separator }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    gap: 10,
  },
  marker: { width: 4, height: 18, borderRadius: 2 },
  icon: { width: 22 },
  label: { flex: 1 },
  chevron: { marginLeft: 2 },
});
