import { StyleSheet, View } from 'react-native';

import { formatHour, type TimeFormat } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

import { WaveBar } from './Bars';
import { Txt } from './Txt';

type Props = {
  /** 24 values (ms per hour). */
  values: number[];
  color?: string;
  height?: number;
  timeFormat: TimeFormat;
};

/** Hour-by-hour activity: pill bars for active hours, tiny hollow dots for idle ones. */
export function HourlyWave({ values, color, height = 56, timeFormat }: Props) {
  const { colors, accent } = useTheme();
  const tint = color ?? accent;
  const max = Math.max(...values, 1);

  return (
    <View>
      <View style={[styles.bars, { height }]}>
        {values.map((v, h) => (
          <View key={h} style={styles.slot}>
            {v > 0 ? (
              <WaveBar height={Math.max(6, (v / max) * height)} delay={h * 12} width={5} color={tint} />
            ) : (
              <View style={[styles.idle, { borderColor: tint }]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {[0, 6, 12, 18].map((h) => (
          <View key={h} style={styles.axisCell}>
            <View style={styles.tickSlot}>
              <View style={[styles.tick, { backgroundColor: colors.textTertiary }]} />
            </View>
            <Txt variant="caption" tone="tertiary">
              {formatHour(h, timeFormat)}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'center' },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idle: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, opacity: 0.5 },
  axis: { flexDirection: 'row', marginTop: 10 },
  axisCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Same width as one hour slot (1/24 of the row = 1/6 of this cell), so the tick is centred under the bar.
  tickSlot: { width: '16.6667%', alignItems: 'center' },
  tick: { width: 3, height: 3, borderRadius: 2 },
});
