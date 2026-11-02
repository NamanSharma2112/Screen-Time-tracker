/**
 * Streak tree rules — gentle by design:
 * - Every finished day under your goal grows one leaf. Leaves are never taken away.
 * - A day over goal makes the tree droop and fade a little; good days perk it back up.
 *   Vitality has a floor, so the tree can look tired but never dies.
 * - Today is a "bud": it becomes a leaf at midnight if the day ends under goal.
 */
export type DayResult = { key: string; met: boolean };

export type TreeModel = {
  /** Leaves grown (finished days under goal), all time. */
  growth: number;
  stage: number;
  stageName: string;
  /** 0.3 – 1: how lively the leaves look. */
  vitality: number;
  /** Consecutive finished days under goal, ending yesterday. */
  streak: number;
  bestStreak: number;
  /** Today so far: true = on track, false = over goal, null = no data. */
  today: boolean | null;
  /** Most recent finished days, oldest first. */
  recent: DayResult[];
  /** Leaves still needed to reach the next stage (null at the top stage). */
  toNext: number | null;
  nextStageName: string | null;
};

export const STAGES = [
  { min: 0, name: 'Seed' },
  { min: 1, name: 'Sprout' },
  { min: 3, name: 'Seedling' },
  { min: 7, name: 'Sapling' },
  { min: 14, name: 'Young tree' },
  { min: 30, name: 'Tree' },
  { min: 60, name: 'Blossoming tree' },
];

const VITALITY_FLOOR = 0.3;
const STEP = 0.35;

export function computeTree(history: DayResult[], today: boolean | null): TreeModel {
  const days = [...history].sort((a, b) => (a.key < b.key ? -1 : 1));
  const growth = days.filter((d) => d.met).length;

  let vitality = 1;
  for (const d of days.slice(-7))
    vitality = d.met ? Math.min(1, vitality + STEP) : Math.max(VITALITY_FLOOR, vitality - STEP);
  // Today's progress nudges the look a little (no penalty is "banked" until the day ends).
  if (today === false) vitality = Math.max(VITALITY_FLOOR, vitality - STEP / 2);

  let streak = 0;
  for (let i = days.length - 1; i >= 0 && days[i].met; i--) streak++;
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.met ? run + 1 : 0;
    best = Math.max(best, run);
  }

  let stage = 0;
  STAGES.forEach((s, i) => {
    if (growth >= s.min) stage = i;
  });
  const next = STAGES[stage + 1];

  return {
    growth,
    stage,
    stageName: STAGES[stage].name,
    vitality,
    streak,
    bestStreak: best,
    today,
    recent: days.slice(-14),
    toNext: next ? next.min - growth : null,
    nextStageName: next?.name ?? null,
  };
}
