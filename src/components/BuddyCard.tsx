import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { buddyLine, buddyMood, cookieLabel, cookiesOn } from '@/buddy/cookies';
import { FocusBuddy } from '@/buddy/FocusBuddy';
import { dateKey, todayKey } from '@/lib/time';
import { focusHistory } from '@/state/focus';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Card } from './Surfaces';
import { Txt } from './Txt';

/** Today's glance at the focus buddy: fed by today's focus sessions. Tap to go and focus. */
export function BuddyCard() {
  const history = focusHistory.use();
  const { colors } = useTheme();
  const today = todayKey();
  const cookies = useMemo(() => cookiesOn(history, (t) => dateKey(new Date(t)) === today), [history, today]);
  const mood = buddyMood(cookies);

  return (
    <PressableScale
      onPress={() => router.push('/focus')}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Your focus buddy: ${cookieLabel(cookies)}. ${buddyLine(cookies)} Opens Focus.`}
    >
      <Card style={styles.card}>
        <View style={[styles.box, { backgroundColor: colors.sheet }]}>
          <FocusBuddy size={96} mood={mood} feeds={cookies} celebrating={false} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Txt variant="headline" style={{ flex: 1 }} numberOfLines={1}>
              Your buddy
            </Txt>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
          <Txt variant="footnote" tone="secondary">
            🍪 {cookieLabel(cookies)}
          </Txt>
          <Txt variant="footnote" tone="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
            {buddyLine(cookies)}
          </Txt>
        </View>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  box: { width: 104, height: 104, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
