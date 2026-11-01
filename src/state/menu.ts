import { createPersistedStore } from './persisted';

export type MenuItem = { id: string; text: string; minutes?: number };

const DEFAULTS: MenuItem[] = [
  { id: 'm1', text: 'Stretch for two minutes', minutes: 2 },
  { id: 'm2', text: 'Drink a glass of water', minutes: 1 },
  { id: 'm3', text: 'Step outside and look at the sky', minutes: 5 },
  { id: 'm4', text: 'Put on one song and move', minutes: 4 },
  { id: 'm5', text: 'Text someone you like', minutes: 3 },
  { id: 'm6', text: 'Doodle on paper', minutes: 5 },
  { id: 'm7', text: 'Tidy one small surface', minutes: 5 },
  { id: 'm8', text: '10 slow breaths', minutes: 2 },
];

/**
 * Dopamine menu: a personal list of quick, genuinely rewarding things to do instead of scrolling.
 * Deciding in the moment is the hard part, so the app picks one for you.
 */
export const menuStore = createPersistedStore<MenuItem[]>('dopamine-menu.v1', DEFAULTS);

export function addMenuItem(text: string, minutes?: number) {
  if (!text.trim()) return;
  menuStore.set((prev) => [...prev, { id: `${Date.now()}`, text: text.trim(), minutes }]);
}

export function deleteMenuItem(id: string) {
  menuStore.set((prev) => prev.filter((m) => m.id !== id));
}

export function randomMenuItem(items: MenuItem[] = menuStore.get(), exclude?: string): MenuItem | undefined {
  const pool = items.length > 1 ? items.filter((m) => m.id !== exclude) : items;
  return pool[Math.floor(Math.random() * pool.length)];
}
