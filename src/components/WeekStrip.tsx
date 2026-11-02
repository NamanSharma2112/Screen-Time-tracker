import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { dayLetter, dayLong, formatDuration, todayKey } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

const SIZE = 44;
const STROKE = 3;

type Props = {
  keys: string[];
  /** Screen time per day in ms, `undefined` for future days. */
  totals: (number | undefined)[];
  goalMs: number;
  selected: string;
  onSelect: (key: string) => void;
};

/** Seven day rings. Static drawing (no animated SVG props) — cheap to redraw when selection changes. */
export function WeekStrip({ keys, totals, goalMs, selected, onSelect }: Props) {
  const today = todayKey();
  return (
    <View style={styles.row}>
      {keys.map((key, i) => (
        <DayRing
          key={key}
          dayKey={key}
          total={totals[i]}
          progress={totals[i] != null ? totals[i]! / goalMs : 0}
          future={key > today}
          selected={key === selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

type RingProps = {
  dayKey: string;
  total?: number;
  progress: number;
  future: boolean;
  selected: boolean;
  onSelect: (key: string) => void;
};

const DayRing = memo(function DayRing({ dayKey, total, progress, future, selected, onSelect }: RingProps) {
  const { colors, accent, accentSoft } = useTheme();
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(1, progress);
  const over = progress >= 1;
  const ringColor = selected || over ? accent : colors.textSecondary;

  return (
    <PressableScale
      disabled={future}
      onPress={() => onSelect(dayKey)}
      scaleTo={0.94}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: future }}
      accessibilityLabel={future ? `${dayLong(dayKey)}, upcoming` : `${dayLong(dayKey)}, ${formatDuration(total ?? 0)}`}
      style={[styles.ring, { backgroundColor: selected ? accentSoft : colors.circleButton }]}
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke={colors.track}
          strokeWidth={future ? 1.5 : STROKE}
          strokeDasharray={future ? '2 4' : undefined}
          fill="none"
        />
        {!future && p > 0 ? (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - p)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        ) : null}
      </Svg>
      <Txt variant="footnote" weight="600" tone={future ? 'tertiary' : 'primary'} color={selected ? accent : undefined}>
        {dayLetter(dayKey)}
      </Txt>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  ring: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
});
