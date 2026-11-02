import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MinutesPill } from '@/components/AddTaskSheet';
import { PrimaryButton } from '@/components/Buttons';
import { DottedDial } from '@/components/DottedDial';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Card, Divider, Sheet } from '@/components/Surfaces';
import { SwipeableRow } from '@/components/SwipeableRow';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { addStep, deleteStep, taskProgress, tasksStore, toggleStep, type Step } from '@/state/tasks';

import { useTheme } from '@/theme/useTheme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = tasksStore.use().find((t) => t.id === id);
  const [draft, setDraft] = useState('');
  const [draftMinutes, setDraftMinutes] = useState(10);

  if (!task) {
    return (
      <Screen header={{ title: 'Task', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}>
        <Txt variant="body" tone="secondary" align="center">
          This task was deleted.
        </Txt>
      </Screen>
    );
  }

  const p = taskProgress(task);
  const start = (s: Step) =>
    router.push({
      pathname: '/focus',
      params: { minutes: String(s.minutes), label: s.text, task: task.id, step: s.id },
    });

  return (
    <Screen
      header={{ title: 'Task', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
      bottom={
        p.next ? (
          <PrimaryButton label={`Start “${p.next.text}” · ${p.next.minutes}m`} onPress={() => start(p.next!)} />
        ) : undefined
      }
    >
      <View style={styles.hero}>
        <DottedDial size={150} progress={p.total ? p.done / p.total : 0}>
          <Txt variant="title" tabular>
            {p.done}/{p.total}
          </Txt>
        </DottedDial>
        <Txt variant="title" align="center" style={styles.title}>
          {task.title}
        </Txt>
        <Txt variant="subhead" tone="secondary" align="center">
          {p.next
            ? 'Just the next step. Nothing else.'
            : p.total
              ? 'Every step done. Be proud of that.'
              : 'Add a first tiny step below.'}
        </Txt>
      </View>
      <Sheet>
        <View>
          <Card>
            {task.steps.map((s, i) => (
              <View key={s.id}>
                {i > 0 ? <Divider inset={52} /> : null}
                <SwipeableRow label={s.text} onDelete={() => deleteStep(task.id, s.id)}>
                  <StepRow
                    step={s}
                    onToggle={() => {
                      if (!s.done) haptics.success();
                      else haptics.selection();
                      toggleStep(task.id, s.id);
                    }}
                    onStart={() => start(s)}
                  />
                </SwipeableRow>
              </View>
            ))}
            {task.steps.length ? <Divider inset={52} /> : null}
            <View style={styles.addRow}>
              <Ionicons name="add-circle" size={24} color="#A6A6AE" />
              <TextField
                value={draft}
                onChangeText={setDraft}
                placeholder="Add a tiny step"
                style={styles.addInput}
                returnKeyType="done"
                onSubmitEditing={() => {
                  addStep(task.id, draft, draftMinutes);
                  setDraft('');
                }}
              />
              <MinutesPill
                minutes={draftMinutes}
                onPress={() => setDraftMinutes((m) => (m >= 25 ? 5 : m === 5 ? 10 : m === 10 ? 15 : 25))}
              />
            </View>
          </Card>
        </View>
      </Sheet>
    </Screen>
  );
}

function StepRow({ step, onToggle, onStart }: { step: Step; onToggle: () => void; onStart: () => void }) {
  const { colors, accent, accentSoft } = useTheme();
  return (
    <View style={[styles.stepRow, { backgroundColor: colors.card }]}>
      <PressableScale
        haptic="none"
        scaleTo={0.85}
        hitSlop={10}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done }}
        accessibilityLabel={step.text}
      >
        <View style={[styles.circle, { borderColor: step.done ? accent : colors.textTertiary }]}>
          {step.done ? (
            <View style={[styles.circleFill, { backgroundColor: accent }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          ) : null}
        </View>
      </PressableScale>
      <Txt
        variant="body"
        tone={step.done ? 'tertiary' : 'primary'}
        style={[{ flex: 1 }, step.done && { textDecorationLine: 'line-through' }]}
      >
        {step.text}
      </Txt>
      {!step.done ? (
        <PressableScale
          haptic="light"
          scaleTo={0.9}
          hitSlop={8}
          onPress={onStart}
          style={[styles.play, { backgroundColor: accentSoft }]}
          accessibilityRole="button"
          accessibilityLabel={`Start ${step.minutes} minutes`}
        >
          <Ionicons name="play" size={11} color={accent} />
          <Txt variant="footnote" weight="700" color={accent} tabular>
            {step.minutes}m
          </Txt>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, paddingHorizontal: 32, marginBottom: 24 },
  title: { marginTop: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  circleFill: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  play: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
  },
  addInput: { flex: 1, minWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
});
