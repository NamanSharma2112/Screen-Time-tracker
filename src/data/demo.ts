import { hashString, pickWeighted, seededRandom } from '@/lib/random';
import { addDays, dateKey, MINUTE, parseKey, startOfDay } from '@/lib/time';

import type { AppMeta, CategoryId, RawUsage, Session, UsageSource } from './types';

type DemoApp = AppMeta & {
  /** Relative likelihood of being opened on a pickup. */
  weight: number;
  /** Typical session length in minutes. */
  median: number;
  weekendBoost?: number;
};

const app = (
  id: string,
  name: string,
  category: CategoryId,
  color: string,
  weight: number,
  median: number,
  weekendBoost = 1,
  glyph?: string,
): DemoApp => ({ id, name, category, color, weight, median, weekendBoost, glyph });

const DEMO_APPS: DemoApp[] = [
  app('demo.instagram', 'Instagram', 'social', '#E1306C', 16, 4.5, 1.3, 'logo-instagram'),
  app('demo.whatsapp', 'WhatsApp', 'social', '#25D366', 18, 1.8, 1, 'logo-whatsapp'),
  app('demo.x', 'X', 'social', '#1F1F1F', 6, 3.5, 1, 'logo-x'),
  app('demo.reddit', 'Reddit', 'social', '#FF5700', 5, 6, 1.4, 'logo-reddit'),
  app('demo.youtube', 'YouTube', 'entertainment', '#FF2D2D', 8, 9, 1.8, 'logo-youtube'),
  app('demo.netflix', 'Netflix', 'entertainment', '#B20710', 1.2, 28, 2.5, 'film'),
  app('demo.spotify', 'Spotify', 'entertainment', '#1DB954', 4, 1.2, 1, 'musical-notes'),
  app('demo.slack', 'Slack', 'productivity', '#4A154B', 9, 2.6, 0.35, 'logo-slack'),
  app('demo.gmail', 'Gmail', 'productivity', '#EA4335', 7, 1.6, 0.5, 'mail'),
  app('demo.notion', 'Notion', 'productivity', '#2B2B2B', 3, 6, 0.4, 'document-text'),
  app('demo.calendar', 'Calendar', 'productivity', '#2F8CFF', 3, 0.8, 0.6, 'calendar'),
  app('demo.chrome', 'Chrome', 'other', '#4285F4', 8, 3.2, 1, 'logo-chrome'),
  app('demo.maps', 'Maps', 'other', '#34A853', 1.5, 2.5, 1.6, 'map'),
  app('demo.camera', 'Camera', 'other', '#6E6E76', 1.5, 0.7, 1.5, 'camera'),
];

const APPS_BY_ID: Record<string, AppMeta> = Object.fromEntries(
  DEMO_APPS.map(({ id, name, category, color, glyph }) => [id, { id, name, category, color, glyph }]),
);

/** How likely a pickup is in each hour of the day. */
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0, 0.3, 1.6, 2.4, 1.8, 1.4, 1.4, 2, 2.2, 1.4, 1.3, 1.4, 1.6, 2, 2.6, 3, 3.2, 2.8, 1.6,
];
const HOURS = HOUR_WEIGHTS.map((w, h) => ({ h, w }));

function generateDay(key: string): { sessions: Session[]; unlocks: number[] } {
  const rand = seededRandom(hashString(key));
  const day = parseKey(key);
  const dayStart = day.getTime();
  const weekend = day.getDay() === 0 || day.getDay() === 6;

  const pickups = Math.round(34 + rand() * 26 + (weekend ? 8 : 0));
  const unlocks: number[] = [];
  const sessions: Session[] = [];

  for (let i = 0; i < pickups; i++) {
    const { h } = pickWeighted(rand, HOURS, (x) => x.w);
    let t = dayStart + h * 60 * MINUTE + rand() * 60 * MINUTE;
    unlocks.push(t);

    const chain = 1 + (rand() < 0.35 ? 1 : 0) + (rand() < 0.12 ? 1 : 0);
    for (let c = 0; c < chain; c++) {
      const a = pickWeighted(rand, DEMO_APPS, (x) => x.weight * (weekend ? (x.weekendBoost ?? 1) : 1));
      let minutes = a.median * Math.exp((rand() - 0.5) * 2.2);
      // The occasional rabbit hole.
      if ((a.category === 'social' || a.category === 'entertainment') && rand() < 0.07) minutes *= 4;
      const ms = Math.max(0.25, minutes) * MINUTE;
      sessions.push({ appId: a.id, start: t, end: t + ms });
      t += ms + 2000;
    }
  }

  // Resolve overlaps so only one app is ever in the foreground.
  sessions.sort((a, b) => a.start - b.start);
  let cursor = -Infinity;
  for (const s of sessions) {
    if (s.start < cursor) {
      const len = s.end - s.start;
      s.start = cursor + 20_000;
      s.end = s.start + len;
    }
    cursor = s.end;
  }

  return { sessions, unlocks };
}

const cache = new Map<string, { sessions: Session[]; unlocks: number[] }>();

export const demoSource: UsageSource = {
  kind: 'demo',
  async fetchRange(start, end) {
    const now = Date.now();
    const to = Math.min(end.getTime(), now);
    const sessions: Session[] = [];
    const unlocks: number[] = [];

    // Include the previous day so sessions that spill past midnight are kept.
    for (let d = addDays(startOfDay(start), -1); d.getTime() < to; d = addDays(d, 1)) {
      const key = dateKey(d);
      let day = cache.get(key);
      if (!day) {
        day = generateDay(key);
        cache.set(key, day);
      }
      for (const s of day.sessions) {
        if (s.start >= to || s.end <= start.getTime()) continue;
        sessions.push({ ...s, end: Math.min(s.end, to) });
      }
      for (const u of day.unlocks) if (u >= start.getTime() && u < to) unlocks.push(u);
    }

    return { sessions, unlocks, apps: APPS_BY_ID } satisfies RawUsage;
  },
};
