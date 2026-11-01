import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { NativeAppInfo, NativeUsageResult } from './UsageStats.types';

declare class UsageStatsModule extends NativeModule<{}> {
  hasPermission(): boolean;
  openUsageAccessSettings(): void;
  queryUsage(startMs: number, endMs: number): Promise<NativeUsageResult>;
  getAppsInfo(packages: string[]): Promise<NativeAppInfo[]>;
}

/**
 * `null` when the native module is not linked: iOS, web, or Expo Go.
 * Usage data then falls back to the demo source.
 */
export default requireOptionalNativeModule<UsageStatsModule>('UsageStats');
