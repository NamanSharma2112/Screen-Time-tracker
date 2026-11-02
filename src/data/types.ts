export type CategoryId = 'productivity' | 'social' | 'entertainment' | 'other';

export type AppMeta = {
  /** Package name on Android, a stable slug for demo data. */
  id: string;
  name: string;
  category: CategoryId;
  /** Tile colour used when no real icon is available. */
  color: string;
  /** `data:image/png;base64,...` when the platform gives us the real icon. */
  icon?: string;
  /** Icon-font glyph (Ionicons name) used for sample data, where there is no real icon. */
  glyph?: string;
};

/** A single stretch of time an app spent in the foreground. Epoch ms. */
export type Session = {
  appId: string;
  start: number;
  end: number;
};

export type AppDayUsage = {
  appId: string;
  ms: number;
  sessions: number;
  longestMs: number;
  hourly: number[];
};

export type DayUsage = {
  key: string;
  totalMs: number;
  /** Sorted by time spent, descending. */
  apps: AppDayUsage[];
  byCategory: Record<CategoryId, number>;
  /** 24 buckets, ms of screen time per local hour. */
  hourly: number[];
  sessions: Session[];
  pickups: number;
  firstPickup: number | null;
  longestSessionMs: number;
};

export type RawUsage = {
  sessions: Session[];
  unlocks: number[];
  apps: Record<string, AppMeta>;
};

export interface UsageSource {
  kind: 'device' | 'demo';
  fetchRange(start: Date, end: Date): Promise<RawUsage>;
}
