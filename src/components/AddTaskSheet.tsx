import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { addTask } from '@/state/tasks';
import { useTheme } from '@/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { useToast } from './IslandToast';
import { PressableScale } from './PressableScale';
import { TextField } from './TextField';
import { Txt } from './Txt';

const MINUTES = [5, 10, 15, 25];
const HINTS = [
  'Open the file / get the things out',
  'Do the smallest first bit',
  'Keep going for one more chunk',
  'Tidy up and save',
  'Check it once',
];
const MAX_STEPS = 6;

type Draft = { text: string; minutes: number };

/**
 * "Break it down": name the daunting thing, then list tiny steps with their own short timers.
 * Placeholder hints model what a good first step looks like — small and concrete.
 */
export function AddTaskSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<Draft[]>([
    { text: '', minutes: 5 },
    { text: '', minutes: 10 },
    { text: '', minutes: 10 },
  ]);

  const reset = () => {
    setTitle('');
    setSteps([
      { text: '', minutes: 5 },
      { text: '', minutes: 10 },
      { text: '', minutes: 10 },
    ]);
  };

  const canSave = title.trim() && steps.some((s) => s.text.trim());

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Break it down">
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
        <TextField value={title} onChangeText={setTitle} placeholder="What feels too big? e.g. Do my taxes" autoFocus />
        <Txt variant="footnote" tone="secondary" style={styles.hint}>
          Tiny steps. If a step feels hard to start, make it smaller.
        </Txt>
        {steps.map((s, i) => (
          <Animated.View key={i} entering={FadeIn.duration(200)} layout={LinearTransition} style={styles.stepRow}>
            <Txt variant="callout" tone="tertiary" style={styles.num}>
              {i + 1}
            </Txt>
            <TextField
              value={s.text}
              onChangeText={(text) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, text } : p)))}
              placeholder={HINTS[i] ?? 'Next tiny step'}
              style={{ flex: 1 }}
            />
            <MinutesPill
              minutes={s.minutes}
              onPress={() =>
                setSteps((prev) =>
                  prev.map((p, j) =>
                    j === i ? { ...p, minutes: MINUTES[(MINUTES.indexOf(p.minutes) + 1) % MINUTES.length] } : p,
                  ),
                )
              }
            />
          </Animated.View>
        ))}
        {steps.length < MAX_STEPS ? (
          <PressableScale
            onPress={() => setSteps((prev) => [...prev, { text: '', minutes: 10 }])}
            style={styles.addStep}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color="#8E8E93" />
            <Txt variant="callout" tone="secondary">
              Add a step
            </Txt>
          </PressableScale>
        ) : null}
      </ScrollView>
      <View style={{ marginTop: 12 }}>
        <PrimaryButton
          label="Create task"
          disabled={!canSave}
          onPress={() => {
            addTask(title, steps);
            haptics.success();
            toast({
              title: 'Task broken down',
              subtitle: 'Start with step one — just that.',
              icon: 'list',
              tone: 'success',
              haptic: 'none',
            });
            reset();
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

/** Tap to cycle a step's timer length. */
export function MinutesPill({ minutes, onPress }: { minutes: number; onPress: () => void }) {
  const { accent, accentSoft } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.pill, { backgroundColor: accentSoft }]}
      accessibilityRole="button"
      accessibilityLabel={`${minutes} minutes. Tap to change.`}
    >
      <Txt variant="footnote" weight="700" color={accent} tabular>
        {minutes}m
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 10, marginBottom: 6, paddingHorizontal: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingRight: 2 },
  num: { width: 18, textAlign: 'center' },
  addStep: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingLeft: 26 },
  pill: {
    minWidth: 48,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
