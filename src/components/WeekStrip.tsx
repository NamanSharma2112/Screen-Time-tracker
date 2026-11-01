import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { dayLetter, dayLong, formatDuration, todayKey } from '@/lib/time';
import { springs, timings } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
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

export function WeekStrip({ keys, totals, goalMs, selected, onSelect }: Props) {
  const today = todayKey();
  return (
    <View style={styles.row}>
      {keys.map((key, i) => (
        <DayRing
          key={key}
          index={i}
          letter={dayLetter(key)}
          label={dayLong(key)}
          total={totals[i]}
          progress={totals[i] != null ? totals[i]! / goalMs : 0}
          future={key > today}
          selected={key === selected}
          onPress={() => onSelect(key)}
        />
      ))}
    </View>
  );
}

type RingProps = {
  index: number;
  letter: string;
  label: string;
  total?: number;
  progress: number;
  future: boolean;
  selected: boolean;
  onPress: () => void;
};

function DayRing({ index, letter, label, total, progress, future, selected, onPress }: RingProps) {
  const { colors, accent, accentSoft } = useTheme();
  const reduceMotion = useReducedMotion();
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  const p = useSharedValue(0);
  useEffect(() => {
    const target = Math.min(1, progress);
    p.set(reduceMotion ? target : withDelay(index * 40, withTiming(target, timings.reveal)));
  }, [progress, index, reduceMotion, p]);
  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - p.value) }));

  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.set(withSpring(selected ? 1 : 0, springs.smooth));
  }, [selected, sel]);
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.circleButton, accentSoft]),
  }));

  const over = progress >= 1;
  const ringColor = selected || over ? accent : colors.textSecondary;

  return (
    <PressableScale
      disabled={future}
      onPress={onPress}
      scaleTo={0.94}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: future }}
      accessibilityLabel={future ? `${label}, upcoming` : `${label}, ${formatDuration(total ?? 0)}`}
    >
      <Animated.View style={[styles.ring, bgStyle]}>
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
          {!future ? (
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              stroke={ringColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={arcProps}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null}
        </Svg>
        <Txt
          variant="footnote"
          weight="600"
          tone={future ? 'tertiary' : 'primary'}
          color={selected ? accent : undefined}
        >
          {letter}
        </Txt>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
