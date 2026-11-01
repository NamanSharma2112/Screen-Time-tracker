export type Palette = {
  bg: string;
  sheet: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  track: string;
  circleButton: string;
  primaryButton: string;
  primaryButtonText: string;
  overlay: string;
  shadow: string;
};

export const light: Palette = {
  bg: '#F2F2F4',
  sheet: '#FFFFFF',
  card: '#F5F5F7',
  text: '#0B0B0F',
  textSecondary: '#6E6E76',
  textTertiary: '#A6A6AE',
  separator: 'rgba(0,0,0,0.06)',
  track: '#E2E2E7',
  circleButton: '#FFFFFF',
  primaryButton: '#0E0E10',
  primaryButtonText: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.28)',
  shadow: '#000000',
};

export const dark: Palette = {
  bg: '#000000',
  sheet: '#111113',
  card: '#1C1C1F',
  text: '#F5F5F7',
  textSecondary: '#9C9CA4',
  textTertiary: '#5E5E66',
  separator: 'rgba(255,255,255,0.08)',
  track: '#2A2A2F',
  circleButton: '#1C1C1F',
  primaryButton: '#F5F5F7',
  primaryButtonText: '#0B0B0F',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#000000',
};

export const ACCENTS = [
  '#F7B32B',
  '#4CD964',
  '#32D2E6',
  '#2F8CFF',
  '#7B5CFF',
  '#D84DF0',
  '#FF4D5E',
  '#FF3B30',
] as const;

export const DEFAULT_ACCENT = '#FF4D5E';

/** `#RRGGBB` + alpha (0–1) → `rgba(...)`. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
