import { LinearGradient } from 'expo-linear-gradient';
import type { Ref } from 'react';
import { StyleSheet, View, type ViewInstance } from 'react-native';

import type { AppMeta } from '@/data/types';
import { LEGAL } from '@/legal/config';
import { formatDuration } from '@/lib/time';

import { Txt } from './Txt';

export type RecapData = {
  range: string;
  avgMs: number;
  delta: number | null;
  days: { label: string; ms: number }[];
  goalMs: number;
  topApps: { app?: AppMeta; ms: number }[];
  focusMs: number;
  focusSessions: number;
  pickupsAvg: number;
  bestDay?: string;
};

/**
 * A story-sized (9:16) summary of the week, designed to be captured as an image and shared.
 * Fixed colours (white on the accent gradient) so it looks the same whatever theme is active.
 */
export function RecapCard({ data, accent, ref }: { data: RecapData; accent: string; ref?: Ref<ViewInstance> }) {
  const max = Math.max(data.goalMs, ...data.days.map((d) => d.ms), 1);
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={[shade(accent, 0.12), shade(accent, -0.18)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Txt variant="footnote" weight="600" color="rgba(255,255,255,0.75)">
        MY WEEK · {data.range.toUpperCase()}
      </Txt>
      <Txt variant="footnote" color="rgba(255,255,255,0.75)" style={{ marginTop: 14 }}>
        Daily screen time
      </Txt>
      <Txt variant="hero" color="#fff">
        {formatDuration(data.avgMs)}
      </Txt>
      {data.delta != null ? (
        <View style={styles.pill}>
          <Txt variant="footnote" weight="700" color="#fff">
            {Math.abs(data.delta) < 0.01
              ? '≈ same as last week'
              : `${data.delta < 0 ? '↓' : '↑'} ${Math.abs(Math.round(data.delta * 100))}% vs last week`}
          </Txt>
        </View>
      ) : null}

      <View style={styles.bars}>
        <View style={[styles.goal, { bottom: (data.goalMs / max) * BAR_H }]} />
        {data.days.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barSlot}>
              <View
                style={[styles.bar, { height: Math.max(d.ms ? 6 : 3, (d.ms / max) * BAR_H), opacity: d.ms ? 1 : 0.35 }]}
              />
            </View>
            <Txt variant="caption" color="rgba(255,255,255,0.8)">
              {d.label}
            </Txt>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <Stat value={formatDuration(data.focusMs)} label={`focused · ${data.focusSessions} sessions`} />
        <Stat value={String(Math.round(data.pickupsAvg))} label="pickups a day" />
      </View>

      <Txt variant="footnote" weight="600" color="rgba(255,255,255,0.75)" style={{ marginTop: 16, marginBottom: 4 }}>
        MOST USED
      </Txt>
      {data.topApps.slice(0, 3).map((a, i) => (
        <View key={i} style={styles.appRow}>
          <Txt variant="callout" weight="600" color="#fff" style={{ flex: 1 }} numberOfLines={1}>
            {i + 1}. {a.app?.name ?? 'App'}
          </Txt>
          <Txt variant="callout" color="rgba(255,255,255,0.85)">
            {formatDuration(a.ms)}
          </Txt>
        </View>
      ))}

      <View style={{ flex: 1 }} />
      {data.bestDay ? (
        <Txt variant="subhead" color="#fff" style={{ marginBottom: 10 }}>
          Calmest day: {data.bestDay} ✨
        </Txt>
      ) : null}
      <Txt variant="caption" color="rgba(255,255,255,0.7)">
        {LEGAL.appName}
      </Txt>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Txt variant="title" color="#fff">
        {value}
      </Txt>
      <Txt variant="caption" color="rgba(255,255,255,0.8)">
        {label}
      </Txt>
    </View>
  );
}

/** Lighten (amount > 0) or darken (< 0) a #RRGGBB colour. */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.round(Math.min(255, Math.max(0, amount > 0 ? c + (255 - c) * amount : c * (1 + amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const BAR_H = 84;
export const RECAP_W = 320;

const styles = StyleSheet.create({
  card: { width: RECAP_W, aspectRatio: 9 / 16, borderRadius: 32, padding: 24, overflow: 'hidden' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  bars: { flexDirection: 'row', height: BAR_H + 22, marginTop: 16 },
  goal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginBottom: 22,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barSlot: { height: BAR_H, justifyContent: 'flex-end' },
  bar: { width: 16, borderRadius: 6, backgroundColor: '#fff' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 12 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
});
