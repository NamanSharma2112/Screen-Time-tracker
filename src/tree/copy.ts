import { formatDuration } from '@/lib/time';

import type { TreeModel } from './model';

/** One kind, plain sentence about where the tree is and what today means for it. */
export function treeMessage(m: TreeModel, goalMs: number): string {
  if (m.growth === 0) {
    return m.today === false
      ? 'Your seed is waiting. Any day under your goal makes it sprout.'
      : `Stay under ${formatDuration(goalMs)} today and your seed sprouts at midnight.`;
  }
  if (m.today === true) return `On track — a new leaf grows at midnight if you stay under ${formatDuration(goalMs)}.`;
  if (m.today === false) return 'A little thirsty today. It’ll perk up the next day you stay under your goal.';
  return 'Every day under your goal grows a leaf.';
}
