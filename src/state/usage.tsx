import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { buildDay } from '@/data/aggregate';
import { demoSource } from '@/data/demo';
import { deviceSource, deviceTrackingSupported, hasUsagePermission, openUsageAccessSettings } from '@/data/device';
import type { AppMeta, DayUsage, UsageSource } from '@/data/types';
import { addDays, parseKey, todayKey } from '@/lib/time';

import { useSettings } from './settings';

/** Today's numbers are refetched when older than this. */
const TODAY_TTL = 60_000;

type UsageContextValue = {
  source: UsageSource['kind'];
  /** Native tracking is compiled into this build (Android dev/prod build). */
  deviceSupported: boolean;
  /** The user granted Usage Access. */
  permission: boolean;
  requestPermission: () => void;
  apps: Record<string, AppMeta>;
  days: Record<string, DayUsage>;
  loading: boolean;
  error: string | null;
  ensureDays: (keys: string[]) => void;
  refresh: () => Promise<void>;
};

const UsageContext = createContext<UsageContextValue | null>(null);

type Store = {
  kind: UsageSource['kind'];
  apps: Record<string, AppMeta>;
  days: Record<string, DayUsage>;
  fetchedAt: Record<string, number>;
};
const emptyStore = (kind: UsageSource['kind']): Store => ({ kind, apps: {}, days: {}, fetchedAt: {} });

export function UsageProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [permission, setPermission] = useState(() => deviceTrackingSupported && hasUsagePermission());
  const useDevice = settings.dataSource === 'device' && deviceTrackingSupported && permission;
  const source = useDevice ? deviceSource : demoSource;

  // The cache is tagged with the source it came from; switching sources (e.g. after
  // granting Usage Access) simply makes the old entries invisible.
  const [rawStore, setStore] = useState<Store>(() => emptyStore(source.kind));
  const store = rawStore.kind === source.kind ? rawStore : emptyStore(source.kind);
  const storeRef = useRef(store);
  const sourceRef = useRef(source);
  useLayoutEffect(() => {
    storeRef.current = store;
    sourceRef.current = source;
  });
  const inflight = useRef(new Set<string>());
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (keys: string[], force: boolean) => {
      const today = todayKey();
      const now = Date.now();
      const { days, fetchedAt } = storeRef.current;
      const tag = (k: string) => `${source.kind}:${k}`;
      const missing = keys
        .filter((k) => k <= today && !inflight.current.has(tag(k)))
        .filter((k) => force || !days[k] || (k === today && now - (fetchedAt[k] ?? 0) > TODAY_TTL))
        .sort();
      if (!missing.length) return;

      missing.forEach((k) => inflight.current.add(tag(k)));
      setPending((n) => n + 1);
      try {
        const start = parseKey(missing[0]);
        const end = addDays(parseKey(missing[missing.length - 1]), 1);
        const raw = await source.fetchRange(start, end);
        if (sourceRef.current !== source) return;
        setStore((prevRaw) => {
          const prev = prevRaw.kind === source.kind ? prevRaw : emptyStore(source.kind);
          const apps = { ...prev.apps, ...raw.apps };
          const nextDays = { ...prev.days };
          const nextFetched = { ...prev.fetchedAt };
          for (const k of missing) {
            nextDays[k] = buildDay(k, raw.sessions, raw.unlocks, apps);
            nextFetched[k] = Date.now();
          }
          return { kind: source.kind, apps, days: nextDays, fetchedAt: nextFetched };
        });
        setError(null);
      } catch (e) {
        if (sourceRef.current === source) setError(e instanceof Error ? e.message : String(e));
      } finally {
        missing.forEach((k) => inflight.current.delete(tag(k)));
        setPending((n) => n - 1);
      }
    },
    [source],
  );

  const ensureDays = useCallback((keys: string[]) => void load(keys, false), [load]);
  const refresh = useCallback(() => load([todayKey()], true), [load]);

  // Coming back to the app: the user may have just granted Usage Access, and today moved on.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (deviceTrackingSupported) setPermission(hasUsagePermission());
      void load([todayKey()], false);
    });
    return () => sub.remove();
  }, [load]);

  const value = useMemo<UsageContextValue>(
    () => ({
      source: source.kind,
      deviceSupported: deviceTrackingSupported,
      permission,
      requestPermission: openUsageAccessSettings,
      apps: store.apps,
      days: store.days,
      loading: pending > 0,
      error,
      ensureDays,
      refresh,
    }),
    [source, permission, store, pending, error, ensureDays, refresh],
  );

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export function useUsage() {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error('useUsage must be used inside <UsageProvider>');
  return ctx;
}

/** Subscribes to a set of days, loading whatever isn't cached yet. Future days resolve to `undefined`. */
export function useDays(keys: string[]): (DayUsage | undefined)[] {
  const { days, ensureDays, source } = useUsage();
  const signature = keys.join(',');
  useEffect(() => {
    ensureDays(keys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ensureDays, source]);
  return keys.map((k) => days[k]);
}
