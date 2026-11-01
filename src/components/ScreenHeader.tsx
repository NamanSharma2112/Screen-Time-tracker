import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CircleButton } from './CircleButton';
import { Txt } from './Txt';

type Action = {
  icon: ComponentProps<typeof CircleButton>['icon'];
  label: string;
  onPress: () => void;
};

type Props = {
  title: string;
  left?: Action;
  right?: Action;
  /** Rendered under the title, e.g. a "Demo data" pill. */
  subtitle?: ReactNode;
};

export function ScreenHeader({ title, left, right, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {left ? <CircleButton icon={left.icon} accessibilityLabel={left.label} onPress={left.onPress} /> : null}
      </View>
      <View style={styles.center}>
        <Txt variant="headline" numberOfLines={1} accessibilityRole="header">
          {title}
        </Txt>
        {subtitle}
      </View>
      <View style={[styles.side, styles.right]}>
        {right ? <CircleButton icon={right.icon} accessibilityLabel={right.label} onPress={right.onPress} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  side: { width: 44 },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', gap: 4 },
});
