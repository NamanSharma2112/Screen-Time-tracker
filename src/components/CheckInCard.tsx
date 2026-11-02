import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { CHECKIN_FIELDS, checkinsStore, setCheckIn, type Level } from '@/state/checkins';

import { useTheme } from '@/theme/useTheme';

import { Card, Divider } from './Surfaces';
import { Txt } from './Txt';

/** Three quick 1–5 ratings. Takes five seconds; over weeks it shows how phone use and wellbeing relate. */
export function CheckInCard({ day }: { day: string }) {
  const entry = checkinsStore.use()[day] ?? {};
  return (
    <Card>
      {CHECKIN_FIELDS.map((f, i) => {
        const value = entry[f.key];
        return (
          <View key={f.key}>
            {i > 0 ? <Divider inset={16} /> : null}
            <View style={styles.row}>
              <View style={styles.labelCol}>
                <Txt variant="callout" weight="600">
                  {f.label}
                </Txt>
                <Txt variant="caption" tone="tertiary">
                  {value ? (value <= 2 ? f.low : value >= 4 ? f.high : 'Okay') : 'Tap to rate'}
                </Txt>
              </View>
              <View
                style={styles.dots}
                accessibilityRole="adjustable"
                accessibilityLabel={`${f.label}: ${value ?? 'not rated'} of 5`}
              >
                {([1, 2, 3, 4, 5] as Level[]).map((n) => (
                  <Dot
                    key={n}
                    on={!!value && n <= value}
                    current={value === n}
                    onPress={() => {
                      haptics.selection();
                      setCheckIn(day, f.key, n);
                    }}
                    label={`${f.label} ${n}`}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function Dot({ on, onPress, label }: { on: boolean; current: boolean; onPress: () => void; label: string }) {
  const { colors, accent } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.dotHit}
    >
      {/* Unrated dots are clear outlines so they read on any card colour. */}
      <View
        style={[styles.dot, on ? { backgroundColor: accent } : { borderWidth: 1.5, borderColor: colors.textTertiary }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  labelCol: { flex: 1, gap: 1 },
  dots: { flexDirection: 'row', gap: 2 },
  dotHit: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9 },
});
