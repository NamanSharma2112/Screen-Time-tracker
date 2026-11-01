import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildDay } from '@/data/aggregate';
import { deviceSource, hasUsagePermission } from '@/data/device';
import { addDays, MINUTE, startOfDay, todayKey } from '@/lib/time';
import { DEFAULT_SETTINGS, type Settings } from '@/state/settings';

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
