import { cancelNotification, scheduleReminder } from '@/lib/notifications';

import { createPersistedStore } from './persisted';

export type Transition = {
  id: string;
  title: string;
  /** Epoch ms of the thing itself. */
  at: number;
  /** Heads-up this many minutes before. */
  warnMinutes: number;
  notificationIds: (string | null)[];
};

/**
 * "Up next": a heads-up before the next thing on your day. Switching tasks is hard with ADHD;
 * a warning 10 minutes ahead gives time to wrap up instead of being yanked out of hyperfocus.
 */
export const transitionsStore = createPersistedStore<Transition[]>('transitions.v1', []);

export async function addTransition(title: string, at: number, warnMinutes: number) {
  const name = title.trim() || 'your next thing';
  const warnAt = at - warnMinutes * 60_000;
  const ids = await Promise.all([
    warnAt > Date.now()
      ? scheduleReminder(
          warnAt,
          `${warnMinutes} minutes until ${name}`,
          'Start wrapping up — finish your sentence, save your work.',
        )
      : Promise.resolve(null),
    scheduleReminder(at, `Time for ${name}`, 'You’ve got this. Close what you’re doing and switch over.'),
  ]);
  const t: Transition = { id: `${Date.now()}`, title: name, at, warnMinutes, notificationIds: ids };
  transitionsStore.set((prev) => [...prev, t].sort((a, b) => a.at - b.at));
}

export function deleteTransition(id: string) {
  const t = transitionsStore.get().find((x) => x.id === id);
  t?.notificationIds.forEach((n) => cancelNotification(n));
  transitionsStore.set((prev) => prev.filter((x) => x.id !== id));
}

/** Upcoming items (anything that hasn't started more than a minute ago). */
export const upcoming = (items: Transition[], now = Date.now()) => items.filter((t) => t.at > now - 60_000);
