import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildDay } from '@/data/aggregate';
import { deviceSource, hasUsagePermission } from '@/data/device';
import { addDays, MINUTE, startOfDay, todayKey } from '@/lib/time';
import { DEFAULT_SETTINGS, type Settings } from '@/state/settings';
import { computeTree, type TreeModel } from '@/tree/model';

import type { WidgetData } from './TodayWidget';

/** Reads saved settings without React (widget + background tasks run headless). */
export async function readSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem('settings.v1');
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Streak tree for the widget: saved daily outcomes + today's usage so far. */
export async function loadTreeData(): Promise<{ tree: TreeModel | null; accent: string; theme: Settings['theme'] }> {
  const settings = await readSettings();
  if (!hasUsagePermission()) return { tree: null, accent: settings.accent, theme: settings.theme };
  const raw = await AsyncStorage.getItem('growth.v1').catch(() => null);
  const outcomes: Record<string, { totalMs: number; goalMs: number }> = raw ? JSON.parse(raw) : {};
  const history = Object.entries(outcomes).map(([key, o]) => ({ key, met: o.totalMs <= o.goalMs }));
  const start = startOfDay(new Date());
  const usage = await deviceSource.fetchRange(start, addDays(start, 1));
  const today = buildDay(todayKey(), usage.sessions, usage.unlocks, usage.apps);
  const tree = computeTree(history, today.totalMs <= settings.dailyGoalMinutes * MINUTE);
  return { tree, accent: settings.accent, theme: settings.theme };
}

export async function loadWidgetData(): Promise<{ data: WidgetData; theme: Settings['theme'] }> {
  const settings = await readSettings();
  if (!hasUsagePermission()) return { data: { kind: 'setup', accent: settings.accent }, theme: settings.theme };
  const start = startOfDay(new Date());
  const raw = await deviceSource.fetchRange(start, addDays(start, 1));
  const day = buildDay(todayKey(), raw.sessions, raw.unlocks, raw.apps);
  return {
    data: {
      kind: 'ready',
      totalMs: day.totalMs,
      goalMs: settings.dailyGoalMinutes * MINUTE,
      pickups: day.pickups,
      accent: settings.accent,
    },
    theme: settings.theme,
  };
}
