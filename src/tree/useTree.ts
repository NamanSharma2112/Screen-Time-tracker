import { useMemo } from 'react';

import { addDays, dateKey, MINUTE, parseKey, todayKey } from '@/lib/time';
import { growthStore } from '@/state/growth';
import { useSettings } from '@/state/settings';
import { useDays, useUsage } from '@/state/usage';

import { computeTree, type DayResult, type TreeModel } from './model';

/** A believable sample history so the tree has something to show before real data exists. */
function sampleHistory(today: string): DayResult[] {
  const missed = new Set([3, 9]); // a couple of off days, ~2 weeks of mostly-good days
  return Array.from({ length: 16 }, (_, i) => {
    const key = dateKey(addDays(new Date(), -(16 - i)));
    return { key, met: !missed.has(i) };
  }).filter((d) => d.key < today);
}

/** The current streak tree: real recorded history on device, a sample tree otherwise. */
export function useTree(): TreeModel {
  const today = todayKey();
  const { source } = useUsage();
  const { settings } = useSettings();
  const stored = growthStore.use();
  // Loading the recent fortnight also records any finished days we haven't seen yet.
  const keys = useMemo(() => Array.from({ length: 14 }, (_, i) => dateKey(addDays(parseKey(today), i - 13))), [today]);
  const days = useDays(keys);
  const todayDay = days[days.length - 1];
  const goal = settings.dailyGoalMinutes * MINUTE;
  const todayMet = todayDay ? todayDay.totalMs <= goal : null;

  return useMemo(() => {
    const history: DayResult[] =
      source === 'device'
        ? Object.entries(stored).map(([key, o]) => ({ key, met: o.totalMs <= o.goalMs }))
        : sampleHistory(today);
    return computeTree(history, todayMet);
  }, [source, stored, today, todayMet]);
}
