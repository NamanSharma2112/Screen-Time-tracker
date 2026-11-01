import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { AppState, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE, BottomBar, PrimaryButton } from '@/components/Buttons';
import { DottedDial } from '@/components/DottedDial';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { hasUsagePermission } from '@/data/device';
import { LEGAL } from '@/legal/config';
import { requestNotifications } from '@/lib/notifications';
import { useSettings } from '@/state/settings';
import { useUsage } from '@/state/usage';
import { timings, useEntering } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

type Step = 'welcome' | 'privacy' | 'usage' | 'notifications';
const FIRST_RUN: Step[] = ['welcome', 'privacy', 'usage', 'notifications'];
/** Returning users who only need to re-accept updated terms. */
const RE_ACCEPT: Step[] = ['privacy'];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const steps = settings.acceptedTermsVersion > 0 ? RE_ACCEPT : FIRST_RUN;
  const [index, setIndex] = useState(0);
  const step = steps[index];

  const next = () => {
    if (index < steps.length - 1) setIndex(index + 1);
    // Accepting flips the route guard and Expo Router moves us to Today.
    else update({ acceptedTermsVersion: LEGAL.version });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet }}>
      {steps.length > 1 ? <PageDots count={steps.length} index={index} top={insets.top + 16} /> : null}
      <Animated.View
        key={step}
        entering={FadeInRight.duration(380)}
        exiting={FadeOutLeft.duration(180)}
        style={{ flex: 1 }}
      >
        {step === 'welcome' && <Welcome onNext={next} />}
        {step === 'privacy' && <Privacy onNext={next} returning={steps === RE_ACCEPT} />}
        {step === 'usage' && <UsageAccess onNext={next} />}
        {step === 'notifications' && (
          <Notifications
            onNext={(enabled) => {
              update({ focusReminders: enabled });
              next();
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

/* ---------- steps ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  const enter = useEntering();
  return (
    <Page footer={<PrimaryButton label="Continue" onPress={onNext} />}>
      <Animated.View entering={enter(0)} style={styles.heroIcon}>
        <DottedDial size={200} progress={0.62} live />
      </Animated.View>
      <Animated.View entering={enter(1)}>
        <Txt variant="largeTitle" align="center">
          Welcome to{'\n'}
          {LEGAL.appName}
        </Txt>
      </Animated.View>
      <View style={styles.features}>
        <Feature
          index={2}
          icon="pie-chart"
          title="See where your time goes"
          body="Daily and weekly screen time, per app and per hour."
        />
        <Feature
          index={3}
          icon="timer"
          title="Focus, gently"
          body="Visual timers, brain dumps and time checks designed with ADHD in mind."
        />
        <Feature
          index={4}
          icon="lock-closed"
          title="Private by design"
          body="Everything stays on your phone. No accounts, no ads."
        />
      </View>
    </Page>
  );
}

function Privacy({ onNext, returning }: { onNext: () => void; returning: boolean }) {
  const enter = useEntering();
  return (
    <Page footer={<PrimaryButton label="Agree & Continue" onPress={onNext} />}>
      <Animated.View entering={enter(0)}>
        <IconBadge icon="shield-checkmark" />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.titleBlock}>
        <Txt variant="largeTitle" align="center">
          {returning ? 'We’ve updated our terms' : 'Your data stays yours'}
        </Txt>
        <Txt variant="body" tone="secondary" align="center">
          {returning ? 'Please review and accept them to keep using the app.' : 'Here’s our promise, in plain words.'}
        </Txt>
      </Animated.View>
      <View style={styles.features}>
        <Feature
          index={2}
          icon="phone-portrait"
          title="On this phone only"
          body="Your stats, notes and settings never leave your device."
        />
        <Feature
          index={3}
          icon="eye-off"
          title="No tracking"
          body="No accounts, analytics, ads or third-party trackers."
        />
        <Feature index={4} icon="trash" title="Delete anytime" body="Erase everything from Preferences in one tap." />
      </View>
      <Animated.View entering={enter(5)} style={styles.links}>
        <LinkPill label="Privacy Policy" doc="privacy" />
        <LinkPill label="Terms of Use" doc="terms" />
        <LinkPill label="Health Disclaimer" doc="health" />
      </Animated.View>
      <Txt variant="footnote" tone="tertiary" align="center" style={styles.fine}>
        By tapping Agree & Continue you confirm you are {LEGAL.minimumAge} or older and agree to the Terms of Use and
        Privacy Policy. This app is not a medical device.
      </Txt>
    </Page>
  );
}

/**
 * Google Play "prominent disclosure": explains, before the permission is requested, exactly what
 * Usage access lets the app read and that it stays on the device. The user must take an
 * affirmative action (the button) — and can decline and still use the app with sample data.
 */
function UsageAccess({ onNext }: { onNext: () => void }) {
  const enter = useEntering();
  const { deviceSupported, requestPermission } = useUsage();
  const [granted, setGranted] = useState(() => deviceSupported && hasUsagePermission());

  // Coming back from Android Settings: check whether access was turned on.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && deviceSupported) setGranted(hasUsagePermission());
    });
    return () => sub.remove();
  }, [deviceSupported]);

  return (
    <Page
      footer={
        <View style={{ gap: 4 }}>
          {granted || !deviceSupported ? (
            <PrimaryButton label="Continue" onPress={onNext} />
          ) : (
            <PrimaryButton label="Allow usage access" onPress={requestPermission} />
          )}
          {!granted && deviceSupported ? (
            <TextButton label="Not now — explore with sample data" onPress={onNext} />
          ) : null}
        </View>
      }
    >
      <Animated.View entering={enter(0)}>
        <IconBadge icon={granted ? 'checkmark-circle' : 'bar-chart'} />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.titleBlock}>
        <Txt variant="largeTitle" align="center">
          {granted ? 'You’re all set' : 'Allow usage access'}
        </Txt>
        <Txt variant="body" tone="secondary" align="center">
          {!deviceSupported
            ? Platform.OS === 'android'
              ? 'Usage tracking needs the installed app (not Expo Go). You’ll see sample data for now.'
              : 'Real usage data is available on Android. You’ll see sample data here.'
            : granted
              ? 'Usage access is on. Your real screen time is ready.'
              : `To show your screen time, ${LEGAL.appName} uses Android’s Usage access permission.`}
        </Txt>
      </Animated.View>
      {deviceSupported && !granted ? (
        <Animated.View entering={enter(2)} style={[styles.disclosure]}>
          <DisclosureRow icon="apps" text="Which apps you open and for how long" />
          <DisclosureRow icon="lock-open" text="When you unlock your phone (to count pickups)" />
          <DisclosureRow icon="pricetag" text="App names, icons and categories, to label your stats" />
          <Txt variant="footnote" tone="secondary" style={styles.disclosureNote}>
            This is read on your device only, used only to show your statistics, and is never uploaded or shared. You
            can turn it off any time in Android Settings › Usage access.
          </Txt>
          <Txt variant="footnote" tone="secondary" style={styles.disclosureNote}>
            On the next screen, find {LEGAL.appName} and switch on “Permit usage access”, then come back.
          </Txt>
        </Animated.View>
      ) : null}
    </Page>
  );
}

function Notifications({ onNext }: { onNext: (enabled: boolean) => void }) {
  const enter = useEntering();
  return (
    <Page
      footer={
        <View style={{ gap: 4 }}>
          <PrimaryButton label="Turn on notifications" onPress={async () => onNext(await requestNotifications())} />
          <TextButton label="Not now" onPress={() => onNext(false)} />
        </View>
      }
    >
      <Animated.View entering={enter(0)}>
        <IconBadge icon="notifications" />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.titleBlock}>
        <Txt variant="largeTitle" align="center">
          Know when focus ends
        </Txt>
        <Txt variant="body" tone="secondary" align="center">
          Put your phone face down and forget about it — we’ll tap you on the shoulder when your session is done. That’s
          the only thing we’ll ever notify you about.
        </Txt>
      </Animated.View>
    </Page>
  );
}

/* ---------- building blocks ---------- */

function Page({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 56, paddingBottom: BOTTOM_BAR_SPACE + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <BottomBar>{footer}</BottomBar>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
  index,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  index: number;
}) {
  const enter = useEntering();
  const { accent } = useTheme();
  return (
    <Animated.View entering={enter(index)} style={styles.feature}>
      <Ionicons name={icon} size={28} color={accent} style={styles.featureIcon} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="headline">{title}</Txt>
        <Txt variant="subhead" tone="secondary">
          {body}
        </Txt>
      </View>
    </Animated.View>
  );
}

function DisclosureRow({ icon, text }: { icon: ComponentProps<typeof Ionicons>['name']; text: string }) {
  const { accent } = useTheme();
  return (
    <View style={styles.disclosureRow}>
      <Ionicons name={icon} size={18} color={accent} />
      <Txt variant="subhead" style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

function IconBadge({ icon }: { icon: ComponentProps<typeof Ionicons>['name'] }) {
  const { accent, accentSoft } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: accentSoft }]}>
      <Ionicons name={icon} size={44} color={accent} />
    </View>
  );
}

function LinkPill({ label, doc }: { label: string; doc: 'privacy' | 'terms' | 'health' }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc } })}
      style={[styles.linkPill, { backgroundColor: colors.card }]}
      accessibilityRole="link"
    >
      <Txt variant="footnote" tone="accent" weight="600">
        {label}
      </Txt>
    </PressableScale>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.textButton} accessibilityRole="button">
      <Txt variant="callout" tone="secondary" weight="600">
        {label}
      </Txt>
    </PressableScale>
  );
}

/** iOS page indicator: the current page stretches into a pill. */
function PageDots({ count, index, top }: { count: number; index: number; top: number }) {
  return (
    <View style={[styles.dots, { top }]} accessibilityLabel={`Step ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const { colors, accent } = useTheme();
  const a = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    a.set(withTiming(active ? 1 : 0, timings.change));
  }, [active, a]);
  const style = useAnimatedStyle(() => ({ width: 7 + a.get() * 15, opacity: 0.35 + a.get() * 0.65 }));
  return <Animated.View style={[styles.dot, { backgroundColor: active ? accent : colors.textTertiary }, style]} />;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 28, gap: 8, flexGrow: 1 },
  heroIcon: { alignItems: 'center', marginBottom: 12 },
  titleBlock: { gap: 10, marginTop: 8 },
  features: { gap: 22, marginTop: 28 },
  feature: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  featureIcon: { width: 34, marginTop: 2, textAlign: 'center' },
  badge: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 28 },
  linkPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  fine: { marginTop: 14, paddingHorizontal: 8 },
  disclosure: { marginTop: 24, gap: 14 },
  disclosureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disclosureNote: { marginTop: 4 },
  textButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6, zIndex: 1 },
  dot: { height: 7, borderRadius: 4 },
});
