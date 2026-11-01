import { createPersistedStore } from './persisted';

export type Level = 1 | 2 | 3 | 4 | 5;
export type CheckIn = { energy?: Level; mood?: Level; focus?: Level };
export type CheckInKey = keyof CheckIn;

export const CHECKIN_FIELDS: { key: CheckInKey; label: string; low: string; high: string }[] = [
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Buzzing' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Great' },
  { key: 'focus', label: 'Focus', low: 'Scattered', high: 'Locked in' },
];

/** Daily check-in, keyed by `YYYY-MM-DD`. Lets people spot links between how they feel and phone use. */
export const checkinsStore = createPersistedStore<Record<string, CheckIn>>('checkins.v1', {});

export function setCheckIn(day: string, key: CheckInKey, value: Level) {
  checkinsStore.set((prev) => ({ ...prev, [day]: { ...prev[day], [key]: value } }));
}
