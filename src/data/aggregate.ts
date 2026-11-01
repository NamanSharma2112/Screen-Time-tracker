import { addDays, parseKey } from '@/lib/time';

import { emptyCategories } from './categories';
import type { AppDayUsage, AppMeta, DayUsage, Session } from './types';

/** Builds one day's summary from raw sessions/unlocks, clipping anything that crosses midnight. */
export function buildDay(key: string, sessions: Session[], unlocks: number[], apps: Record<string, AppMeta>): DayUsage {
  const dayStart = parseKey(key).getTime();
  const dayEnd = addDays(parseKey(key), 1).getTime();

  const clipped: Session[] = [];
  for (const s of sessions) {
    if (s.end <= dayStart || s.start >= dayEnd) continue;
    clipped.push({ appId: s.appId, start: Math.max(s.start, dayStart), end: Math.min(s.end, dayEnd) });
  }
  clipped.sort((a, b) => a.start - b.start);

  const hourly = new Array<number>(24).fill(0);
  const byCategory = emptyCategories();
  const perApp = new Map<string, AppDayUsage>();
  let totalMs = 0;
  let longestSessionMs = 0;

  for (const s of clipped) {
    const ms = s.end - s.start;
    totalMs += ms;
    longestSessionMs = Math.max(longestSessionMs, ms);
    byCategory[apps[s.appId]?.category ?? 'other'] += ms;

    let app = perApp.get(s.appId);
    if (!app) {
      app = { appId: s.appId, ms: 0, sessions: 0, longestMs: 0, hourly: new Array<number>(24).fill(0) };
      perApp.set(s.appId, app);
    }
    app.ms += ms;
    app.sessions += 1;
    app.longestMs = Math.max(app.longestMs, ms);

    // Spread the session over the hour buckets it overlaps.
    let t = s.start;
    while (t < s.end) {
      const d = new Date(t);
      const nextHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();
      const segEnd = Math.min(nextHour, s.end);
      const h = d.getHours();
      hourly[h] += segEnd - t;
      app.hourly[h] += segEnd - t;
      t = segEnd;
    }
  }

  const dayUnlocks = unlocks.filter((u) => u >= dayStart && u < dayEnd).sort((a, b) => a - b);
  const firstPickup = dayUnlocks[0] ?? clipped[0]?.start ?? null;

  return {
    key,
    totalMs,
    apps: [...perApp.values()].sort((a, b) => b.ms - a.ms),
    byCategory,
    hourly,
    sessions: clipped,
    // Devices that don't report unlock events still get a sensible estimate.
    pickups: dayUnlocks.length || estimatePickups(clipped),
    firstPickup,
    longestSessionMs,
  };
}

/** Counts bursts of activity separated by at least a minute of idle time. */
function estimatePickups(sorted: Session[]): number {
  let count = 0;
  let lastEnd = -Infinity;
  for (const s of sorted) {
    if (s.start - lastEnd > 60_000) count += 1;
    lastEnd = Math.max(lastEnd, s.end);
  }
  return count;
}

export const emptyDay = (key: string): DayUsage => buildDay(key, [], [], {});

/** Averages across days that already happened (ignores future days). */
export function averageMs(days: (DayUsage | undefined)[], pick: (d: DayUsage) => number = (d) => d.totalMs): number {
  const real = days.filter((d): d is DayUsage => !!d);
  if (!real.length) return 0;
  return real.reduce((sum, d) => sum + pick(d), 0) / real.length;
}
