import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE, BottomBar, HoldButton, PrimaryButton } from '@/components/Buttons';
import { DottedDial } from '@/components/DottedDial';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatColumns } from '@/components/StatColumns';
import { Card, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { formatCountdown, formatDuration, MINUTE } from '@/lib/time';
import { useFocusSessions } from '@/state/focus';
import { useEntering, springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const LENGTHS = [15, 25, 45, 60];

export default function FocusScreen() {
  const enter = useEntering();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { active, ready, start, finish, stats } = useFocusSessions();
  const [minutes, setMinutes] = useState(25);
  const [now, setNow] = useState(() => Date.now());
  const [justFinished, setJustFinished] = useState(false);

  // Time is derived from timestamps, so the countdown stays correct if the app was backgrounded.
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= active.start + active.plannedMs) {
        finish(true);
        setJustFinished(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, finish]);

  const remaining = active ? Math.max(0, active.start + active.plannedMs - now) : minutes * MINUTE;
  const progress = active ? Math.min(1, (now - active.start) / active.plannedMs) : justFinished ? 1 : 0;

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const state = active ? 'running' : justFinished ? 'done' : 'idle';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={state === 'running' ? 'Focusing' : 'Focus session'}
          right={{ icon: 'close', label: 'Close', onPress: () => router.back() }}
        />

        <View style={styles.chips}>
          {LENGTHS.map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              selected={m === minutes}
              disabled={state !== 'idle'}
              onPress={() => setMinutes(m)}
            />
          ))}
        </View>

        <Animated.View entering={enter(1)} style={styles.dialWrap}>
          <DottedDial size={268} progress={progress} live={state === 'running'}>
            <Animated.View
              key={state}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(150)}
              style={styles.center}
            >
              {state === 'done' ? (
                <>
                  <Txt variant="hero">Done</Txt>
                  <Txt variant="subhead" tone="secondary">
                    {formatDuration(minutes * MINUTE)} focused
                  </Txt>
                </>
              ) : (
                <>
                  <Txt variant="hero" tabular>
                    {formatCountdown(remaining)}
                  </Txt>
                  <Txt variant="subhead" tone="secondary">
                    {state === 'running' ? 'remaining' : 'minutes'}
                  </Txt>
                </>
              )}
            </Animated.View>
          </DottedDial>
          <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
            {state === 'running'
              ? 'Stay with it — your phone can wait.\nWe’ll keep time for you.'
              : state === 'done'
                ? 'Lovely. Take a breath before\nyou pick your phone back up.'
                : 'Pick a length, then hold to begin.\nPut the phone face down and focus.'}
          </Txt>
        </Animated.View>

        <Sheet style={{ paddingBottom: BOTTOM_BAR_SPACE }}>
          <Animated.View entering={enter(2)}>
            <Card>
              <StatColumns
                stats={[
                  { value: formatDuration(stats.focusedTodayMs), label: 'Focused today' },
                  { value: String(stats.sessionsToday), label: 'Sessions' },
                  { value: `${stats.streak}d`, label: 'Streak' },
                ]}
              />
            </Card>
          </Animated.View>
        </Sheet>
      </ScrollView>

      <BottomBar>
        {state === 'idle' ? (
          <HoldButton label="Hold to start" onComplete={() => start(minutes * MINUTE)} duration={900} />
        ) : state === 'running' ? (
          <HoldButton label="Hold to quit" onComplete={() => finish(false)} />
        ) : (
          <PrimaryButton label="Done" onPress={() => router.back()} />
        )}
      </BottomBar>
    </View>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors, accent, accentSoft } = useTheme();
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.set(withSpring(selected ? 1 : 0, springs.smooth));
  }, [selected, s]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.value, [0, 1], [colors.circleButton, accentSoft]),
    borderColor: interpolateColor(s.value, [0, 1], [colors.separator, accent]),
  }));
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.95}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Animated.View style={[styles.chip, { opacity: disabled && !selected ? 0.4 : 1 }, style]}>
        <Txt variant="footnote" weight="600" color={selected ? accent : undefined}>
          {label}
        </Txt>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  dialWrap: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  center: { alignItems: 'center' },
  message: { marginTop: 16, paddingHorizontal: 40 },
});
