import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_ACCENT } from '@/theme/colors';
import type { TimeFormat, WeekStart } from '@/lib/time';

export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type DataSourcePreference = 'device' | 'demo';

export type Settings = {
  theme: ThemePreference;
  accent: string;
  dailyGoalMinutes: number;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  fontSize: FontSize;
  dataSource: DataSourcePreference;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: DEFAULT_ACCENT,
  dailyGoalMinutes: 4 * 60,
  timeFormat: '12h',
  weekStart: 0,
  fontSize: 'medium',
  dataSource: 'device',
};

const STORAGE_KEY = 'settings.v1';

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, ready, update }), [settings, ready, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/**
 * Lets a subtree render with unsaved settings, so the Preferences screen can preview
 * theme/colour/font changes live before they're saved.
 */
export const SettingsPreview = createContext<Settings | null>(null);

/** The settings the UI should render with: the preview draft if there is one, else the saved ones. */
export function useEffectiveSettings(): Settings {
  const preview = useContext(SettingsPreview);
  const { settings } = useSettings();
  return preview ?? settings;
}
