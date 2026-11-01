import { useColorScheme } from 'react-native';

import { useEffectiveSettings } from '@/state/settings';

import { dark, light, withAlpha, type Palette } from './colors';

const FONT_SCALE = { small: 0.92, medium: 1, large: 1.1 } as const;

export type Theme = {
  scheme: 'light' | 'dark';
  colors: Palette;
  accent: string;
  accentSoft: string;
  fontScale: number;
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const settings = useEffectiveSettings();
  const scheme = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
  return {
    scheme,
    colors: scheme === 'dark' ? dark : light,
    accent: settings.accent,
    accentSoft: withAlpha(settings.accent, scheme === 'dark' ? 0.2 : 0.12),
    fontScale: FONT_SCALE[settings.fontSize],
  };
}
