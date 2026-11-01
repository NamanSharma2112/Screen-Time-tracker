import { StyleSheet, View } from 'react-native';

import { Txt } from './Txt';

export type Stat = { value: string; label: string; color?: string };

/** The three-up summary card ("1h 02m · REM sleep" in the reference design). */
export function StatColumns({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <View key={s.label} style={styles.col} accessible accessibilityLabel={`${s.label}, ${s.value}`}>
          <Txt variant="headline" weight="700" tabular numberOfLines={1} adjustsFontSizeToFit>
            {s.value}
          </Txt>
          <View style={styles.labelRow}>
            {s.color ? <View style={[styles.dot, { backgroundColor: s.color }]} /> : null}
            <Txt variant="footnote" tone="secondary" numberOfLines={1}>
              {s.label}
            </Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
