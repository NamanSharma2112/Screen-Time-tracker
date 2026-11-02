import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View, type ViewInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { PrimaryButton } from '@/components/Buttons';
import { useToast } from '@/components/IslandToast';
import { PressableScale } from '@/components/PressableScale';
import { RecapCard, type RecapData } from '@/components/RecapCard';
import { Screen } from '@/components/Screen';
import { Bone, SkeletonPulse } from '@/components/Skeleton';
import { Txt } from '@/components/Txt';
import { averageMs } from '@/data/aggregate';
import type { DayUsage } from '@/data/types';
import { haptics } from '@/lib/haptics';
import { useDeferredRender } from '@/lib/useDeferredRender';
import { addDays, dateKey, dayLetter, dayLong, formatRange, MINUTE, parseKey, todayKey, weekKeys } from '@/lib/time';
import { focusHistory } from '@/state/focus';
import { useSettings } from '@/state/settings';
import { useDays, useUsage } from '@/state/usage';
import { useTheme } from '@/theme/useTheme';

export default function RecapScreen() {
  const { settings } = useSettings();
  const { accent, colors } = useTheme();
  const { apps } = useUsage();
  const toast = useToast();
  const history = focusHistory.use();
  const cardRef = useRef<ViewInstance>(null);
  const [which, setWhich] = useState<0 | -1>(0);
  const [sharing, setSharing] = useState(false);

  const today = todayKey();
  const anchorKey = dateKey(addDays(parseKey(today), which * 7));
  const week = weekKeys(parseKey(anchorKey), settings.weekStart);
  const prevWeek = weekKeys(addDays(parseKey(anchorKey), -7), settings.weekStart);
  const days = useDays(week);
  const prev = useDays(prevWeek);
  const real = days.filter((d): d is DayUsage => !!d);

  const avg = averageMs(days);
  const prevAvg = averageMs(prev);
  const byApp = new Map<string, number>();
  real.forEach((d) => d.apps.forEach((a) => byApp.set(a.appId, (byApp.get(a.appId) ?? 0) + a.ms)));
  const start = parseKey(week[0]).getTime();
  const end = addDays(parseKey(week[6]), 1).getTime();
  const focus = history.filter((r) => r.start >= start && r.start < end);
  const best = real.filter((d) => d.totalMs > 0).sort((a, b) => a.totalMs - b.totalMs)[0];

  const ready = useDeferredRender(true);

  const data: RecapData = {
    range: formatRange(week[0], week[6]),
    avgMs: avg,
    delta: prevAvg > 0 ? (avg - prevAvg) / prevAvg : null,
    days: week.map((k, i) => ({ label: dayLetter(k), ms: days[i]?.totalMs ?? 0 })),
    goalMs: settings.dailyGoalMinutes * MINUTE,
    topApps: [...byApp.entries()].sort((a, b) => b[1] - a[1]).map(([id, ms]) => ({ app: apps[id], ms })),
    focusMs: focus.reduce((s, r) => s + (r.end - r.start), 0),
    focusSessions: focus.filter((r) => r.completed).length,
    pickupsAvg: averageMs(days, (d) => d.pickups),
    bestDay: best && real.length > 1 ? dayLong(best.key) : undefined,
  };

  const share = async () => {
    if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
      toast({
        title: 'Sharing works in the app',
        subtitle: 'Open it on your phone to share',
        icon: 'phone-portrait-outline',
        tone: 'neutral',
      });
      return;
    }
    try {
      setSharing(true);
      haptics.light();
      const uri = await captureRef(cardRef as Parameters<typeof captureRef>[0], {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your week' });
    } catch {
      toast({ title: 'Couldn’t create the image', icon: 'alert-circle-outline', tone: 'neutral' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen
      header={{ title: 'Weekly recap', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
      bottom={<PrimaryButton label={sharing ? 'Preparing…' : 'Share image'} onPress={share} disabled={sharing} />}
    >
      <View style={[styles.segment, { backgroundColor: colors.card }]}>
        {([0, -1] as const).map((w) => (
          <PressableScale
            key={w}
            containerStyle={{ flex: 1 }}
            onPress={() => setWhich(w)}
            style={[styles.segmentItem, which === w && { backgroundColor: colors.sheet }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: which === w }}
          >
            <Txt variant="footnote" weight="600" tone={which === w ? 'primary' : 'secondary'}>
              {w === 0 ? 'This week' : 'Last week'}
            </Txt>
          </PressableScale>
        ))}
      </View>
      <View key={which} style={styles.cardWrap}>
        {ready && real.length ? (
          <RecapCard ref={cardRef} data={data} accent={accent} />
        ) : (
          <SkeletonPulse>
            <Bone w={320} h={569} r={32} />
          </SkeletonPulse>
        )}
      </View>
      <Txt variant="footnote" tone="tertiary" align="center" style={styles.note}>
        The image is made on your phone. Nothing is uploaded unless you choose where to share it.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', marginHorizontal: 40, borderRadius: 12, padding: 3, marginTop: 4 },
  segmentItem: { alignItems: 'center', justifyContent: 'center', height: 32, borderRadius: 9 },
  cardWrap: { alignItems: 'center', marginTop: 20 },
  note: { paddingHorizontal: 40, marginTop: 16, marginBottom: 12 },
});
