import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { AddTaskSheet } from '@/components/AddTaskSheet';
import { ProgressLine } from '@/components/Bars';
import { PrimaryButton } from '@/components/Buttons';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Surfaces';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Txt } from '@/components/Txt';
import { deleteTask, taskProgress, tasksStore, type Task } from '@/state/tasks';
import { useEntering } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

export default function TasksScreen() {
  const enter = useEntering();
  const tasks = tasksStore.use();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Screen
        header={{ title: 'Tasks', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
        bottom={<PrimaryButton label="Break down a task" onPress={() => setOpen(true)} />}
      >
        <Animated.View entering={enter(0)} style={styles.intro}>
          <Txt variant="subhead" tone="secondary" align="center">
            Big tasks, tiny steps. Each step gets its own short timer — you only ever have to start the next one.
          </Txt>
        </Animated.View>
        <Sheet>
          {tasks.length === 0 ? (
            <Animated.View entering={enter(1)} style={styles.empty}>
              <Ionicons name="list-outline" size={36} color="#A6A6AE" />
              <Txt variant="headline" align="center">
                Nothing to break down yet
              </Txt>
              <Txt variant="subhead" tone="secondary" align="center">
                Got something you keep putting off? Split it into 5-minute steps and start the first one.
              </Txt>
            </Animated.View>
          ) : null}
          {tasks.map((t, i) => (
            <Animated.View
              key={t.id}
              entering={enter(1 + Math.min(i, 5))}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <SwipeableRow label={t.title} onDelete={() => deleteTask(t.id)}>
                <TaskCard task={t} />
              </SwipeableRow>
            </Animated.View>
          ))}
        </Sheet>
      </Screen>
      <AddTaskSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { colors, accent } = useTheme();
  const p = taskProgress(task);
  const finished = p.total > 0 && !p.next;
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
      style={[styles.card, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${p.done} of ${p.total} steps done`}
    >
      <View style={styles.cardTop}>
        <Txt variant="headline" style={{ flex: 1 }} numberOfLines={2}>
          {task.title}
        </Txt>
        <Txt variant="footnote" tone="secondary" tabular>
          {p.done}/{p.total}
        </Txt>
      </View>
      <ProgressLine value={p.total ? p.done / p.total : 0} color={accent} height={5} />
      {p.next ? (
        <View style={styles.nextRow}>
          <Txt variant="subhead" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
            Next: {p.next.text}
          </Txt>
          <PressableScale
            haptic="light"
            scaleTo={0.9}
            hitSlop={8}
            onPress={() =>
              router.push({
                pathname: '/focus',
                params: { minutes: String(p.next!.minutes), label: p.next!.text, task: task.id, step: p.next!.id },
              })
            }
            style={[styles.play, { backgroundColor: accent }]}
            accessibilityRole="button"
            accessibilityLabel={`Start ${p.next.minutes} minutes on ${p.next.text}`}
          >
            <Ionicons name="play" size={12} color="#fff" />
            <Txt variant="footnote" weight="700" color="#fff">
              {p.next.minutes}m
            </Txt>
          </PressableScale>
        </View>
      ) : (
        <Txt variant="subhead" tone="accent" weight="600">
          {finished ? 'All done 🎉' : 'Add a first step'}
        </Txt>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 36, marginTop: 4, marginBottom: 24 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  card: { borderRadius: 20, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  play: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 32, borderRadius: 16 },
});
