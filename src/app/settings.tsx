import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState, type ComponentProps } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/Buttons';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { useToast } from '@/components/IslandToast';
import { ListRow } from '@/components/ListRow';
import { LogoLockup } from '@/components/Logo';
import { OptionSheet, type Option } from '@/components/OptionSheet';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Card, Divider, SectionLabel, Sheet } from '@/components/Surfaces';
import { Switch } from '@/components/Switch';
import { Txt } from '@/components/Txt';
import { LEGAL } from '@/legal/config';
import { haptics } from '@/lib/haptics';
import { requestNotifications } from '@/lib/notifications';
import { SettingsPreview, useSettings, type Settings, type ThemePreference } from '@/state/settings';
import { useUsage } from '@/state/usage';
import { ACCENTS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { pinWidget, WIDGET_NAME, widgetsAvailable } from '@/widget';

type PickerKey =
  | 'dailyGoalMinutes'
  | 'timeFormat'
  | 'weekStart'
  | 'fontSize'
  | 'dataSource'
  | 'timeCheckMinutes'
  | 'hyperfocusMinutes'
  | 'hyperfocusScope';

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
  hyperfocusMinutes: {
    title: 'Hyperfocus check-in',
    options: [
      { value: 0, label: 'Off' },
      { value: 30, label: 'After 30 minutes' },
      { value: 45, label: 'After 45 minutes', detail: 'Recommended' },
      { value: 60, label: 'After 1 hour' },
      { value: 90, label: 'After 1½ hours' },
    ],
  },
  hyperfocusScope: {
    title: 'Check in on',
    options: [
      { value: 'distracting', label: 'Social & entertainment apps', detail: 'Leaves work apps alone' },
      { value: 'all', label: 'All apps' },
    ],
  },
  timeCheckMinutes: {
    title: 'Time checks',
    options: [
      { value: 0, label: 'Off' },
      { value: 5, label: 'Every 5 minutes' },
      { value: 10, label: 'Every 10 minutes', detail: 'Recommended — helps with time blindness' },
      { value: 15, label: 'Every 15 minutes' },
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
          haptics.success();
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
  const { eraseAllData } = useSettings();
  const { deviceSupported, permission, requestPermission } = useUsage();
  const [picker, setPicker] = useState<PickerKey | null>(null);
  const [lastPicker, setLastPicker] = useState<PickerKey>('timeFormat');
  const [confirmErase, setConfirmErase] = useState(false);
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
  const version = Constants.expoConfig?.version ?? '1.0.0';
  // Release builds made with NO_INTERNET=1 have no INTERNET permission at all (see app.config.ts).
  const offline = Constants.expoConfig?.extra?.noInternet === true;
  const toast = useToast();
  const addWidget = async (name: string) => {
    const ok = await pinWidget(name);
    toast(
      ok
        ? { title: 'Check your home screen', subtitle: 'Confirm to add the widget', icon: 'grid-outline' }
        : {
            title: 'Add it from your launcher',
            subtitle: 'Long-press the home screen › Widgets',
            icon: 'grid-outline',
            tone: 'neutral',
          },
    );
  };

  return (
    <>
      <Screen
        header={{ title: 'Preferences', left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
        bottom={<PrimaryButton label="Save" onPress={onSave} />}
      >
        <Sheet style={{ marginTop: 8 }}>
          <View>
            <SectionLabel>Theme</SectionLabel>
          </View>
          <View style={styles.themeRow}>
            {themes.map((t) => (
              <ThemeCard
                key={t.value}
                {...t}
                selected={draft.theme === t.value}
                onPress={() => patch({ theme: t.value })}
              />
            ))}
          </View>

          <View>
            <SectionLabel>Main colour</SectionLabel>
          </View>
          <View>
            <Card style={styles.swatches}>
              {ACCENTS.map((c) => (
                <Swatch key={c} color={c} selected={draft.accent === c} onPress={() => patch({ accent: c })} />
              ))}
            </Card>
          </View>

          <View>
            <SectionLabel>Goals & focus</SectionLabel>
          </View>
          <View>
            <Card>
              <ListRow
                icon="flag-outline"
                label="Daily screen time goal"
                value={labelOf('dailyGoalMinutes', draft.dailyGoalMinutes)}
                onPress={() => open('dailyGoalMinutes')}
              />
              <Divider inset={48} />
              <ListRow
                icon="time-outline"
                label="Time checks"
                value={draft.timeCheckMinutes ? `${draft.timeCheckMinutes} min` : 'Off'}
                onPress={() => open('timeCheckMinutes')}
              />
              <Divider inset={48} />
              <ListRow
                icon="notifications-outline"
                label="Session-end reminder"
                right={
                  <Switch
                    label="Session-end reminder"
                    value={draft.focusReminders}
                    onChange={async (v) => {
                      patch({ focusReminders: v });
                      if (v) await requestNotifications();
                    }}
                  />
                }
              />
            </Card>
          </View>

          <SectionLabel>Nudges</SectionLabel>
          <Card>
            <ListRow
              icon="hourglass-outline"
              label="Hyperfocus check-in"
              value={draft.hyperfocusMinutes ? `${draft.hyperfocusMinutes} min` : 'Off'}
              onPress={() => open('hyperfocusMinutes')}
            />
            {draft.hyperfocusMinutes ? (
              <>
                <Divider inset={48} />
                <ListRow
                  icon="apps-outline"
                  label="Applies to"
                  value={draft.hyperfocusScope === 'all' ? 'All apps' : 'Social & fun'}
                  onPress={() => open('hyperfocusScope')}
                />
              </>
            ) : null}
            {widgetsAvailable ? (
              <>
                <Divider inset={48} />
                <ListRow icon="grid-outline" label="Add home-screen widget" onPress={() => addWidget(WIDGET_NAME)} />
              </>
            ) : null}
          </Card>
          <Txt variant="footnote" tone="tertiary" style={styles.footnote}>
            A gentle, one-time nudge when a single app has held you for a while. Android runs this check roughly every
            15 minutes, so it may arrive a little late.
          </Txt>

          <View>
            <SectionLabel>Display & feel</SectionLabel>
          </View>
          <View>
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
              <Divider inset={48} />
              <ListRow
                icon="pulse-outline"
                label="Haptics"
                right={<Switch label="Haptics" value={draft.haptics} onChange={(v) => patch({ haptics: v })} />}
              />
            </Card>
          </View>

          <SectionLabel>Your data</SectionLabel>
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
            <Divider inset={48} />
            <ListRow
              icon="trash-outline"
              label="Delete all data"
              labelColor="#FF3B30"
              onPress={() => setConfirmErase(true)}
            />
          </Card>
          <Txt variant="footnote" tone="tertiary" style={styles.footnote}>
            Everything stays on this device. Nothing is uploaded, shared or sold.
          </Txt>

          <SectionLabel>About</SectionLabel>
          <Card>
            {offline ? (
              <>
                <ListRow icon="cloud-offline-outline" label="Offline by design" value="No internet access" />
                <Divider inset={48} />
              </>
            ) : null}
            <ListRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => openDoc('privacy')} />
            <Divider inset={48} />
            <ListRow icon="document-text-outline" label="Terms of Use" onPress={() => openDoc('terms')} />
            <Divider inset={48} />
            <ListRow icon="medkit-outline" label="Health Disclaimer" onPress={() => openDoc('health')} />
            <Divider inset={48} />
            <ListRow icon="code-slash-outline" label="Open-source licences" onPress={() => router.push('/licenses')} />
            <Divider inset={48} />
            <ListRow
              icon="mail-outline"
              label="Contact support"
              onPress={() =>
                Linking.openURL(`mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent(LEGAL.appName)}`)
              }
            />
          </Card>
          <View style={styles.version}>
            <LogoLockup size={56} subtitle={`Version ${version} · Not a medical device`} />
          </View>
        </Sheet>
      </Screen>

      <OptionSheet
        visible={picker != null}
        title={pk.title}
        options={pk.options}
        value={draft[lastPicker] as string | number}
        onSelect={(v) => patch({ [lastPicker]: v } as Partial<Settings>)}
        onClose={() => setPicker(null)}
      />
      <ConfirmSheet
        visible={confirmErase}
        title="Delete all data?"
        message="This erases your preferences, focus history and brain-dump notes from this device and restarts setup. Your Android usage history isn’t affected. This can’t be undone."
        confirmLabel="Delete all data"
        destructive
        onClose={() => setConfirmErase(false)}
        onConfirm={async () => {
          setConfirmErase(false);
          await eraseAllData();
        }}
      />
    </>
  );
}

const openDoc = (doc: 'privacy' | 'terms' | 'health') => router.push({ pathname: '/legal/[doc]', params: { doc } });

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
  return (
    <PressableScale
      containerStyle={{ flex: 1 }}
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} theme`}
      style={[styles.themeCard, { backgroundColor: colors.card, borderColor: selected ? accent : 'transparent' }]}
    >
      <View style={[styles.themeTile, { backgroundColor: selected ? accentSoft : colors.sheet }]}>
        <Ionicons name={icon} size={24} color={selected ? accent : colors.text} />
      </View>
      <Txt variant="callout" weight={selected ? '700' : '500'} tone={selected ? 'primary' : 'secondary'}>
        {label}
      </Txt>
    </PressableScale>
  );
}

function Swatch({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
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
      {selected ? <View style={[styles.swatchRing, { borderColor: color }]} /> : null}
      <View style={[styles.swatch, { backgroundColor: color }, selected && { transform: [{ scale: 0.78 }] }]} />
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
  version: { marginTop: 24, marginBottom: 12, alignItems: 'center' },
});
