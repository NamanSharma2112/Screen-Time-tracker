import { addDays, dateKey, todayKey } from '@/lib/time';

import { createPersistedStore } from './persisted';

export type Reflection = 'focused' | 'drifted' | 'distracted';

export type FocusRecord = {
  start: number;
  end: number;
  plannedMs: number;
  completed: boolean;
  reflection?: Reflection;
  label?: string;
};

export type ActiveFocus = {
  start: number;
  plannedMs: number;
  notificationId?: string | null;
  /** What the session is for, e.g. a task step. */
  label?: string;
  taskId?: string;
  stepId?: string;
};

const MAX_HISTORY = 300;

export const focusHistory = createPersistedStore<FocusRecord[]>('focus.history.v1', []);
export const activeFocus = createPersistedStore<ActiveFocus | null>('focus.active.v1', null);

export function startFocus(plannedMs: number, extras: Pick<ActiveFocus, 'label' | 'taskId' | 'stepId'> = {}) {
  activeFocus.set({ start: Date.now(), plannedMs, ...extras });
}

/** Ends the running session. Returns the record that was saved. */
export function finishFocus(completed: boolean): FocusRecord | null {
  const active = activeFocus.get();
  if (!active) return null;
  const end = completed ? active.start + active.plannedMs : Date.now();
  const record: FocusRecord = { start: active.start, end, plannedMs: active.plannedMs, completed, label: active.label };
  focusHistory.set((prev) => [...prev, record].slice(-MAX_HISTORY));
  activeFocus.set(null);
  return record;
}

export function reflectOnLast(reflection: Reflection) {
  focusHistory.set((prev) => (prev.length ? [...prev.slice(0, -1), { ...prev[prev.length - 1], reflection }] : prev));
}

export function focusStats(history: FocusRecord[]) {
  const today = todayKey();
  const todays = history.filter((r) => dateKey(new Date(r.start)) === today);
  const focusedTodayMs = todays.reduce((sum, r) => sum + (r.end - r.start), 0);

  // Consecutive days (ending today or yesterday) with at least one completed session.
  // Missing today doesn't break the streak until the day is over — no guilt before bedtime.
  const completedDays = new Set(history.filter((r) => r.completed).map((r) => dateKey(new Date(r.start))));
  let streak = 0;
  let cursor = completedDays.has(today) ? new Date() : addDays(new Date(), -1);
  while (completedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return { focusedTodayMs, sessionsToday: todays.filter((r) => r.completed).length, streak };
}
