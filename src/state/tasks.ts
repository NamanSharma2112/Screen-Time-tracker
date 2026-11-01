import { createPersistedStore } from './persisted';

export type Step = { id: string; text: string; minutes: number; done: boolean };
export type Task = { id: string; title: string; createdAt: number; steps: Step[] };

/**
 * Task breakdown: one daunting task becomes a handful of tiny, timed steps. Starting a 5-minute
 * step is far easier than starting "write the report" — a core ADHD strategy against task paralysis.
 */
export const tasksStore = createPersistedStore<Task[]>('tasks.v1', []);

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function addTask(title: string, steps: { text: string; minutes: number }[]): string {
  const task: Task = {
    id: id(),
    title: title.trim(),
    createdAt: Date.now(),
    steps: steps
      .filter((s) => s.text.trim())
      .map((s) => ({ id: id(), text: s.text.trim(), minutes: s.minutes, done: false })),
  };
  tasksStore.set((prev) => [task, ...prev]);
  return task.id;
}

export function toggleStep(taskId: string, stepId: string, done?: boolean) {
  tasksStore.set((prev) =>
    prev.map((t) =>
      t.id !== taskId
        ? t
        : { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, done: done ?? !s.done } : s)) },
    ),
  );
}

export function addStep(taskId: string, text: string, minutes: number) {
  if (!text.trim()) return;
  tasksStore.set((prev) =>
    prev.map((t) =>
      t.id !== taskId ? t : { ...t, steps: [...t.steps, { id: id(), text: text.trim(), minutes, done: false }] },
    ),
  );
}

export function deleteStep(taskId: string, stepId: string) {
  tasksStore.set((prev) =>
    prev.map((t) => (t.id !== taskId ? t : { ...t, steps: t.steps.filter((s) => s.id !== stepId) })),
  );
}

export function deleteTask(taskId: string) {
  tasksStore.set((prev) => prev.filter((t) => t.id !== taskId));
}

export const taskProgress = (t: Task) => ({
  done: t.steps.filter((s) => s.done).length,
  total: t.steps.length,
  next: t.steps.find((s) => !s.done),
});
