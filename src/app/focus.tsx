import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { BrainDumpSheet } from '@/components/BrainDumpSheet';
import { HoldButton, PrimaryButton } from '@/components/Buttons';
import { DottedDial } from '@/components/DottedDial';
import { useToast } from '@/components/IslandToast';
import { PressableScale } from '@/components/PressableScale';
import { Ripple } from '@/components/Ripple';
import { RollingText } from '@/components/RollingText';
import { Screen } from '@/components/Screen';
import { StatColumns } from '@/components/StatColumns';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { cancelNotification, requestNotifications, scheduleFocusEnd } from '@/lib/notifications';
import { formatCountdown, formatDuration, MINUTE } from '@/lib/time';
import {
  activeFocus,
  finishFocus,
  focusHistory,
  focusStats,
  reflectOnLast,
  startFocus,
  type Reflection,
} from '@/state/focus';
import { notesStore } from '@/state/notes';
import { useSettings } from '@/state/settings';
import { springs, useEntering } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const LENGTHS = [5, 15, 25, 45, 60];

const REFLECTIONS: { value: Reflection; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'focused', label: 'Focused', icon: 'flash' },
  { value: 'drifted', label: 'Some drift', icon: 'water' },
  { value: 'distracted', label: 'Distracted', icon: 'cloudy' },
];

export default function FocusScreen() {
  const enter = useEntering();
  const { colors, accent } = useTheme();
  const { settings } = useSettings();
  const toast = useToast();
  const active = activeFocus.use();
  const history = focusHistory.use();
  const notes = notesStore.use();
  const stats = focusStats(history);

  const [minutes, setMinutes] = useState(25);
  const [now, setNow] = useState(() => Date.now());
  const [justFinished, setJustFinished] = useState(false);
  const [reflected, setReflected] = useState<Reflection | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [dumpOpen, setDumpOpen] = useState(false);
  const lastCheck = useRef(0);

  // Time is derived from timestamps, so the countdown stays correct if the app was backgrounded.
  useEffect(() => {
    if (!active) return;
    const checkMs = settings.timeCheckMinutes * MINUTE;
    lastCheck.current = checkMs ? Math.floor((Date.now() - active.start) / checkMs) : 0;

    const tick = () => {
      const t = Date.now();
      setNow(t);
      const end = active.start + active.plannedMs;
      if (t >= end) {
        finishFocus(true);
        cancelNotification(active.notificationId);
        setJustFinished(true);
        setReflected(null);
        setCelebrate((c) => c + 1);
        toast({
          title: 'Session complete',
          subtitle: 'Nice work. Take a short break.',
          icon: 'checkmark-circle',
          tone: 'success',
          haptic: 'success',
        });
        return;
      }
      // Gentle "time check" — helps with time blindness without breaking the flow.
      if (checkMs) {
        const n = Math.floor((t - active.start) / checkMs);
        if (n > lastCheck.current && end - t > MINUTE) {
          lastCheck.current = n;
          const left = Math.ceil((end - t) / MINUTE);
          toast({
            title: `${n * settings.timeCheckMinutes} min in`,
            subtitle: `${left} min to go — you’re doing it`,
            icon: 'time-outline',
          });
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, settings.timeCheckMinutes, toast]);

  const state = active ? 'running' : justFinished ? 'done' : 'idle';
  const remaining = active ? Math.max(0, active.start + active.plannedMs - now) : minutes * MINUTE;
  const progress = active ? Math.min(1, (now - active.start) / active.plannedMs) : justFinished ? 1 : 0;

  const begin = async () => {
    setJustFinished(false);
    const plannedMs = minutes * MINUTE;
    startFocus(plannedMs);
    if (settings.focusReminders) {
      await requestNotifications();
      const id = await scheduleFocusEnd(Date.now() + plannedMs, minutes);
      const current = activeFocus.get();
      if (current) activeFocus.set({ ...current, notificationId: id });
    }
  };

  const endEarly = () => {
    const id = active?.notificationId;
    const record = finishFocus(false);
    cancelNotification(id);
    const mins = record ? Math.round((record.end - record.start) / MINUTE) : 0;
    // Shame-free: any focused time counts.
    toast({
      title: 'Session ended',
      subtitle:
        mins > 0 ? `${mins} focused minute${mins === 1 ? '' : 's'} still count` : 'Starting is the hardest part',
      icon: 'leaf-outline',
      tone: 'neutral',
    });
  };

  const reflect = (r: Reflection) => {
    reflectOnLast(r);
    setReflected(r);
    haptics.selection();
  };

  return (
    <>
      <Screen
        header={{
          title: state === 'running' ? 'Focusing' : 'Focus',
          left: { icon: 'file-tray-outline', label: 'Brain dump', onPress: () => router.push('/notes') },
          right: { icon: 'close', label: 'Close', onPress: () => router.back() },
        }}
        bottom={
          state === 'idle' ? (
            <HoldButton label="Hold to start" onComplete={begin} duration={900} />
          ) : state === 'running' ? (
            <HoldButton label="Hold to end early" onComplete={endEarly} />
          ) : (
            <PrimaryButton label="Done" onPress={() => router.back()} />
          )
        }
      >
        <View style={styles.chips}>
          {LENGTHS.map((m) => (
            <Chip
              key={m}
              label={`${m}m`}
              selected={m === minutes}
              disabled={state === 'running'}
              onPress={() => {
                setMinutes(m);
                setJustFinished(false);
              }}
            />
          ))}
        </View>

        <Animated.View entering={enter(0)} style={styles.dialWrap}>
          <View>
            <Ripple size={268} color={accent} trigger={celebrate} />
            <DottedDial size={268} progress={progress} live={state === 'running'}>
              {state === 'done' ? (
                <Animated.View key="done" entering={FadeIn.duration(300)} style={styles.center}>
                  <Ionicons name="checkmark" size={44} color={accent} />
                  <Txt variant="subhead" tone="secondary">
                    {formatDuration(minutes * MINUTE)} focused
                  </Txt>
                </Animated.View>
              ) : (
                <View style={styles.center}>
                  <RollingText text={formatCountdown(remaining)} variant="hero" />
                  <Txt variant="subhead" tone="secondary">
                    {state === 'running' ? 'remaining' : 'ready when you are'}
                  </Txt>
                </View>
              )}
            </DottedDial>
          </View>
          <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
            {state === 'running'
              ? 'Stay with it — your phone can wait.\nThoughts popping up? Park them below.'
              : state === 'done'
                ? 'Lovely. Stretch, drink some water,\nthen decide what’s next.'
                : 'Pick a length, then hold to begin.\nShort sessions count too.'}
          </Txt>
        </Animated.View>

        <Sheet>
          {state === 'done' ? (
            <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
              <SectionLabel>How did that feel?</SectionLabel>
              <View style={styles.reflectRow}>
                {REFLECTIONS.map((r) => (
                  <ReflectTile key={r.value} {...r} selected={reflected === r.value} onPress={() => reflect(r.value)} />
                ))}
              </View>
              {reflected ? (
                <Animated.View entering={FadeIn.duration(250)}>
                  <Txt variant="footnote" tone="secondary" align="center" style={styles.reflectNote}>
                    {reflected === 'focused'
                      ? 'Great — notice what helped, and do more of it.'
                      : reflected === 'drifted'
                        ? 'Normal! Try a shorter session or a brain dump first.'
                        : 'That’s useful to know. Tomorrow, try 5 minutes somewhere quiet.'}
                  </Txt>
                </Animated.View>
              ) : null}
            </Animated.View>
          ) : null}

          <Animated.View entering={enter(1)} layout={LinearTransition.springify().duration(450).dampingRatio(1)}>
            <Card>
              <StatColumns
                stats={[
                  { value: formatDuration(stats.focusedTodayMs), label: 'Focused today' },
                  { value: String(stats.sessionsToday), label: 'Sessions' },
                  { value: `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, label: 'Streak' },
                ]}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={enter(2)} layout={LinearTransition.springify().duration(450).dampingRatio(1)}>
            <SectionLabel
              right={
                notes.length ? (
                  <PressableScale onPress={() => router.push('/notes')} hitSlop={10}>
                    <Txt variant="callout" tone="accent" weight="600">
                      See all
                    </Txt>
                  </PressableScale>
                ) : undefined
              }
            >
              Brain dump
            </SectionLabel>
            <Card>
              <PressableScale
                onPress={() => setDumpOpen(true)}
                scaleTo={0.98}
                style={styles.dumpRow}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle" size={22} color={accent} />
                <Txt variant="callout" tone="tertiary" style={{ flex: 1 }}>
                  Park a distracting thought…
                </Txt>
              </PressableScale>
              {notes
                .filter((n) => !n.done)
                .slice(0, 3)
                .map((n) => (
                  <View key={n.id}>
                    <Divider inset={50} />
                    <View style={styles.dumpRow}>
                      <View style={[styles.bullet, { borderColor: colors.textTertiary }]} />
                      <Txt variant="callout" numberOfLines={1} style={{ flex: 1 }}>
                        {n.text}
                      </Txt>
                    </View>
                  </View>
                ))}
            </Card>
          </Animated.View>
        </Sheet>
      </Screen>
      <BrainDumpSheet visible={dumpOpen} onClose={() => setDumpOpen(false)} />
    </>
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
    backgroundColor: interpolateColor(s.get(), [0, 1], [colors.circleButton, accentSoft]),
    borderColor: interpolateColor(s.get(), [0, 1], [colors.separator, accent]),
  }));
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.95}
      hitSlop={6}
      accessibilityRole="radio"
      accessibilityLabel={label.replace('m', ' minutes')}
      accessibilityState={{ checked: selected, disabled }}
    >
      <Animated.View style={[styles.chip, { opacity: disabled && !selected ? 0.4 : 1 }, style]}>
        <Txt variant="footnote" weight="600" color={selected ? accent : undefined}>
          {label}
        </Txt>
      </Animated.View>
    </PressableScale>
  );
}

function ReflectTile({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, accent, accentSoft } = useTheme();
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.set(withSpring(selected ? 1 : 0, springs.smooth));
  }, [selected, s]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.get(), [0, 1], [colors.card, accentSoft]),
    borderColor: interpolateColor(s.get(), [0, 1], ['rgba(0,0,0,0)', accent]),
  }));
  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Animated.View style={[styles.reflectTile, style]}>
        <Ionicons name={icon} size={24} color={selected ? accent : colors.textSecondary} />
        <Txt variant="footnote" weight={selected ? '700' : '500'} tone={selected ? 'primary' : 'secondary'}>
          {label}
        </Txt>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  chip: {
    minWidth: 52,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dialWrap: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  center: { alignItems: 'center' },
  message: { marginTop: 16, paddingHorizontal: 40 },
  reflectRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  reflectTile: { borderRadius: 20, borderWidth: 1.5, paddingVertical: 16, alignItems: 'center', gap: 8 },
  reflectNote: { marginTop: 10, paddingHorizontal: 16 },
  dumpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 },
  bullet: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
});
