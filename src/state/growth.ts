import { createPersistedStore } from './persisted';

/** One finished day's outcome. The goal is stored as it was that day, so changing it later doesn't rewrite history. */
export type DayOutcome = { totalMs: number; goalMs: number };

/**
 * Daily summaries that grow the streak tree. Android only keeps detailed usage for about a week,
 * so the app keeps this tiny per-day record itself (on the device only) so the tree never shrinks.
 */
export const growthStore = createPersistedStore<Record<string, DayOutcome>>('growth.v1', {});

const MAX_DAYS = 800;

/** Records finished days (never today). Keeps the goal from the first time a day was recorded. */
export function recordOutcomes(days: { key: string; totalMs: number }[], goalMs: number, today: string) {
  const finished = days.filter((d) => d.key < today);
  if (!finished.length) return;
  const prev = growthStore.get();
  let changed = false;
  const next = { ...prev };
  for (const d of finished) {
    const old = prev[d.key];
    // Totals can only grow as Android reports more; keep the larger value.
    if (!old || d.totalMs > old.totalMs) {
      next[d.key] = { totalMs: Math.max(d.totalMs, old?.totalMs ?? 0), goalMs: old?.goalMs ?? goalMs };
      changed = true;
    }
  }
  if (!changed) return;
  const keys = Object.keys(next).sort();
  if (keys.length > MAX_DAYS) keys.slice(0, keys.length - MAX_DAYS).forEach((k) => delete next[k]);
  growthStore.set(next);
}
