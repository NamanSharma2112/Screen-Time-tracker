import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { BrainDumpSheet } from '@/components/BrainDumpSheet';
import { CheckInCard } from '@/components/CheckInCard';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { AddTransitionSheet, UpNextCard } from '@/components/UpNextCard';
import { formatDuration, todayKey } from '@/lib/time';
import { focusHistory, focusStats } from '@/state/focus';
import { notesStore } from '@/state/notes';
import { taskProgress, tasksStore } from '@/state/tasks';
import { transitionsStore, upcoming } from '@/state/transitions';
import { useTheme } from '@/theme/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const QUICK = [5, 15, 25, 45];

/**
 * The Focus tab: first ask, then do. Every option is phrased as the feeling you have right now,
 * and one tap takes you straight into the tool that helps — no hunting through menus.
 */
export default function ToolsScreen() {
  const { accent, accentSoft } = useTheme();
  const focus = focusStats(focusHistory.use());
  const parked = notesStore.use().filter((n) => !n.done).length;
  const tasks = tasksStore.use();
  const nextTask = tasks.map((t) => ({ t, p: taskProgress(t) })).find((x) => x.p.next);
  const hasUpcoming = upcoming(transitionsStore.use()).length > 0;

  const [sheet, setSheet] = useState<null | 'dump' | 'next' | 'checkin'>(null);
  const close = () => setSheet(null);

  return (
    <>
      <Screen
        header={{
          title: 'Focus',
          left: { icon: 'ellipsis-horizontal', label: 'Preferences', onPress: () => router.push('/settings') },
        }}
      >
        <View style={styles.intro}>
          <Txt variant="largeTitle" align="center">
            What do you need{'\n'}right now?
          </Txt>
          <Txt variant="subhead" tone="secondary" align="center">
            Pick one. We’ll take it from there.
          </Txt>
        </View>

        <Sheet>
          {/* The most common need gets one-tap starts. */}
          <View>
            <View style={[styles.hero, { backgroundColor: accentSoft }]}>
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: accent }]}>
                  <Ionicons name="timer" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">I want to focus</Txt>
                  <Txt variant="footnote" tone="secondary">
                    Tap a length to start right away
                  </Txt>
                </View>
              </View>
              <View style={styles.quickRow}>
                {QUICK.map((m) => (
                  <PressableScale
                    key={m}
                    haptic="light"
                    containerStyle={{ flex: 1 }}
                    style={[styles.quick, { backgroundColor: accent }]}
                    onPress={() => router.push({ pathname: '/focus', params: { minutes: String(m), autostart: '1' } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${m} minute focus session`}
                  >
                    <Txt variant="headline" color="#fff">
                      {m}
                    </Txt>
                    <Txt variant="caption" color="rgba(255,255,255,0.85)">
                      min
                    </Txt>
                  </PressableScale>
                ))}
              </View>
              {focus.focusedTodayMs > 0 ? (
                <Txt variant="footnote" tone="secondary" align="center">
                  {formatDuration(focus.focusedTodayMs)} focused today
                  {focus.streak > 1 ? ` · ${focus.streak}-day streak` : ''}
                </Txt>
              ) : null}
            </View>
          </View>

          <View>
            <Card>
              <Need
                icon="layers"
                color="#2F8CFF"
                title="It feels too big to start"
                action={nextTask ? `Next: ${nextTask.p.next!.text}` : 'Break it into tiny steps'}
                onPress={() =>
                  nextTask
                    ? router.push({ pathname: '/tasks/[id]', params: { id: nextTask.t.id } })
                    : router.push('/tasks')
                }
              />
              <Divider inset={68} />
              <Need
                icon="cloud"
                color="#7B5CFF"
                title="My head is too busy"
                action={parked ? `Brain dump · ${parked} parked` : 'Get the thought out — brain dump'}
                onPress={() => setSheet('dump')}
              />
              <Divider inset={68} />
              <Need
                icon="phone-portrait"
                color="#FF4D5E"
                title="I keep reaching for my phone"
                action="Pick something better to do"
                onPress={() => router.push('/menu')}
              />
              <Divider inset={68} />
              <Need
                icon="alarm"
                color="#F7B32B"
                title="Something’s coming up"
                action="Get a heads-up before it"
                onPress={() => setSheet('next')}
              />
              <Divider inset={68} />
              <Need
                icon="happy"
                color="#2ED47A"
                title="How am I doing?"
                action="10-second check-in"
                onPress={() => setSheet('checkin')}
              />
            </Card>
          </View>

          {hasUpcoming ? (
            <>
              <SectionLabel>Up next</SectionLabel>
              <UpNextCard />
            </>
          ) : null}

          {parked || tasks.length ? (
            <>
              <SectionLabel>Your lists</SectionLabel>
              <Card>
                <ListLink
                  icon="list-outline"
                  label="Tasks"
                  value={tasks.length ? String(tasks.length) : ''}
                  onPress={() => router.push('/tasks')}
                />
                <Divider inset={50} />
                <ListLink
                  icon="file-tray-outline"
                  label="Brain dump"
                  value={parked ? String(parked) : ''}
                  onPress={() => router.push('/notes')}
                />
              </Card>
            </>
          ) : null}
        </Sheet>
      </Screen>

      <BrainDumpSheet visible={sheet === 'dump'} onClose={close} />
      <AddTransitionSheet visible={sheet === 'next'} onClose={close} />
      <BottomSheet visible={sheet === 'checkin'} onClose={close} title="How are you right now?">
        <CheckInCard day={todayKey()} />
        <Txt variant="footnote" tone="tertiary" align="center" style={styles.checkinNote}>
          Saved as you tap. See patterns in Insights.
        </Txt>
      </BottomSheet>
    </>
  );
}

/** One "need": a coloured icon, the feeling in plain words, and what tapping does. */
function Need({
  icon,
  color,
  title,
  action,
  onPress,
}: {
  icon: IconName;
  color: string;
  title: string;
  action: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={styles.need}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${action}`}
    >
      <View style={[styles.needIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="callout" weight="600">
          {title}
        </Txt>
        <Txt variant="footnote" tone="secondary" numberOfLines={1}>
          {action}
        </Txt>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </PressableScale>
  );
}

function ListLink({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colors, accent } = useTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.link} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={accent} />
      <Txt variant="callout" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="callout" tone="secondary">
        {value}
      </Txt>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 32, gap: 6, marginTop: 4, marginBottom: 24 },
  hero: { borderRadius: 24, padding: 16, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 8 },
  quick: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  need: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  needIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 },
  checkinNote: { marginTop: 12, marginBottom: 4 },
});
