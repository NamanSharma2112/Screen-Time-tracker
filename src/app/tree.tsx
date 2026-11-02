import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ProgressLine } from '@/components/Bars';
import { Screen } from '@/components/Screen';
import { StatColumns } from '@/components/StatColumns';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { stageProgress } from '@/components/TreeCard';
import { TreeView } from '@/components/TreeView';
import { Txt } from '@/components/Txt';
import { dayLetter, MINUTE } from '@/lib/time';
import { useSettings } from '@/state/settings';
import { useUsage } from '@/state/usage';
import { treeMessage } from '@/tree/copy';
import { useTree } from '@/tree/useTree';
import { useTheme } from '@/theme/useTheme';

const GREEN = '#34C759';

export default function TreeScreen() {
  const tree = useTree();
  const { settings } = useSettings();
  const { source } = useUsage();
  const { colors } = useTheme();
  const goalMs = settings.dailyGoalMinutes * MINUTE;

  return (
    <Screen header={{ title: 'Your tree', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}>
      <View style={styles.hero}>
        <TreeView model={tree} size={240} />
        <Txt variant="title" align="center">
          {tree.stageName}
        </Txt>
        <Txt variant="subhead" tone="secondary" align="center" style={styles.message}>
          {treeMessage(tree, goalMs)}
        </Txt>
      </View>

      <Sheet>
        <Card>
          <StatColumns
            stats={[
              { value: String(tree.growth), label: tree.growth === 1 ? 'Leaf' : 'Leaves' },
              { value: `${tree.streak}d`, label: 'Streak' },
              { value: `${tree.bestStreak}d`, label: 'Best streak' },
            ]}
          />
          {tree.toNext != null && tree.nextStageName ? (
            <>
              <Divider />
              <View style={styles.next}>
                <View style={styles.nextRow}>
                  <Txt variant="callout" weight="600" style={{ flex: 1 }}>
                    Next: {tree.nextStageName}
                  </Txt>
                  <Txt variant="footnote" tone="secondary">
                    {tree.toNext} more {tree.toNext === 1 ? 'leaf' : 'leaves'}
                  </Txt>
                </View>
                <ProgressLine value={stageProgress(tree)} color={GREEN} height={6} />
              </View>
            </>
          ) : null}
        </Card>

        <SectionLabel>Last 14 days</SectionLabel>
        <Card style={styles.days}>
          {tree.recent.length === 0 ? (
            <Txt variant="footnote" tone="tertiary" align="center" style={{ flex: 1 }}>
              Your days will show up here.
            </Txt>
          ) : (
            tree.recent.map((d) => (
              <View
                key={d.key}
                style={styles.day}
                accessibilityLabel={`${d.key}: ${d.met ? 'under goal' : 'over goal'}`}
              >
                <View
                  style={[
                    styles.dayDot,
                    d.met ? { backgroundColor: GREEN } : { borderWidth: 1.5, borderColor: colors.textTertiary },
                  ]}
                />
                <Txt variant="caption" tone="tertiary">
                  {dayLetter(d.key)}
                </Txt>
              </View>
            ))
          )}
        </Card>

        <SectionLabel>How it works</SectionLabel>
        <Card style={styles.how}>
          {[
            ['🌱', 'Every day you finish under your goal grows one new leaf.'],
            ['🌤️', 'Over your goal? Your tree looks a bit tired — and perks up after your next good day.'],
            ['💚', 'It never dies and never loses leaves. Progress is kept, always.'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.howRow}>
              <Txt variant="body">{icon}</Txt>
              <Txt variant="subhead" tone="secondary" style={{ flex: 1 }}>
                {text}
              </Txt>
            </View>
          ))}
        </Card>
        {source === 'demo' ? (
          <Txt variant="footnote" tone="tertiary" align="center">
            Showing a sample tree. Yours starts growing once usage access is on.
          </Txt>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, paddingHorizontal: 32, marginBottom: 24 },
  message: { marginTop: 2 },
  next: { padding: 16, gap: 10 },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14 },
  day: { alignItems: 'center', gap: 6 },
  dayDot: { width: 14, height: 14, borderRadius: 7 },
  how: { padding: 16, gap: 14 },
  howRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
