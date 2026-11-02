import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MINUTE } from '@/lib/time';
import { useSettings } from '@/state/settings';
import { treeMessage } from '@/tree/copy';
import { STAGES, type TreeModel } from '@/tree/model';
import { useTree } from '@/tree/useTree';
import { useTheme } from '@/theme/useTheme';

import { ProgressLine } from './Bars';
import { PressableScale } from './PressableScale';
import { Card } from './Surfaces';
import { TreeView } from './TreeView';
import { Txt } from './Txt';

/** Today's glance at the streak tree; tap for the full view. */
export function TreeCard() {
  const tree = useTree();
  const { settings } = useSettings();
  const { colors } = useTheme();
  const leafGreen = '#34C759';

  return (
    <PressableScale
      onPress={() => router.push('/tree')}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Your tree: ${tree.stageName}, ${tree.growth} leaves, ${tree.streak}-day streak`}
    >
      <Card style={styles.card}>
        <View style={[styles.treeBox, { backgroundColor: colors.sheet }]}>
          <TreeView model={tree} size={96} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Txt variant="headline" style={{ flex: 1 }} numberOfLines={1}>
              {tree.stageName}
            </Txt>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
          <Txt variant="footnote" tone="secondary">
            {tree.growth} {tree.growth === 1 ? 'leaf' : 'leaves'} · {tree.streak}-day streak
          </Txt>
          <Txt variant="footnote" tone="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
            {treeMessage(tree, settings.dailyGoalMinutes * MINUTE)}
          </Txt>
          {tree.toNext != null ? (
            <ProgressLine value={stageProgress(tree)} color={leafGreen} height={4} style={{ marginTop: 8 }} />
          ) : null}
        </View>
      </Card>
    </PressableScale>
  );
}

/** Fraction of the way from the current stage to the next. */
export function stageProgress(tree: TreeModel) {
  if (tree.toNext == null) return 1;
  const from = STAGES[tree.stage].min;
  const to = tree.growth + tree.toNext;
  return to > from ? (tree.growth - from) / (to - from) : 0;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  treeBox: { width: 104, height: 104, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
