import { StyleSheet, View } from 'react-native';

import { CATEGORIES } from '@/data/categories';
import type { AppMeta } from '@/data/types';
import { formatDuration } from '@/lib/time';

import { AppIcon } from './AppIcon';
import { ProgressLine } from './Bars';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type Props = {
  app?: AppMeta;
  ms: number;
  /** 0–1 relative to the most used app. */
  share: number;
  detail: string;
  index: number;
  onPress?: () => void;
};

export function AppUsageRow({ app, ms, share, detail, index, onPress }: Props) {
  const color = app ? CATEGORIES[app.category].color : CATEGORIES.other.color;
  return (
    // The card around this row owns the entrance; the row only animates re-ordering when the
    // ranking changes (e.g. switching days), so it reads as the same list shuffling.
    <View>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`${app?.name ?? 'App'}, ${formatDuration(ms)}`}
      >
        <AppIcon app={app} size={42} />
        <View style={styles.middle}>
          <View style={styles.titleRow}>
            <Txt variant="callout" weight="600" numberOfLines={1} style={{ flex: 1 }}>
              {app?.name ?? 'Unknown app'}
            </Txt>
            <Txt variant="callout" weight="700" tabular>
              {formatDuration(ms)}
            </Txt>
          </View>
          <Txt variant="footnote" tone="secondary" numberOfLines={1}>
            {detail}
          </Txt>
          <ProgressLine value={share} color={color} height={4} delay={150 + index * 60} style={styles.bar} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  middle: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { marginTop: 6 },
});
