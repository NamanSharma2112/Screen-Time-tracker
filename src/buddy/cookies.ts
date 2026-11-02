import type { Mood } from './art';

type Session = { start: number; end: number; plannedMs: number; completed: boolean };

/** Cookies a session earned: one per quarter reached, all four when it was completed. */
export function cookiesFor(s: Session) {
  if (s.completed) return 4;
  if (s.plannedMs <= 0) return 0;
  return Math.min(3, Math.floor(((s.end - s.start) / s.plannedMs) * 4));
}

/** Cookies earned from sessions that started on the given local day. */
export function cookiesOn(history: Session[], isDay: (start: number) => boolean) {
  return history.reduce((n, s) => (isDay(s.start) ? n + cookiesFor(s) : n), 0);
}

/** How the buddy feels about today's cookies. Never sad: at worst, hopeful. */
export function buddyMood(cookies: number): Mood {
  if (cookies >= 8) return 'excited';
  if (cookies >= 4) return 'happy';
  if (cookies >= 1) return 'content';
  return 'hopeful';
}

export function buddyLine(cookies: number) {
  if (cookies >= 8) return 'Stuffed and delighted. What a focus day!';
  if (cookies >= 4) return 'Well fed and proud of you.';
  if (cookies >= 1) return 'Nibbling happily. One more short focus?';
  return 'Hungry! A 5-minute focus earns a cookie.';
}

export const cookieLabel = (n: number) => `${n} ${n === 1 ? 'cookie' : 'cookies'} today`;
