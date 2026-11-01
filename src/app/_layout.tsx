import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider, useSettings } from '@/state/settings';
import { UsageProvider } from '@/state/usage';
import { useTheme } from '@/theme/useTheme';

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
  const { ready } = useSettings();
  const { colors, scheme } = useTheme();
  if (!ready) return null;

  return (
    <>
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
        <Stack.Screen name="index" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="app/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="focus"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
        />
      </Stack>
    </>
  );
}
