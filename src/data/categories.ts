import { hashString } from '@/lib/random';

import type { CategoryId } from './types';

export const CATEGORIES: Record<CategoryId, { label: string; color: string }> = {
  productivity: { label: 'Productivity', color: '#2F8CFF' },
  social: { label: 'Social', color: '#FF4D5E' },
  entertainment: { label: 'Entertainment', color: '#7B5CFF' },
  other: { label: 'Other', color: '#A6A6AE' },
};

export const CATEGORY_ORDER: CategoryId[] = ['productivity', 'social', 'entertainment', 'other'];

export const emptyCategories = (): Record<CategoryId, number> => ({
  productivity: 0,
  social: 0,
  entertainment: 0,
  other: 0,
});

/** Well-known packages whose Play Store category is missing or misleading. */
const KNOWN_PACKAGES: Record<string, CategoryId> = {
  'com.instagram.android': 'social',
  'com.whatsapp': 'social',
  'com.facebook.katana': 'social',
  'com.facebook.orca': 'social',
  'com.twitter.android': 'social',
  'com.zhiliaoapp.musically': 'social',
  'com.snapchat.android': 'social',
  'com.reddit.frontpage': 'social',
  'org.telegram.messenger': 'social',
  'com.discord': 'social',
  'com.linkedin.android': 'social',
  'com.google.android.apps.messaging': 'social',
  'com.google.android.youtube': 'entertainment',
  'com.netflix.mediaclient': 'entertainment',
  'com.spotify.music': 'entertainment',
  'tv.twitch.android.app': 'entertainment',
  'com.amazon.avod.thirdpartyclient': 'entertainment',
  'com.disney.disneyplus': 'entertainment',
  'com.google.android.gm': 'productivity',
  'com.Slack': 'productivity',
  'notion.id': 'productivity',
  'com.google.android.calendar': 'productivity',
  'com.google.android.apps.docs': 'productivity',
  'com.microsoft.teams': 'productivity',
  'com.microsoft.office.outlook': 'productivity',
  'com.google.android.keep': 'productivity',
  'com.todoist': 'productivity',
};

/** Maps android.content.pm.ApplicationInfo.CATEGORY_* to our buckets. */
export function categoryFor(packageName: string, androidCategory: number): CategoryId {
  const known = KNOWN_PACKAGES[packageName];
  if (known) return known;
  switch (androidCategory) {
    case 4: // SOCIAL
      return 'social';
    case 0: // GAME
    case 1: // AUDIO
    case 2: // VIDEO
    case 3: // IMAGE
      return 'entertainment';
    case 6: // MAPS
    case 7: // PRODUCTIVITY
      return 'productivity';
    default:
      return 'other';
  }
}

const TILE_COLORS = [
  '#FF6B6B',
  '#FF9F43',
  '#F7B32B',
  '#2ED47A',
  '#1FB6D6',
  '#2F8CFF',
  '#5B6CFF',
  '#9B5CFF',
  '#E056C8',
  '#8A8A93',
];

export const tileColorFor = (id: string) => TILE_COLORS[hashString(id) % TILE_COLORS.length];
