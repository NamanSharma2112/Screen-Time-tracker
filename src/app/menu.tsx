import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/Buttons';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { SwipeableRow } from '@/components/SwipeableRow';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { addMenuItem, deleteMenuItem, menuStore, randomMenuItem, type MenuItem } from '@/state/menu';

import { useTheme } from '@/theme/useTheme';

/** Delays between shuffle ticks: fast at first, slowing like a wheel coming to rest. */
const TICKS = [45, 50, 55, 60, 70, 80, 95, 115, 140, 175, 220, 280];

export default function MenuScreen() {
  const { accent, accentSoft } = useTheme();
  const items = menuStore.use();
  const [shown, setShown] = useState<MenuItem | undefined>();
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState(false);
  const [draft, setDraft] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const shuffle = () => {
    if (spinning || !items.length) return;
    setSpinning(true);
    setPicked(false);
    let elapsed = 0;
    let current = shown;
    TICKS.forEach((d, i) => {
      elapsed += d;
      timers.current.push(
        setTimeout(() => {
          current = randomMenuItem(items, current?.id);
          setShown(current);
          if (i < TICKS.length - 1) haptics.selection();
          else {
            haptics.success();
            setSpinning(false);
            setPicked(true);
          }
        }, elapsed),
      );
    });
  };

  return (
    <Screen
      header={{ title: 'Dopamine menu', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
      bottom={
        picked && shown?.minutes ? (
          <PrimaryButton
            label={`Start a ${shown.minutes}-minute break`}
            onPress={() =>
              router.push({ pathname: '/focus', params: { minutes: String(shown.minutes), label: shown.text } })
            }
          />
        ) : (
          <PrimaryButton
            label={spinning ? 'Picking…' : shown ? 'Pick another' : 'Pick something for me'}
            onPress={shuffle}
            disabled={spinning}
          />
        )
      }
    >
      <View style={styles.intro}>
        <Txt variant="subhead" tone="secondary" align="center">
          Reaching for your phone out of boredom? Choose something that actually feels good. We’ll pick, so you don’t
          have to decide.
        </Txt>
      </View>

      <View style={styles.pickWrap}>
        <PressableScale
          onPress={shuffle}
          scaleTo={0.98}
          haptic="none"
          accessibilityRole="button"
          accessibilityLabel="Pick something for me"
        >
          <View style={[styles.pickCard, { backgroundColor: accentSoft, borderColor: accent }]}>
            <Ionicons name={picked ? 'sparkles' : 'shuffle'} size={26} color={accent} />
            <View style={styles.reel}>
              <View>
                <Txt variant="title" align="center" numberOfLines={2} accessibilityLiveRegion="polite">
                  {shown?.text ?? 'Tap to pick'}
                </Txt>
              </View>
            </View>
            {shown?.minutes ? (
              <Txt variant="footnote" tone="secondary">
                about {shown.minutes} min
              </Txt>
            ) : null}
          </View>
        </PressableScale>
      </View>

      <Sheet>
        <SectionLabel>Your menu</SectionLabel>
        <Card>
          {items.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Divider inset={16} /> : null}
              <SwipeableRow label={m.text} onDelete={() => deleteMenuItem(m.id)}>
                <MenuRow item={m} />
              </SwipeableRow>
            </View>
          ))}
          <Divider inset={16} />
          <View style={styles.addRow}>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="Add your own (e.g. pet the cat)"
              style={styles.addInput}
              returnKeyType="done"
              onSubmitEditing={() => {
                addMenuItem(draft, 5);
                setDraft('');
                haptics.light();
              }}
            />
          </View>
        </Card>
        <Txt variant="footnote" tone="tertiary" style={styles.tip}>
          Swipe left to remove an idea. Things that move your body or connect you with people work best.
        </Txt>
      </Sheet>
    </Screen>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <Txt variant="body" style={{ flex: 1 }}>
        {item.text}
      </Txt>
      {item.minutes ? (
        <Txt variant="footnote" tone="secondary" tabular>
          {item.minutes}m
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 36, marginTop: 4 },
  pickWrap: { paddingHorizontal: 20, marginTop: 20, marginBottom: 28 },
  pickCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  reel: { minHeight: 56, justifyContent: 'center', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 },
  addRow: { paddingHorizontal: 4, paddingVertical: 4 },
  addInput: { backgroundColor: 'transparent' },
  tip: { paddingHorizontal: 4 },
});
