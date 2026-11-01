import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppUsageRow } from '@/components/AppUsageRow';
import { StackedLine } from '@/components/Bars';
import { BrainDumpSheet } from '@/components/BrainDumpSheet';
import { CheckInCard } from '@/components/CheckInCard';
import { PrimaryButton } from '@/components/Buttons';
import { DataNotice } from '@/components/DataNotice';
import { DottedDial } from '@/components/DottedDial';
import { ListRow } from '@/components/ListRow';
import { PressableScale } from '@/components/PressableScale';
import { RollingText } from '@/components/RollingText';
import { Screen } from '@/components/Screen';
import { StatColumns } from '@/components/StatColumns';
import { Badge, Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { SwipeDays } from '@/components/SwipeDays';
import { Txt } from '@/components/Txt';
import { UpNextCard } from '@/components/UpNextCard';
import { WeekStrip } from '@/components/WeekStrip';
import { CATEGORIES } from '@/data/categories';
import { haptics } from '@/lib/haptics';
import { dayTitle, formatClock, formatDuration, MINUTE, parseKey, splitDuration, todayKey, weekKeys } from '@/lib/time';
import { focusHistory, focusStats } from '@/state/focus';
import { notesStore } from '@/state/notes';
import { useSettings } from '@/state/settings';
import { tasksStore } from '@/state/tasks';
import { useDays, useUsage } from '@/state/usage';
import { useEntering } from '@/theme/motion';
import { refreshWidgets } from '@/widget';
import { useTheme } from '@/theme/useTheme';

export default function TodayScreen() {
  const enter = useEntering();
  const { settings } = useSettings();
  const { colors, accent, accentSoft } = useTheme();
  const { apps, source, refresh } = useUsage();
  const [refreshing, setRefreshing] = useState(false);
  const [dumpOpen, setDumpOpen] = useState(false);
  const focus = focusStats(focusHistory.use());
  const parked = notesStore.use().filter((n) => !n.done).length;
  const openSteps = tasksStore.use().reduce((n, t) => n + t.steps.filter((s) => !s.done).length, 0);

  const today = todayKey();
  const week = useMemo(() => weekKeys(parseKey(today), settings.weekStart), [settings.weekStart, today]);
  const [selected, setSelected] = useState(today);
  const days = useDays(week);
  const index = week.indexOf(selected);
  const day = days[index];

  const goalMs = settings.dailyGoalMinutes * MINUTE;
  const total = day?.totalMs ?? 0;
  const shown = splitDuration(total);
  const isToday = selected === today;

  // Keep the home-screen widget in step with what the app shows.
  const todayTotal = days[week.indexOf(today)]?.totalMs;
  useEffect(() => {
    if (todayTotal != null) refreshWidgets();
  }, [todayTotal, settings.accent, settings.dailyGoalMinutes, settings.theme]);

  const top = day?.apps.slice(0, 5) ?? [];
  const topMs = top[0]?.ms ?? 1;

  return (
    <>
      <Screen
        header={{
          title: isToday ? 'Screen time' : dayTitle(selected),
          subtitle: source === 'demo' ? <Badge label="Sample data" /> : undefined,
          left: { icon: 'ellipsis-horizontal', label: 'Preferences', onPress: () => router.push('/settings') },
          right: { icon: 'bar-chart-outline', label: 'Weekly analytics', onPress: () => router.push('/analytics') },
        }}
        bottom={<PrimaryButton label="Start a focus session" onPress={() => router.push('/focus')} />}
        refreshControl={(top) => (
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.textSecondary}
            colors={[accent]}
            progressViewOffset={top}
            onRefresh={async () => {
              haptics.light();
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        )}
      >
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
          <SwipeDays
            canPrev={index > 0}
            canNext={index < week.length - 1 && week[index + 1] <= today}
            onChange={(dir) => setSelected(week[index + dir])}
          >
            <PressableScale
              haptic="light"
              scaleTo={0.97}
              onPress={() => router.push('/analytics')}
              accessibilityLabel={`${dayTitle(selected)}: ${formatDuration(total)} of screen time. Swipe left or right to change day. Double-tap for analytics.`}
            >
              <DottedDial size={268} progress={total / goalMs} live={isToday}>
                <RollingText text={`${shown.h}h`} variant="hero" />
                <RollingText text={`${String(shown.m).padStart(2, '0')}m`} variant="hero" tone="secondary" />
              </DottedDial>
            </PressableScale>
          </SwipeDays>
          <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
            {goalMessage(total, goalMs, isToday)}
          </Txt>
        </Animated.View>

        <Sheet>
          <DataNotice />

          {isToday && total > goalMs ? (
            <Animated.View entering={enter(2)}>
              <PressableScale
                onPress={() => router.push('/menu')}
                scaleTo={0.98}
                style={[styles.nudge, { backgroundColor: accentSoft }]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles" size={20} color={accent} />
                <View style={{ flex: 1 }}>
                  <Txt variant="callout" weight="600">
                    Craving another scroll?
                  </Txt>
                  <Txt variant="footnote" tone="secondary">
                    Let your dopamine menu pick something better.
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={16} color={accent} />
              </PressableScale>
            </Animated.View>
          ) : null}

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

          {isToday ? (
            <>
              <Animated.View entering={enter(6)}>
                <SectionLabel>Up next</SectionLabel>
              </Animated.View>
              <Animated.View entering={enter(6)}>
                <UpNextCard />
              </Animated.View>
            </>
          ) : null}

          {selected <= today ? (
            <>
              <Animated.View entering={enter(7)}>
                <SectionLabel>{isToday ? 'How are you today?' : `How you felt · ${dayTitle(selected)}`}</SectionLabel>
              </Animated.View>
              <Animated.View entering={enter(7)}>
                <CheckInCard day={selected} />
              </Animated.View>
            </>
          ) : null}

          <Animated.View entering={enter(8)}>
            <SectionLabel>Toolkit</SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(8)}>
            <Card>
              <ListRow
                icon="timer-outline"
                label="Focused today"
                value={`${formatDuration(focus.focusedTodayMs)}${focus.streak > 1 ? ` · ${focus.streak}-day streak` : ''}`}
                onPress={() => router.push('/focus')}
              />
              <Divider inset={48} />
              <ListRow
                icon="file-tray-outline"
                label="Brain dump"
                value={parked ? `${parked} parked` : undefined}
                onPress={() => router.push('/notes')}
                right={
                  <PressableScale
                    hitSlop={8}
                    scaleTo={0.85}
                    onPress={() => setDumpOpen(true)}
                    accessibilityLabel="Park a thought"
                    accessibilityRole="button"
                  >
                    <Ionicons name="add-circle" size={26} color={accent} />
                  </PressableScale>
                }
              />
              <Divider inset={48} />
              <ListRow
                icon="list-outline"
                label="Tasks"
                value={openSteps ? `${openSteps} step${openSteps === 1 ? '' : 's'} to go` : undefined}
                onPress={() => router.push('/tasks')}
              />
              <Divider inset={48} />
              <ListRow icon="sparkles-outline" label="Dopamine menu" onPress={() => router.push('/menu')} />
              <Divider inset={48} />
              <ListRow icon="share-outline" label="Weekly recap" onPress={() => router.push('/recap')} />
            </Card>
          </Animated.View>
        </Sheet>
      </Screen>
      <BrainDumpSheet visible={dumpOpen} onClose={() => setDumpOpen(false)} />
    </>
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
  message: { marginTop: 16, paddingHorizontal: 40 },
  stackPad: { paddingHorizontal: 16, paddingBottom: 16 },
  empty: { padding: 24 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22 },
});
