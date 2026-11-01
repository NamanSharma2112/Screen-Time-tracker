import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { deviceSource, deviceTrackingSupported, hasUsagePermission } from '@/data/device';
import type { CategoryId, Session } from '@/data/types';
import { formatDuration, HOUR, MINUTE } from '@/lib/time';
import { notifyNow } from '@/lib/notifications';
import { readSettings } from '@/widget/data';
import { refreshWidgets } from '@/widget';

export const HYPERFOCUS_TASK = 'hyperfocus-check';
const LAST_ALERT_KEY = 'hyperfocus.lastAlert.v1';
/** Sessions of the same app separated by less than this count as one stretch. */
const JOIN_GAP = 3 * MINUTE;
/** The stretch must still be going on (or have just ended) to be worth a nudge. */
const RECENT = 4 * MINUTE;
const DISTRACTING: CategoryId[] = ['social', 'entertainment'];

const supported = Platform.OS === 'android' && deviceTrackingSupported && !isRunningInExpoGo();

/** Longest current stretch of uninterrupted use of a single app, ending now-ish. */
export function currentStretch(sessions: Session[], now: number) {
  const sorted = [...sessions].sort((a, b) => a.start - b.start);
  const last = sorted[sorted.length - 1];
  if (!last || now - last.end > RECENT) return null;
  let start = last.start;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const s = sorted[i];
    if (s.appId !== last.appId || start - s.end > JOIN_GAP) break;
    start = s.start;
  }
  return { appId: last.appId, start, ms: last.end - start };
}

/**
 * Runs in the background every ~15 minutes (Android WorkManager decides exactly when).
 * If one app has had your attention for longer than your threshold, sends a single, kind nudge
 * for that stretch — with a suggestion from your dopamine menu.
 */
async function runCheck(): Promise<void> {
  refreshWidgets();
  const settings = await readSettings();
  if (!settings.hyperfocusMinutes || !hasUsagePermission()) return;

  const now = Date.now();
  const raw = await deviceSource.fetchRange(new Date(now - 3 * HOUR), new Date(now));
  const stretch = currentStretch(raw.sessions, now);
  if (!stretch || stretch.ms < settings.hyperfocusMinutes * MINUTE) return;

  const app = raw.apps[stretch.appId];
  if (settings.hyperfocusScope === 'distracting' && !DISTRACTING.includes(app?.category ?? 'other')) return;

  // One nudge per stretch.
  const last = await AsyncStorage.getItem(LAST_ALERT_KEY);
  const key = `${stretch.appId}:${stretch.start}`;
  if (last === key) return;
  await AsyncStorage.setItem(LAST_ALERT_KEY, key);

  const menuRaw = await AsyncStorage.getItem('dopamine-menu.v1');
  const menu: { text: string }[] = menuRaw ? JSON.parse(menuRaw) : [];
  const idea = menu.length ? menu[Math.floor(Math.random() * menu.length)].text : 'stretch and drink some water';
  await notifyNow(
    `${formatDuration(stretch.ms)} on ${app?.name ?? 'one app'}`,
    `Just checking in — still the plan? If you need a break: ${idea.charAt(0).toLowerCase()}${idea.slice(1)}.`,
  );
}

if (supported) {
  // Must be defined at module scope so Android can run it with the app closed.
  TaskManager.defineTask(HYPERFOCUS_TASK, async () => {
    try {
      await runCheck();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Registers or removes the periodic check to match the user's setting. Idempotent. */
export async function syncHyperfocusTask(enabled: boolean) {
  if (!supported) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(HYPERFOCUS_TASK);
    if (enabled && !registered) await BackgroundTask.registerTaskAsync(HYPERFOCUS_TASK, { minimumInterval: 15 });
    if (!enabled && registered) await BackgroundTask.unregisterTaskAsync(HYPERFOCUS_TASK);
  } catch {
    // Background work can be restricted by the OS (battery saver); the app still works without it.
  }
}
