import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { addDays, dateKey, todayKey } from '@/lib/time';

export type FocusRecord = {
  start: number;
  end: number;
  plannedMs: number;
  completed: boolean;
};

export type ActiveFocus = { start: number; plannedMs: number };

const HISTORY_KEY = 'focus.history.v1';
const ACTIVE_KEY = 'focus.active.v1';
const MAX_HISTORY = 300;

export function useFocusSessions() {
  const [history, setHistory] = useState<FocusRecord[]>([]);
  const [active, setActive] = useState<ActiveFocus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(HISTORY_KEY), AsyncStorage.getItem(ACTIVE_KEY)])
      .then(([h, a]) => {
        if (h) setHistory(JSON.parse(h));
        if (a) setActive(JSON.parse(a));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const start = useCallback((plannedMs: number) => {
    const next = { start: Date.now(), plannedMs };
    setActive(next);
    AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const finish = useCallback(
    (completed: boolean) => {
      if (!active) return;
      const end = completed ? active.start + active.plannedMs : Date.now();
      const record: FocusRecord = { start: active.start, end, plannedMs: active.plannedMs, completed };
      setHistory((prev) => {
        const next = [...prev, record].slice(-MAX_HISTORY);
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      setActive(null);
      AsyncStorage.removeItem(ACTIVE_KEY).catch(() => {});
    },
    [active],
  );

  return { history, active, ready, start, finish, stats: focusStats(history) };
}

function focusStats(history: FocusRecord[]) {
  const today = todayKey();
  const todays = history.filter((r) => dateKey(new Date(r.start)) === today);
  const focusedTodayMs = todays.reduce((sum, r) => sum + (r.end - r.start), 0);

  // Consecutive days (ending today or yesterday) with at least one completed session.
  const completedDays = new Set(history.filter((r) => r.completed).map((r) => dateKey(new Date(r.start))));
  let streak = 0;
  let cursor = completedDays.has(today) ? new Date() : addDays(new Date(), -1);
  while (completedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return { focusedTodayMs, sessionsToday: todays.filter((r) => r.completed).length, streak };
}
