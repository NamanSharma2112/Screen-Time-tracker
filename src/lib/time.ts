export type TimeFormat = '12h' | '24h';
export type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as `YYYY-MM-DD`. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function startOfWeek(d: Date, weekStart: WeekStart): Date {
  const day = startOfDay(d);
  const diff = (day.getDay() - weekStart + 7) % 7;
  return addDays(day, -diff);
}

/** The 7 day-keys of the week containing `anchor`. */
export function weekKeys(anchor: Date, weekStart: WeekStart): string[] {
  const start = startOfWeek(anchor, weekStart);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dayLetter = (key: string) => DAY_SHORT[parseKey(key).getDay()][0];
export const dayShort = (key: string) => DAY_SHORT[parseKey(key).getDay()];
export const dayLong = (key: string) => DAY_LONG[parseKey(key).getDay()];

export function dayTitle(key: string): string {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === dateKey(addDays(new Date(), -1))) return 'Yesterday';
  return dayLong(key);
}

export function formatDate(key: string): string {
  const d = parseKey(key);
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatRange(startKey: string, endKey: string): string {
  const a = parseKey(startKey);
  const b = parseKey(endKey);
  const left = `${MONTH_SHORT[a.getMonth()]} ${a.getDate()}`;
  const right = a.getMonth() === b.getMonth() ? `${b.getDate()}` : `${MONTH_SHORT[b.getMonth()]} ${b.getDate()}`;
  return `${left} – ${right}`;
}

/** Split a duration into whole hours and minutes. */
export function splitDuration(ms: number): { h: number; m: number } {
  const totalMin = Math.round(Math.max(0, ms) / MINUTE);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

/** `4h 23m`, `45m`, `2h`, `<1m`, `0m`. */
export function formatDuration(ms: number): string {
  if (ms > 0 && ms < MINUTE) return '<1m';
  const { h, m } = splitDuration(ms);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${pad(m)}m`;
}

/** `9:41 AM` / `09:41` */
export function formatClock(epochMs: number, fmt: TimeFormat): string {
  const d = new Date(epochMs);
  const h = d.getHours();
  const m = pad(d.getMinutes());
  if (fmt === '24h') return `${pad(h)}:${m}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Axis label for an hour of day (0–24): `10 PM` / `22:00`. */
export function formatHour(hour: number, fmt: TimeFormat): string {
  const h = ((hour % 24) + 24) % 24;
  if (fmt === '24h') return `${pad(h)}:00`;
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
}

/** `25:00` style countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad(m)}:${pad(s)}`;
}
