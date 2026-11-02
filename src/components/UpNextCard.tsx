import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { requestNotifications } from '@/lib/notifications';
import { formatClock, formatDuration, MINUTE } from '@/lib/time';
import { useSettings } from '@/state/settings';
import { addTransition, deleteTransition, transitionsStore, upcoming } from '@/state/transitions';
import { useTheme } from '@/theme/useTheme';

import { ProgressLine } from './Bars';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { useToast } from './IslandToast';
import { PressableScale } from './PressableScale';
import { Card, Divider } from './Surfaces';
import { TextField } from './TextField';
import { Txt } from './Txt';

/** Today's "up next" list with a live countdown, so the next switch never comes as a surprise. */
export function UpNextCard() {
  const { accent } = useTheme();
  const { settings } = useSettings();
  const items = transitionsStore.use();
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const list = upcoming(items, now).slice(0, 3);

  return (
    <>
      <Card>
        {list.map((t, i) => {
          const left = t.at - now;
          const soon = left <= t.warnMinutes * MINUTE;
          return (
            <View key={t.id}>
              {i > 0 ? <Divider inset={16} /> : null}
              <View style={styles.item}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.itemTop}>
                    <Txt variant="callout" weight="600" style={{ flex: 1 }} numberOfLines={1}>
                      {t.title}
                    </Txt>
                    <Txt
                      variant="footnote"
                      weight={soon ? '700' : '500'}
                      color={soon ? accent : undefined}
                      tone="secondary"
                      tabular
                    >
                      {left <= 0 ? 'now' : `in ${formatDuration(left)}`}
                    </Txt>
                  </View>
                  {/* Fills over the last hour so the approach is visible at a glance. */}
                  <ProgressLine
                    value={1 - Math.min(1, Math.max(0, left) / (60 * MINUTE))}
                    color={soon ? accent : '#A6A6AE'}
                    height={3}
                  />
                  <Txt variant="caption" tone="tertiary">
                    {formatClock(t.at, settings.timeFormat)} · heads-up {t.warnMinutes} min before
                  </Txt>
                </View>
                <PressableScale
                  hitSlop={10}
                  scaleTo={0.85}
                  onPress={() => {
                    haptics.light();
                    deleteTransition(t.id);
                  }}
                  accessibilityLabel={`Remove ${t.title}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={22} color="#A6A6AE" />
                </PressableScale>
              </View>
            </View>
          );
        })}
        {list.length ? <Divider inset={16} /> : null}
        <PressableScale onPress={() => setOpen(true)} scaleTo={0.98} style={styles.add} accessibilityRole="button">
          <Ionicons name="add-circle" size={22} color={accent} />
          <Txt variant="callout" tone={list.length ? 'secondary' : 'primary'}>
            {list.length ? 'Add another' : 'What’s your next thing? Get a heads-up'}
          </Txt>
        </PressableScale>
      </Card>
      <AddTransitionSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const QUICK = [15, 30, 60, 120];
const WARN = [5, 10, 15, 30];

export function AddTransitionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [title, setTitle] = useState('');
  const [at, setAt] = useState<number | null>(null);
  const [warn, setWarn] = useState(10);
  const [quick, setQuick] = useState<number | null>(null);

  const pickTime = () => {
    if (Platform.OS !== 'android') return;
    // Native Android time dialog. Loaded lazily: the module doesn't exist on web.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
    const base = new Date(at ?? Date.now() + 30 * MINUTE);
    DateTimePickerAndroid.open({
      value: base,
      mode: 'time',
      is24Hour: settings.timeFormat === '24h',
      onChange: (_: unknown, date?: Date) => {
        if (!date) return;
        const d = new Date();
        d.setHours(date.getHours(), date.getMinutes(), 0, 0);
        if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); // a time that has passed means tomorrow
        setAt(d.getTime());
        setQuick(null);
      },
    });
  };

  const save = async () => {
    if (!at) return;
    const allowed = await requestNotifications();
    await addTransition(title, at, warn);
    toast({
      title: 'Heads-up set',
      subtitle: allowed ? `We’ll nudge you ${warn} min before` : 'Turn on notifications to get the nudge',
      icon: 'alarm-outline',
      tone: 'success',
      haptic: 'success',
    });
    setTitle('');
    setAt(null);
    setQuick(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Up next">
      <TextField value={title} onChangeText={setTitle} placeholder="e.g. Leave for the gym" autoFocus />
      <Txt variant="footnote" tone="secondary" style={styles.label}>
        When
      </Txt>
      <View style={styles.chips}>
        {QUICK.map((m) => (
          <SmallChip
            key={m}
            label={m < 60 ? `in ${m}m` : `in ${m / 60}h`}
            selected={quick === m}
            onPress={() => {
              setQuick(m);
              setAt(Math.round((Date.now() + m * MINUTE) / MINUTE) * MINUTE);
            }}
          />
        ))}
        {Platform.OS === 'android' ? <SmallChip label="Pick time…" selected={false} onPress={pickTime} /> : null}
      </View>
      {at ? (
        <Txt variant="footnote" tone="secondary" style={styles.when}>
          At {formatClock(at, settings.timeFormat)}
        </Txt>
      ) : null}
      <Txt variant="footnote" tone="secondary" style={styles.label}>
        Heads-up
      </Txt>
      <View style={styles.chips}>
        {WARN.map((m) => (
          <SmallChip key={m} label={`${m} min before`} selected={warn === m} onPress={() => setWarn(m)} />
        ))}
      </View>
      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Set heads-up" onPress={save} disabled={!at} />
      </View>
    </BottomSheet>
  );
}

function SmallChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, accent, accentSoft } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        { backgroundColor: selected ? accentSoft : colors.card, borderColor: selected ? accent : 'transparent' },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Txt variant="footnote" weight="600" color={selected ? accent : undefined}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, minHeight: 52 },
  label: { marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5 },
  when: { marginTop: 8, paddingHorizontal: 4 },
});
