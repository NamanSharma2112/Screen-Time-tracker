import { StyleSheet, View } from 'react-native';

import type { DayUsage } from '@/data/types';
import { dayLetter } from '@/lib/time';
import { CHECKIN_FIELDS, checkinsStore } from '@/state/checkins';
import { useTheme } from '@/theme/useTheme';

import { Card, Divider } from './Surfaces';
import { Txt } from './Txt';

/**
 * The week's check-ins as a dot grid (darker = higher), plus a plain-language observation linking
 * focus to screen time when there's enough data. Correlation, not judgement.
 */
export function FeelingsCard({
  week,
  days,
  goalMs,
}: {
  week: string[];
  days: (DayUsage | undefined)[];
  goalMs: number;
}) {
  const { colors, accent } = useTheme();
  const entries = checkinsStore.use();

  const under: number[] = [];
  const over: number[] = [];
  week.forEach((k, i) => {
    const f = entries[k]?.focus;
    const d = days[i];
    if (!f || !d) return;
    (d.totalMs > goalMs ? over : under).push(f);
  });
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const insight =
    under.length && over.length
      ? `On days under your goal, focus averaged ${avg(under).toFixed(1)} — vs ${avg(over).toFixed(1)} on days over it.`
      : 'Check in for a few days to see how screen time and the way you feel line up.';

  return (
    <Card>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.label} />
          {week.map((k) => (
            <Txt key={k} variant="caption" tone="tertiary" style={styles.cell} align="center">
              {dayLetter(k)}
            </Txt>
          ))}
        </View>
        {CHECKIN_FIELDS.map((f) => (
          <View key={f.key} style={styles.row}>
            <Txt variant="footnote" tone="secondary" style={styles.label}>
              {f.label}
            </Txt>
            {week.map((k) => {
              const v = entries[k]?.[f.key];
              return (
                <View key={k} style={styles.cell}>
                  <View
                    style={[
                      styles.dot,
                      v
                        ? { backgroundColor: accent, opacity: 0.2 + (v / 5) * 0.8 }
                        : { borderWidth: 1, borderColor: colors.track },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Divider />
      <Txt variant="footnote" tone="secondary" style={styles.insight}>
        {insight}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { width: 64 },
  cell: { flex: 1, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  insight: { padding: 16 },
});
