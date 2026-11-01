export type NativeSession = {
  packageName: string;
  /** Epoch milliseconds. */
  start: number;
  /** Epoch milliseconds. */
  end: number;
};

export type NativeUsageResult = {
  sessions: NativeSession[];
  /** Epoch milliseconds of every device unlock ("pickup"). */
  unlocks: number[];
};

export type NativeAppInfo = {
  packageName: string;
  label: string;
  /** android.content.pm.ApplicationInfo.category, or -1 when undefined. */
  category: number;
  isSystem: boolean;
  /** Base64-encoded PNG. */
  icon?: string;
};
