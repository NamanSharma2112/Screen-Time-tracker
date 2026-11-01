import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppIcon } from '@/components/AppIcon';
import { HourlyWave } from '@/components/HourlyWave';
import { ListRow } from '@/components/ListRow';
import { RollingText } from '@/components/RollingText';
import { Screen } from '@/components/Screen';
import { Card, Divider, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { WeekBars } from '@/components/WeekBars';
import { averageMs } from '@/data/aggregate';
import { CATEGORIES } from '@/data/categories';
import { dayLetter, dayTitle, formatDuration, parseKey, splitDuration, todayKey, weekKeys } from '@/lib/time';
import { useSettings } from '@/state/settings';
import { useDays, useUsage } from '@/state/usage';
import { popIn, useEntering } from '@/theme/motion';

export default function AppDetailScreen() {
  const enter = useEntering();
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const { settings } = useSettings();
  const { apps } = useUsage();
  const today = todayKey();

  const app = apps[id];
  const color = CATEGORIES[app?.category ?? 'other'].color;
  const anchorKey = day && day <= today ? day : today;
  const week = useMemo(() => weekKeys(parseKey(anchorKey), settings.weekStart), [anchorKey, settings.weekStart]);
  const days = useDays(week);
  const [selected, setSelected] = useState(anchorKey);

  const usageOf = (i: number) => days[i]?.apps.find((a) => a.appId === id);
  const sel = usageOf(week.indexOf(selected));
  const selDay = days[week.indexOf(selected)];
  const shown = splitDuration(sel?.ms ?? 0);
  const avg = averageMs(days, (d) => d.apps.find((a) => a.appId === id)?.ms ?? 0);

  return (
    <Screen
      header={{
        title: app?.name ?? 'App',
        left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() },
      }}
    >
      <View style={styles.hero}>
        <Animated.View entering={popIn(40)}>
          <AppIcon app={app} size={76} />
        </Animated.View>
        <Animated.View entering={enter(1)} style={styles.heroText}>
          <View style={styles.catRow}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Txt variant="footnote" tone="secondary">
              {CATEGORIES[app?.category ?? 'other'].label}
            </Txt>
          </View>
          <RollingText
            text={shown.h > 0 ? `${shown.h}h ${String(shown.m).padStart(2, '0')}m` : `${shown.m}m`}
            variant="largeTitle"
          />
          <Txt variant="footnote" tone="secondary">
            {dayTitle(selected)}
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={enter(2)} style={styles.chart}>
        <WeekBars
          selectedKey={selected}
          onSelect={setSelected}
          height={120}
          columns={week.map((k, i) => ({
            key: k,
            label: dayLetter(k),
            future: k > today,
            segments: [{ value: usageOf(i)?.ms ?? 0, color }],
          }))}
        />
      </Animated.View>

      <Sheet style={{ paddingBottom: 32, marginTop: 28 }}>
        <Animated.View entering={enter(3)}>
          <Card>
            <View style={styles.wave}>
              <Txt variant="footnote" tone="secondary" style={{ marginBottom: 12 }}>
                By hour · {dayTitle(selected)}
              </Txt>
              <HourlyWave
                key={selected}
                values={sel?.hourly ?? new Array(24).fill(0)}
                color={color}
                timeFormat={settings.timeFormat}
              />
            </View>
          </Card>
        </Animated.View>
        <Animated.View entering={enter(4)}>
          <Card>
            <ListRow label="Daily average" value={formatDuration(avg)} />
            <Divider inset={16} />
            <ListRow label="Sessions" value={String(sel?.sessions ?? 0)} />
            <Divider inset={16} />
            <ListRow label="Average session" value={formatDuration(sel ? sel.ms / Math.max(1, sel.sessions) : 0)} />
            <Divider inset={16} />
            <ListRow label="Longest session" value={formatDuration(sel?.longestMs ?? 0)} />
            <Divider inset={16} />
            <ListRow
              label="Share of screen time"
              value={`${selDay && selDay.totalMs > 0 ? Math.round(((sel?.ms ?? 0) / selDay.totalMs) * 100) : 0}%`}
            />
          </Card>
        </Animated.View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 12, gap: 14 },
  heroText: { alignItems: 'center', gap: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chart: { paddingHorizontal: 24, marginTop: 24 },
  wave: { padding: 16 },
});
