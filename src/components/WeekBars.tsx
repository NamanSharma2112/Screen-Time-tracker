import { StyleSheet, View } from 'react-native';

import { formatDuration } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

import { RiseBar } from './Bars';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

/** Room on the right for the goal label, so bars never sit under it. */
const GOAL_GUTTER = 36;

export type BarColumn = {
  key: string;
  label: string;
  /** Bottom → top. Empty for days that haven't happened. */
  segments: { value: number; color: string }[];
  future?: boolean;
};

type Props = {
  columns: BarColumn[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  goal?: number;
  height?: number;
};

/** Apple Screen Time–style stacked weekly bars with a dashed goal line. */
export function WeekBars({ columns, selectedKey, onSelect, goal, height = 150 }: Props) {
  const { colors, accent } = useTheme();
  const totals = columns.map((c) => c.segments.reduce((s, x) => s + x.value, 0));
  const max = Math.max(goal ? goal * 1.15 : 0, ...totals, 1);
  const gutter = goal ? GOAL_GUTTER : 0;

  return (
    <View>
      <View style={{ height }}>
        {goal ? (
          <View style={[styles.goal, { bottom: (goal / max) * height }]} pointerEvents="none">
            <View style={styles.dashes}>
              {Array.from({ length: 40 }, (_, i) => (
                <View key={i} style={[styles.dash, { backgroundColor: colors.textTertiary }]} />
              ))}
            </View>
            <Txt variant="caption" tone="tertiary" style={styles.goalLabel}>
              {formatDuration(goal)}
            </Txt>
          </View>
        ) : null}
        <View style={[styles.columns, { right: gutter }]}>
          {columns.map((col, i) => {
            const total = totals[i];
            const barH = Math.max(total > 0 ? 6 : 0, (total / max) * height);
            return (
              <PressableScale
                key={col.key}
                containerStyle={styles.column}
                style={styles.columnInner}
                disabled={col.future || !onSelect}
                onPress={() => onSelect?.(col.key)}
                scaleTo={0.96}
                accessibilityRole="button"
                accessibilityLabel={`${col.label}, ${formatDuration(total)}`}
              >
                {col.future || total === 0 ? (
                  <View style={[styles.placeholder, { backgroundColor: colors.track }]} />
                ) : (
                  <RiseBar
                    height={barH}
                    delay={i * 35}
                    width={20}
                    radius={7}
                    dim={!!selectedKey && selectedKey !== col.key}
                  >
                    {col.segments.map((s, si) =>
                      s.value > 0 ? <View key={si} style={{ flex: s.value, backgroundColor: s.color }} /> : null,
                    )}
                  </RiseBar>
                )}
              </PressableScale>
            );
          })}
        </View>
      </View>
      <View style={[styles.labels, { marginRight: gutter }]}>
        {columns.map((col) => (
          <Txt
            key={col.key}
            variant="caption"
            align="center"
            style={styles.label}
            tone={col.future ? 'tertiary' : 'secondary'}
            color={col.key === selectedKey ? accent : undefined}
            weight={col.key === selectedKey ? '700' : '500'}
          >
            {col.label}
          </Txt>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Centre the label on the dashed line.
  goal: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -8,
    height: 16,
  },
  dashes: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden' },
  dash: { width: 4, height: 1, opacity: 0.6 },
  goalLabel: { width: GOAL_GUTTER - 6, marginLeft: 6, textAlign: 'right' },
  columns: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: '100%' },
  columnInner: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  placeholder: { width: 6, height: 6, borderRadius: 3 },
  labels: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1 },
});
