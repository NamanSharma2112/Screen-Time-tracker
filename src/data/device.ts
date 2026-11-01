import { Platform } from 'react-native';

import UsageStats from '../../modules/usage-stats';

import { categoryFor, tileColorFor } from './categories';
import type { AppMeta, RawUsage, UsageSource } from './types';

/** True when the native UsageStats module is linked (Android development/production build). */
export const deviceTrackingSupported = Platform.OS === 'android' && UsageStats != null;

export function hasUsagePermission(): boolean {
  try {
    return UsageStats?.hasPermission() ?? false;
  } catch {
    return false;
  }
}

export function openUsageAccessSettings() {
  UsageStats?.openUsageAccessSettings();
}

const appCache: Record<string, AppMeta> = {};

async function resolveApps(packages: string[]): Promise<Record<string, AppMeta>> {
  const unknown = packages.filter((p) => !appCache[p]);
  if (unknown.length && UsageStats) {
    const infos = await UsageStats.getAppsInfo(unknown);
    for (const info of infos) {
      appCache[info.packageName] = {
        id: info.packageName,
        name: info.label,
        category: categoryFor(info.packageName, info.category),
        color: tileColorFor(info.packageName),
        icon: info.icon ? `data:image/png;base64,${info.icon}` : undefined,
      };
    }
  }
  return Object.fromEntries(packages.map((p) => [p, appCache[p]]).filter(([, meta]) => !!meta));
}

export const deviceSource: UsageSource = {
  kind: 'device',
  async fetchRange(start, end) {
    if (!UsageStats) throw new Error('Usage tracking is not available on this device.');
    const result = await UsageStats.queryUsage(start.getTime(), Math.min(end.getTime(), Date.now()));
    const sessions = result.sessions.map((s) => ({ appId: s.packageName, start: s.start, end: s.end }));
    const apps = await resolveApps([...new Set(sessions.map((s) => s.appId))]);
    return { sessions, unlocks: result.unlocks, apps } satisfies RawUsage;
  },
};
