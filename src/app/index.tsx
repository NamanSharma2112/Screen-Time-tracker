import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppUsageRow } from '@/components/AppUsageRow';
import { StackedLine } from '@/components/Bars';
import { BOTTOM_BAR_SPACE, BottomBar, PrimaryButton } from '@/components/Buttons';
import { DataNotice } from '@/components/DataNotice';
import { DottedDial } from '@/components/DottedDial';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatColumns } from '@/components/StatColumns';
import { Badge, Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { WeekStrip } from '@/components/WeekStrip';
import { CATEGORIES } from '@/data/categories';
import { dayTitle, formatClock, parseKey, formatDuration, MINUTE, splitDuration, todayKey, weekKeys } from '@/lib/time';
import { useSettings } from '@/state/settings';
import { useDays, useUsage } from '@/state/usage';
import { useEntering, useTween } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

export default function TodayScreen() {
  const enter = useEntering();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { colors } = useTheme();
  const { apps, source, refresh } = useUsage();
  const [refreshing, setRefreshing] = useState(false);

  const today = todayKey();
  const week = useMemo(() => weekKeys(parseKey(today), settings.weekStart), [settings.weekStart, today]);
  const [selected, setSelected] = useState(today);
  const days = useDays(week);
  const day = days[week.indexOf(selected)];

  const goalMs = settings.dailyGoalMinutes * MINUTE;
  const total = day?.totalMs ?? 0;
  const shown = splitDuration(useTween(total, 700));
  const isToday = selected === today;

  const top = day?.apps.slice(0, 5) ?? [];
  const topMs = top[0]?.ms ?? 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.textSecondary}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <ScreenHeader
          title={isToday ? 'Screen time' : dayTitle(selected)}
          subtitle={source === 'demo' ? <Badge label="Sample data" /> : undefined}
          left={{ icon: 'ellipsis-horizontal', label: 'Preferences', onPress: () => router.push('/settings') }}
          right={{ icon: 'bar-chart-outline', label: 'Weekly analytics', onPress: () => router.push('/analytics') }}
        />

        <Animated.View entering={enter(1)}>
          <WeekStrip
            keys={week}
            totals={days.map((d) => d?.totalMs)}
            goalMs={goalMs}
            selected={selected}
            onSelect={setSelected}
          />
        </Animated.View>

        <Animated.View entering={enter(0)} style={styles.dialWrap}>
          <PressableScale
            haptic="light"
            scaleTo={0.97}
            onPress={() => router.push('/analytics')}
            accessibilityLabel={`${formatDuration(total)} of screen time. Open analytics.`}
          >
            <DottedDial size={268} progress={total / goalMs} live={isToday}>
              <Txt variant="hero" tabular>
                {shown.h}h
              </Txt>
              <Txt variant="hero" tone="secondary" tabular style={styles.minutes}>
                {String(shown.m).padStart(2, '0')}m
              </Txt>
            </DottedDial>
          </PressableScale>
          <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
            {goalMessage(total, goalMs, isToday)}
          </Txt>
        </Animated.View>

        <Sheet style={{ paddingBottom: BOTTOM_BAR_SPACE }}>
          <DataNotice />

          <Animated.View entering={enter(2)}>
            <Card>
              <StatColumns
                stats={(['productivity', 'social', 'entertainment'] as const).map((c) => ({
                  value: formatDuration(day?.byCategory[c] ?? 0),
                  label: CATEGORIES[c].label,
                  color: CATEGORIES[c].color,
                }))}
              />
              <View style={styles.stackPad}>
                <StackedLine
                  segments={(['productivity', 'social', 'entertainment', 'other'] as const).map((c) => ({
                    value: day?.byCategory[c] ?? 0,
                    color: CATEGORIES[c].color,
                  }))}
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={enter(3)}>
            <Card>
              <StatColumns
                stats={[
                  { value: String(day?.pickups ?? 0), label: 'Pickups' },
                  {
                    value: day?.firstPickup ? formatClock(day.firstPickup, settings.timeFormat) : '—',
                    label: 'First pickup',
                  },
                  { value: formatDuration(day?.longestSessionMs ?? 0), label: 'Longest session' },
                ]}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={enter(4)}>
            <SectionLabel
              right={
                <PressableScale onPress={() => router.push('/analytics')} hitSlop={10}>
                  <Txt variant="callout" tone="accent" weight="600">
                    See all
                  </Txt>
                </PressableScale>
              }
            >
              Most used
            </SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(5)}>
            <Card>
              {top.length === 0 ? (
                <Txt variant="subhead" tone="tertiary" align="center" style={styles.empty}>
                  Nothing here yet
                </Txt>
              ) : (
                top.map((a, i) => (
                  <View key={a.appId}>
                    {i > 0 ? <Divider inset={70} /> : null}
                    <AppUsageRow
                      app={apps[a.appId]}
                      ms={a.ms}
                      share={a.ms / topMs}
                      index={i}
                      detail={`${CATEGORIES[apps[a.appId]?.category ?? 'other'].label} · ${a.sessions} ${a.sessions === 1 ? 'session' : 'sessions'}`}
                      onPress={() => router.push({ pathname: '/app/[id]', params: { id: a.appId, day: selected } })}
                    />
                  </View>
                ))
              )}
            </Card>
          </Animated.View>
        </Sheet>
      </ScrollView>

      <BottomBar>
        <PrimaryButton label="Start a focus session" onPress={() => router.push('/focus')} />
      </BottomBar>
    </View>
  );
}

function goalMessage(total: number, goal: number, isToday: boolean): string {
  if (total === 0) return isToday ? 'No screen time yet.\nEnjoy the quiet.' : 'No screen time recorded.';
  const diff = goal - total;
  if (diff >= 0) {
    return isToday
      ? `${formatDuration(diff)} left of your ${formatDuration(goal)} daily goal.\nKeep it mindful.`
      : `${formatDuration(diff)} under your daily goal.\nNice work.`;
  }
  return isToday
    ? `${formatDuration(-diff)} over your daily goal.\nMaybe it's time for a break?`
    : `${formatDuration(-diff)} over your daily goal.`;
}

const styles = StyleSheet.create({
  dialWrap: { alignItems: 'center', marginTop: 20, marginBottom: 28 },
  minutes: { marginTop: -2 },
  message: { marginTop: 16, paddingHorizontal: 40 },
  stackPad: { paddingHorizontal: 16, paddingBottom: 16 },
  empty: { padding: 24 },
});
