import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppUsageRow } from '@/components/AppUsageRow';
import { CircleButton } from '@/components/CircleButton';
import { FeelingsCard } from '@/components/FeelingsCard';
import { HourlyWave } from '@/components/HourlyWave';
import { ListRow } from '@/components/ListRow';
import { RollingText } from '@/components/RollingText';
import { Screen } from '@/components/Screen';
import { SessionTimeline } from '@/components/SessionTimeline';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { WeekBars } from '@/components/WeekBars';
import { averageMs } from '@/data/aggregate';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import type { DayUsage } from '@/data/types';
import {
  addDays,
  dateKey,
  dayLetter,
  formatClock,
  formatDate,
  formatDuration,
  formatRange,
  MINUTE,
  parseKey,
  splitDuration,
  todayKey,
  weekKeys,
} from '@/lib/time';
import { useSettings } from '@/state/settings';
import { useDays, useUsage } from '@/state/usage';
import { useEntering } from '@/theme/motion';

export default function AnalyticsScreen() {
  const enter = useEntering();
  const { settings } = useSettings();
  const { apps } = useUsage();
  const today = todayKey();

  const [offset, setOffset] = useState(0);
  const anchorKey = dateKey(addDays(parseKey(today), offset * 7));
  const week = weekKeys(parseKey(anchorKey), settings.weekStart);
  const prevWeek = weekKeys(addDays(parseKey(anchorKey), -7), settings.weekStart);

  const days = useDays(week);
  const prevDays = useDays(prevWeek);
  const [selectedRaw, setSelected] = useState<string | null>(null);
  const selected = selectedRaw && week.includes(selectedRaw) ? selectedRaw : week.includes(today) ? today : week[6];
  const selectedDay = days[week.indexOf(selected)];
  // The day shown on first render is covered by the card's entrance; later switches crossfade.
  const [initialSelected] = useState(selected);

  const goalMs = settings.dailyGoalMinutes * MINUTE;
  const avg = averageMs(days);
  const prevAvg = averageMs(prevDays);
  const delta = prevAvg > 0 ? (avg - prevAvg) / prevAvg : null;
  const shownAvg = splitDuration(avg);

  const real = days.filter((d): d is DayUsage => !!d);
  const weekTotal = real.reduce((s, d) => s + d.totalMs, 0);
  const catAvg = CATEGORY_ORDER.map((c) => ({ id: c, ms: averageMs(days, (d) => d.byCategory[c]) }));
  const hourlyAvg = Array.from({ length: 24 }, (_, h) => averageMs(days, (d) => d.hourly[h]));
  const longest = Math.max(0, ...real.map((d) => d.longestSessionMs));
  const pickupsAvg = averageMs(days, (d) => d.pickups);
  const firstPickups = real.map((d) => d.firstPickup).filter((x): x is number => x != null);
  const avgFirstPickup = firstPickups.length
    ? (() => {
        const minutes = firstPickups.map((t) => new Date(t).getHours() * 60 + new Date(t).getMinutes());
        const m = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length);
        return parseKey(today).getTime() + m * MINUTE;
      })()
    : null;

  const topApps = (() => {
    const map = new Map<string, { ms: number; sessions: number }>();
    for (const d of real) {
      for (const a of d.apps) {
        const cur = map.get(a.appId) ?? { ms: 0, sessions: 0 };
        cur.ms += a.ms;
        cur.sessions += a.sessions;
        map.set(a.appId, cur);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 8);
  })();

  return (
    <Screen
      header={{
        title: offset === 0 ? 'This week' : offset === -1 ? 'Last week' : 'Insights',
        left: { icon: 'ellipsis-horizontal', label: 'Preferences', onPress: () => router.push('/settings') },
        right:
          offset !== 0
            ? { icon: 'refresh', label: 'Back to this week', onPress: () => setOffset(0) }
            : { icon: 'share-outline', label: 'Share weekly recap', onPress: () => router.push('/recap') },
      }}
    >
      <View style={styles.rangeRow}>
        <CircleButton
          icon="chevron-back"
          size={32}
          accessibilityLabel="Previous week"
          onPress={() => setOffset((o) => o - 1)}
        />
        <Animated.View key={week[0]} entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          <Txt variant="callout" tone="secondary" align="center">
            {formatRange(week[0], week[6])}
          </Txt>
        </Animated.View>
        <View style={{ opacity: offset < 0 ? 1 : 0.3 }} pointerEvents={offset < 0 ? 'auto' : 'none'}>
          <CircleButton
            icon="chevron-forward"
            size={32}
            accessibilityLabel="Next week"
            onPress={() => setOffset((o) => Math.min(0, o + 1))}
          />
        </View>
      </View>

      <Animated.View entering={enter(0)} style={styles.summary}>
        <Txt variant="footnote" tone="secondary">
          Daily average
        </Txt>
        <RollingText text={`${shownAvg.h}h ${String(shownAvg.m).padStart(2, '0')}m`} variant="largeTitle" />
        {delta != null ? (
          <View style={styles.deltaRow}>
            <Ionicons
              name={delta <= 0 ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={16}
              color={delta <= 0 ? '#34C759' : '#FF9500'}
            />
            <Txt variant="footnote" tone="secondary">
              {Math.abs(Math.round(delta * 100))}% {delta <= 0 ? 'less' : 'more'} than the week before
            </Txt>
          </View>
        ) : null}
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.chart}>
        <WeekBars
          key={week[0]}
          goal={goalMs}
          selectedKey={selected}
          onSelect={setSelected}
          columns={week.map((k, i) => ({
            key: k,
            label: dayLetter(k),
            future: k > today,
            segments: CATEGORY_ORDER.map((c) => ({ value: days[i]?.byCategory[c] ?? 0, color: CATEGORIES[c].color })),
          }))}
        />
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <Txt variant="subhead" tone="secondary" align="center" style={styles.insight}>
          {insight(avg, goalMs, delta)}
        </Txt>
      </Animated.View>

      <Sheet style={{ paddingBottom: 32 }}>
        <Animated.View entering={enter(3)}>
          <Card>
            {catAvg.map((c, i) => (
              <View key={c.id}>
                {i > 0 ? <Divider inset={30} /> : null}
                <ListRow
                  marker={CATEGORIES[c.id].color}
                  label={`Avg. ${CATEGORIES[c.id].label.toLowerCase()} ${avg > 0 ? Math.round((c.ms / avg) * 100) : 0}%`}
                  value={formatDuration(c.ms)}
                />
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={enter(4)}>
          <SectionLabel>How you felt</SectionLabel>
          <FeelingsCard week={week} days={days} goalMs={goalMs} />
        </Animated.View>

        <Animated.View entering={enter(4)}>
          <SectionLabel>{`Timeline · ${formatDate(selected)}`}</SectionLabel>
        </Animated.View>
        <Animated.View entering={enter(5)}>
          <Card style={styles.timelineCard}>
            {/* Crossfade when switching days; the first render is covered by the card's entrance. */}
            <Animated.View key={selected} entering={selected !== initialSelected ? FadeIn.duration(220) : undefined}>
              <SessionTimeline
                sessions={selectedDay?.sessions ?? []}
                apps={apps}
                dayStart={parseKey(selected).getTime()}
                timeFormat={settings.timeFormat}
              />
            </Animated.View>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(6)}>
          <Card>
            <View style={styles.wave}>
              <Txt variant="footnote" tone="secondary" style={{ marginBottom: 12 }}>
                Average by hour
              </Txt>
              <HourlyWave key={week[0]} values={hourlyAvg} timeFormat={settings.timeFormat} />
            </View>
            <Divider />
            <ListRow label="Total screen time" value={formatDuration(weekTotal)} />
            <Divider inset={16} />
            <ListRow label="Avg. pickups per day" value={String(Math.round(pickupsAvg))} />
            <Divider inset={16} />
            <ListRow
              label="Avg. first pickup"
              value={avgFirstPickup ? formatClock(avgFirstPickup, settings.timeFormat) : '—'}
            />
            <Divider inset={16} />
            <ListRow label="Longest session" value={formatDuration(longest)} />
          </Card>
        </Animated.View>

        <SectionLabel>Most used this week</SectionLabel>
        <Card>
          {topApps.map(([id, a], i) => (
            <View key={id}>
              {i > 0 ? <Divider inset={70} /> : null}
              <AppUsageRow
                app={apps[id]}
                ms={a.ms}
                share={a.ms / (topApps[0]?.[1].ms || 1)}
                index={i}
                detail={`${formatDuration(a.ms / Math.max(1, real.length))} a day · ${a.sessions} sessions`}
                onPress={() => router.push({ pathname: '/app/[id]', params: { id, day: selected } })}
              />
            </View>
          ))}
        </Card>
      </Sheet>
    </Screen>
  );
}

function insight(avg: number, goal: number, delta: number | null): string {
  if (avg === 0) return 'No screen time recorded this week.';
  const vsGoal = avg <= goal ? 'You stayed within your daily goal' : 'You went over your daily goal';
  if (delta == null) return `${vsGoal} on average.`;
  if (delta <= -0.05) return `${vsGoal} and used your phone less than last week.\nKeep the momentum going!`;
  if (delta >= 0.05) return `${vsGoal}, with more screen time than last week.\nTry a focus session tomorrow.`;
  return `${vsGoal}, about the same as last week.\nSteady is good.`;
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  summary: { alignItems: 'center', marginTop: 16, gap: 2 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  chart: { paddingHorizontal: 24, marginTop: 24 },
  insight: { marginTop: 20, marginBottom: 24, paddingHorizontal: 40 },
  timelineCard: { paddingVertical: 16 },
  wave: { padding: 16 },
});
