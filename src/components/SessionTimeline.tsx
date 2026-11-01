import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import type { AppMeta, CategoryId, Session } from '@/data/types';
import { formatHour, HOUR, MINUTE, type TimeFormat } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

const PX_PER_HOUR = 84;
const LANE = 30;
const PILL = 24;
const MERGE_GAP = 4 * MINUTE;
/** Horizontal inset so the first/last hour labels aren't clipped. */
const PAD = 32;

type Props = {
  sessions: Session[];
  apps: Record<string, AppMeta>;
  dayStart: number;
  timeFormat: TimeFormat;
};

type Block = { category: CategoryId; start: number; end: number };

/**
 * Horizontal, scrollable timeline of the day. Each category gets a lane and nearby sessions are
 * merged into pills — the same visual language as a sleep-stage chart.
 */
export function SessionTimeline({ sessions, apps, dayStart, timeFormat }: Props) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);

  const { blocks, lanes, fromHour, toHour } = useMemo(() => {
    const byCat = new Map<CategoryId, Block[]>();
    for (const s of sessions) {
      const category = apps[s.appId]?.category ?? 'other';
      const list = byCat.get(category) ?? [];
      const last = list[list.length - 1];
      if (last && s.start - last.end < MERGE_GAP) last.end = Math.max(last.end, s.end);
      else list.push({ category, start: s.start, end: s.end });
      byCat.set(category, list);
    }
    const lanes = CATEGORY_ORDER.filter((c) => byCat.has(c));
    const all = lanes.flatMap((c) => byCat.get(c)!);
    const first = Math.min(...all.map((b) => b.start));
    const last = Math.max(...all.map((b) => b.end));
    let fromHour = all.length ? Math.floor((first - dayStart) / HOUR) : 8;
    let toHour = all.length ? Math.ceil((last - dayStart) / HOUR) : 12;
    if (toHour - fromHour < 4) toHour = Math.min(24, fromHour + 4);
    if (toHour - fromHour < 4) fromHour = Math.max(0, toHour - 4);
    return { blocks: all, lanes, fromHour, toHour };
  }, [sessions, apps, dayStart]);

  const width = (toHour - fromHour) * PX_PER_HOUR + PAD * 2;
  const x = (t: number) => ((t - dayStart) / HOUR - fromHour) * PX_PER_HOUR + PAD;

  if (!blocks.length) {
    return (
      <View style={styles.empty}>
        <Txt variant="subhead" tone="tertiary">
          No activity yet
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ width }}
    >
      <View>
        <View style={styles.axis}>
          {Array.from({ length: toHour - fromHour + 1 }, (_, i) => (
            <View key={i} style={[styles.axisItem, { left: i * PX_PER_HOUR + PAD - 30 }]}>
              <Txt variant="caption" tone="secondary" align="center">
                {formatHour(fromHour + i, timeFormat)}
              </Txt>
            </View>
          ))}
          {Array.from({ length: (toHour - fromHour) * 4 }, (_, i) =>
            i % 4 === 0 ? null : (
              <View
                key={`d${i}`}
                style={[styles.dot, { left: PAD + (i * PX_PER_HOUR) / 4 - 1.5, backgroundColor: colors.textTertiary }]}
              />
            ),
          )}
        </View>
        <View style={{ height: lanes.length * LANE + 8, marginTop: 14 }}>
          {blocks.map((b) => {
            const lane = lanes.indexOf(b.category);
            const left = x(b.start);
            const w = Math.max(8, x(b.end) - left);
            return (
              <View
                key={`${b.category}-${b.start}`}
                style={[
                  styles.pill,
                  { left, width: w, top: lane * LANE, backgroundColor: CATEGORIES[b.category].color },
                ]}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  axis: { height: 18 },
  axisItem: { position: 'absolute', width: 60 },
  dot: { position: 'absolute', top: 7, width: 3, height: 3, borderRadius: 1.5, opacity: 0.6 },
  pill: { position: 'absolute', height: PILL, borderRadius: 8 },
  empty: { height: 90, alignItems: 'center', justifyContent: 'center' },
});
