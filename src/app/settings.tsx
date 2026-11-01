import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE, BottomBar, PrimaryButton } from '@/components/Buttons';
import { ListRow } from '@/components/ListRow';
import { OptionSheet, type Option } from '@/components/OptionSheet';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { SettingsPreview, useSettings, type Settings, type ThemePreference } from '@/state/settings';
import { useUsage } from '@/state/usage';
import { ACCENTS } from '@/theme/colors';
import { useEntering, springs } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

type PickerKey = 'dailyGoalMinutes' | 'timeFormat' | 'weekStart' | 'fontSize' | 'dataSource';

const PICKERS: { [K in PickerKey]: { title: string; options: Option<Settings[K]>[] } } = {
  dailyGoalMinutes: {
    title: 'Daily goal',
    options: [1, 2, 3, 4, 5, 6, 8].map((h) => ({ value: h * 60, label: `${h} hour${h > 1 ? 's' : ''}` })),
  },
  timeFormat: {
    title: 'Time format',
    options: [
      { value: '12h', label: '12-hour', detail: '9:41 PM' },
      { value: '24h', label: '24-hour', detail: '21:41' },
    ],
  },
  weekStart: {
    title: 'Week starts on',
    options: [
      { value: 0, label: 'Sunday' },
      { value: 1, label: 'Monday' },
    ],
  },
  fontSize: {
    title: 'Font size',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  dataSource: {
    title: 'Data source',
    options: [
      { value: 'device', label: 'This device', detail: 'Real usage from Android Usage Access' },
      { value: 'demo', label: 'Sample data', detail: 'A realistic demo week to explore the app' },
    ],
  },
};

const labelOf = <K extends PickerKey>(key: K, value: Settings[K]) =>
  PICKERS[key].options.find((o) => o.value === value)?.label ?? String(value);

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const [draft, setDraft] = useState(settings);
  const patch = (p: Partial<Settings>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <SettingsPreview.Provider value={draft}>
      <SettingsContent
        draft={draft}
        patch={patch}
        onSave={() => {
          update(draft);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        }}
      />
    </SettingsPreview.Provider>
  );
}

function SettingsContent({
  draft,
  patch,
  onSave,
}: {
  draft: Settings;
  patch: (p: Partial<Settings>) => void;
  onSave: () => void;
}) {
  const enter = useEntering();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { deviceSupported, permission, requestPermission } = useUsage();
  const [picker, setPicker] = useState<PickerKey | null>(null);
  const [lastPicker, setLastPicker] = useState<PickerKey>('timeFormat');
  const open = (k: PickerKey) => {
    setLastPicker(k);
    setPicker(k);
  };

  const themes: { value: ThemePreference; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const pk = PICKERS[lastPicker] as { title: string; options: Option<string | number>[] };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Preferences" left={{ icon: 'arrow-back', label: 'Back', onPress: () => router.back() }} />

        <Sheet style={{ paddingBottom: BOTTOM_BAR_SPACE, marginTop: 8 }}>
          <Animated.View entering={enter(0)}>
            <SectionLabel>Theme</SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(1)} style={styles.themeRow}>
            {themes.map((t) => (
              <ThemeCard
                key={t.value}
                {...t}
                selected={draft.theme === t.value}
                onPress={() => patch({ theme: t.value })}
              />
            ))}
          </Animated.View>

          <Animated.View entering={enter(2)}>
            <SectionLabel>Main colour</SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(3)}>
            <Card style={styles.swatches}>
              {ACCENTS.map((c) => (
                <Swatch key={c} color={c} selected={draft.accent === c} onPress={() => patch({ accent: c })} />
              ))}
            </Card>
          </Animated.View>

          <Animated.View entering={enter(4)}>
            <SectionLabel>Goals</SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(5)}>
            <Card>
              <ListRow
                icon="flag-outline"
                label="Daily screen time goal"
                value={labelOf('dailyGoalMinutes', draft.dailyGoalMinutes)}
                onPress={() => open('dailyGoalMinutes')}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={enter(6)}>
            <SectionLabel>Data display</SectionLabel>
          </Animated.View>
          <Animated.View entering={enter(7)}>
            <Card>
              <ListRow
                icon="time-outline"
                label="Time format"
                value={labelOf('timeFormat', draft.timeFormat)}
                onPress={() => open('timeFormat')}
              />
              <Divider inset={48} />
              <ListRow
                icon="calendar-outline"
                label="Week starts on"
                value={labelOf('weekStart', draft.weekStart)}
                onPress={() => open('weekStart')}
              />
              <Divider inset={48} />
              <ListRow
                icon="text-outline"
                label="Font size"
                value={labelOf('fontSize', draft.fontSize)}
                onPress={() => open('fontSize')}
              />
            </Card>
          </Animated.View>

          <SectionLabel>Data</SectionLabel>
          <Card>
            <ListRow
              icon="phone-portrait-outline"
              label="Source"
              value={labelOf('dataSource', draft.dataSource)}
              onPress={() => open('dataSource')}
            />
            {deviceSupported ? (
              <>
                <Divider inset={48} />
                <ListRow
                  icon="lock-open-outline"
                  label="Usage access"
                  value={permission ? 'Allowed' : 'Off'}
                  onPress={requestPermission}
                />
              </>
            ) : null}
          </Card>
          <Txt variant="footnote" tone="tertiary" style={styles.footnote}>
            Your usage data never leaves this device.
          </Txt>
        </Sheet>
      </ScrollView>

      <BottomBar>
        <PrimaryButton label="Save" onPress={onSave} />
      </BottomBar>

      <OptionSheet
        visible={picker != null}
        title={pk.title}
        options={pk.options}
        value={draft[lastPicker] as string | number}
        onSelect={(v) => patch({ [lastPicker]: v } as Partial<Settings>)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function ThemeCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, accent, accentSoft } = useTheme();
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.set(withSpring(selected ? 1 : 0, springs.smooth));
  }, [selected, s]);
  const frame = useAnimatedStyle(() => ({
    borderColor: interpolateColor(s.value, [0, 1], ['rgba(0,0,0,0)', accent]),
  }));
  const tile = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.value, [0, 1], [colors.sheet, accentSoft]),
  }));

  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} theme`}
    >
      <Animated.View style={[styles.themeCard, { backgroundColor: colors.card }, frame]}>
        <Animated.View style={[styles.themeTile, tile]}>
          <Ionicons name={icon} size={24} color={selected ? accent : colors.text} />
        </Animated.View>
        <Txt variant="callout" weight={selected ? '700' : '500'} tone={selected ? 'primary' : 'secondary'}>
          {label}
        </Txt>
      </Animated.View>
    </PressableScale>
  );
}

function Swatch({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.set(withSpring(selected ? 1 : 0, springs.pop));
  }, [selected, s]);
  const ring = useAnimatedStyle(() => ({ opacity: s.value, transform: [{ scale: 0.85 + s.value * 0.15 }] }));
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: 1 - s.value * 0.22 }] }));

  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      style={styles.swatchSlot}
      onPress={onPress}
      scaleTo={0.92}
      hitSlop={4}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Colour ${color}`}
    >
      <Animated.View style={[styles.swatchRing, { borderColor: color }, ring]} />
      <Animated.View style={[styles.swatch, { backgroundColor: color }, dot]} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8 },
  themeCard: { borderRadius: 22, padding: 6, paddingBottom: 12, alignItems: 'center', gap: 10, borderWidth: 1.5 },
  themeTile: { alignSelf: 'stretch', height: 76, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  swatches: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 6 },
  swatchSlot: { alignItems: 'center', justifyContent: 'center', height: 40 },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  swatchRing: { position: 'absolute', width: 38, height: 38, borderRadius: 19, borderWidth: 2 },
  footnote: { paddingHorizontal: 4 },
});
