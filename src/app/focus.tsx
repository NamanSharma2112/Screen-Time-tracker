import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { BodyDouble } from '@/components/BodyDouble';
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
import { Switch } from '@/components/Switch';
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
import { taskProgress, tasksStore, toggleStep } from '@/state/tasks';

import { useTheme } from '@/theme/useTheme';

const LENGTHS = [5, 15, 25, 45, 60];

const REFLECTIONS: { value: Reflection; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'focused', label: 'Focused', icon: 'flash' },
  { value: 'drifted', label: 'Some drift', icon: 'water' },
  { value: 'distracted', label: 'Distracted', icon: 'cloudy' },
];

export default function FocusScreen() {
  const { colors, accent } = useTheme();
  const { settings, update } = useSettings();
  const toast = useToast();
  // Opened from a task step or the dopamine menu: /focus?minutes=10&label=…&task=…&step=…
  const params = useLocalSearchParams<{
    minutes?: string;
    label?: string;
    task?: string;
    step?: string;
    autostart?: string;
  }>();
  const paramMinutes = Number(params.minutes) || 0;
  const active = activeFocus.use();
  const history = focusHistory.use();
  const notes = notesStore.use();
  const stats = focusStats(history);

  const [minutes, setMinutes] = useState(paramMinutes || 25);
  const lengths =
    paramMinutes && !LENGTHS.includes(paramMinutes) ? [paramMinutes, ...LENGTHS].sort((a, b) => a - b) : LENGTHS;
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
        if (active.taskId && active.stepId) {
          toggleStep(active.taskId, active.stepId, true);
          const task = tasksStore.get().find((x) => x.id === active.taskId);
          if (task) {
            const p = taskProgress(task);
            toast({
              title: p.next ? 'Step done' : 'Task complete!',
              subtitle: p.next ? `${p.done} of ${p.total} — next: ${p.next.text}` : task.title,
              icon: 'checkmark-done-circle',
              tone: 'success',
              haptic: 'success',
            });
            setJustFinished(true);
            setReflected(null);
            setCelebrate((c) => c + 1);
            return;
          }
        }
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

  const startSession = async () => {
    const plannedMs = minutes * MINUTE;
    startFocus(plannedMs, { label: params.label, taskId: params.task, stepId: params.step });
    if (settings.focusReminders) {
      await requestNotifications();
      const id = await scheduleFocusEnd(Date.now() + plannedMs, minutes);
      const current = activeFocus.get();
      if (current) activeFocus.set({ ...current, notificationId: id });
    }
  };

  const begin = () => {
    setJustFinished(false);
    void startSession();
  };

  // Quick-start from the Focus tab ("15 min") begins immediately — first ask, then do.
  const autostarted = useRef(false);
  useEffect(() => {
    if (params.autostart !== '1' || autostarted.current) return;
    autostarted.current = true;
    // Wait for any saved session to load so a running one is never replaced.
    activeFocus.ready.then(() => {
      if (!activeFocus.get()) void startSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <PrimaryButton label={`Start ${minutes} min`} onPress={begin} />
          ) : state === 'running' ? (
            <HoldButton label="Hold to stop" onComplete={endEarly} duration={700} />
          ) : (
            <PrimaryButton label="Done" onPress={() => router.back()} />
          )
        }
      >
        <View style={styles.chips}>
          {lengths.map((m) => (
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

        {(active?.label ?? params.label) ? (
          <Txt variant="callout" weight="600" align="center" style={styles.label} numberOfLines={2}>
            {active?.label ?? params.label}
          </Txt>
        ) : null}

        <View style={styles.dialWrap}>
          <View>
            <Ripple size={268} color={accent} trigger={celebrate} />
            <DottedDial size={268} progress={progress} live={state === 'running'}>
              {state === 'done' ? (
                <View key="done" style={styles.center}>
                  <Ionicons name="checkmark" size={44} color={accent} />
                  <Txt variant="subhead" tone="secondary">
                    {formatDuration(minutes * MINUTE)} focused
                  </Txt>
                </View>
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
          {state === 'running' && settings.bodyDouble ? (
            <BodyDouble sound={settings.ambientSound} />
          ) : (
            <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
              {state === 'running'
                ? 'Stay with it — your phone can wait.\nThoughts popping up? Park them below.'
                : state === 'done'
                  ? 'Lovely. Stretch, drink some water,\nthen decide what’s next.'
                  : 'Pick a length, then hold to begin.\nShort sessions count too.'}
            </Txt>
          )}
        </View>

        <Sheet>
          {state === 'done' ? (
            <View>
              <SectionLabel>How did that feel?</SectionLabel>
              <View style={styles.reflectRow}>
                {REFLECTIONS.map((r) => (
                  <ReflectTile key={r.value} {...r} selected={reflected === r.value} onPress={() => reflect(r.value)} />
                ))}
              </View>
              {reflected ? (
                <View>
                  <Txt variant="footnote" tone="secondary" align="center" style={styles.reflectNote}>
                    {reflected === 'focused'
                      ? 'Great — notice what helped, and do more of it.'
                      : reflected === 'drifted'
                        ? 'Normal! Try a shorter session or a brain dump first.'
                        : 'That’s useful to know. Tomorrow, try 5 minutes somewhere quiet.'}
                  </Txt>
                </View>
              ) : null}
            </View>
          ) : null}

          {state !== 'running' ? (
            <View>
              <Card>
                <ListRowToggle
                  icon="people-outline"
                  title="Body double"
                  detail="Screen stays on with a calm companion, like working next to a friend."
                  value={settings.bodyDouble}
                  onChange={(v) => update({ bodyDouble: v })}
                />
                {settings.bodyDouble ? (
                  <View style={styles.soundRow}>
                    {(['off', 'brown', 'pink'] as const).map((s) => (
                      <Chip
                        key={s}
                        label={s === 'off' ? 'Silent' : s === 'brown' ? 'Brown noise' : 'Pink noise'}
                        selected={settings.ambientSound === s}
                        disabled={false}
                        onPress={() => update({ ambientSound: s })}
                      />
                    ))}
                  </View>
                ) : null}
              </Card>
            </View>
          ) : null}

          <View>
            <Card>
              <StatColumns
                stats={[
                  { value: formatDuration(stats.focusedTodayMs), label: 'Focused today' },
                  { value: String(stats.sessionsToday), label: 'Sessions' },
                  { value: `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, label: 'Streak' },
                ]}
              />
            </Card>
          </View>

          <View>
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
          </View>
        </Sheet>
      </Screen>
      <BrainDumpSheet visible={dumpOpen} onClose={() => setDumpOpen(false)} />
    </>
  );
}

function ListRowToggle({
  icon,
  title,
  detail,
  value,
  onChange,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { accent } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon} size={22} color={accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="callout" weight="600">
          {title}
        </Txt>
        <Txt variant="footnote" tone="secondary">
          {detail}
        </Txt>
      </View>
      <Switch label={title} value={value} onChange={onChange} />
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
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.95}
      hitSlop={6}
      accessibilityRole="radio"
      accessibilityLabel={/^\d+m$/.test(label) ? label.replace('m', ' minutes') : label}
      accessibilityState={{ checked: selected, disabled }}
      style={[
        styles.chip,
        {
          opacity: disabled && !selected ? 0.4 : 1,
          backgroundColor: selected ? accentSoft : colors.circleButton,
          borderColor: selected ? accent : colors.separator,
        },
      ]}
    >
      <Txt variant="footnote" weight="600" color={selected ? accent : undefined}>
        {label}
      </Txt>
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
  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[
        styles.reflectTile,
        { backgroundColor: selected ? accentSoft : colors.card, borderColor: selected ? accent : 'transparent' },
      ]}
    >
      <Ionicons name={icon} size={24} color={selected ? accent : colors.textSecondary} />
      <Txt variant="footnote" weight={selected ? '700' : '500'} tone={selected ? 'primary' : 'secondary'}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  label: { paddingHorizontal: 40, marginTop: 16, marginBottom: -8 },
  soundRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16, flexWrap: 'wrap' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
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
