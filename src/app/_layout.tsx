import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { syncHyperfocusTask } from '@/background/hyperfocus';
import { ToastProvider } from '@/components/IslandToast';
import { LaunchScreen } from '@/components/LaunchScreen';
import { LEGAL, LEGAL_HAS_PLACEHOLDERS } from '@/legal/config';
import '@/lib/notifications';
import { SettingsProvider, useSettings } from '@/state/settings';
import { todayKey } from '@/lib/time';
import { UsageProvider, useUsage } from '@/state/usage';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});
// The in-app LaunchScreen looks identical to the native splash, so the swap is invisible.
SplashScreen.setOptions({ duration: 120, fade: true });

if (__DEV__ && LEGAL_HAS_PLACEHOLDERS) {
  console.warn('src/legal/config.ts still has [placeholders] — fill them in before publishing.');
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <UsageProvider>
            <Navigator />
          </UsageProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const { ready, settings } = useSettings();
  const { days } = useUsage();
  const { colors, scheme } = useTheme();
  const accepted = settings.acceptedTermsVersion >= LEGAL.version;

  // Launch flow: native splash → identical in-app LaunchScreen (immediately) → app, once settings
  // are loaded and today's numbers are in (or after 2 s at most, so a slow read never blocks).
  const [timedOut, setTimedOut] = useState(false);
  const [launchVisible, setLaunchVisible] = useState(true);
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const appReady = ready && (!accepted || !!days[todayKey()] || timedOut);
  const hideLaunch = useCallback(() => setLaunchVisible(false), []);

  // Keep the background hyperfocus check registered only while the user wants it.
  useEffect(() => {
    if (ready) syncHyperfocusTask(accepted && settings.hyperfocusMinutes > 0);
  }, [ready, accepted, settings.hyperfocusMinutes]);

  return (
    <>
      {ready ? (
        <ToastProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              // Give Android the same parallax push + edge swipe as iOS.
              animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Protected guard={accepted}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="app/[id]" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="notes" />
              <Stack.Screen name="licenses" />
              <Stack.Screen name="tasks/index" />
              <Stack.Screen name="tasks/[id]" />
              <Stack.Screen name="menu" />
              <Stack.Screen name="recap" />
              <Stack.Screen name="tree" />
              <Stack.Screen
                name="focus"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureDirection: 'vertical',
                }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!accepted}>
              <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
            </Stack.Protected>
            {/* Readable before and after accepting. */}
            <Stack.Screen name="legal/[doc]" />
          </Stack>
        </ToastProvider>
      ) : null}
      {launchVisible ? <LaunchScreen done={appReady} onHidden={hideLaunch} /> : null}
    </>
  );
}
