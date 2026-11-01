import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'focus';
const supported = Platform.OS === 'android' || Platform.OS === 'ios';

if (supported) {
  Notifications.setNotificationHandler({
    // In the foreground the app shows its own island toast, so the system banner is suppressed.
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Focus sessions',
    description: 'Lets you know when a focus session ends.',
    // eslint-disable-next-line import/namespace -- re-exported via `export *`; the lint resolver misses it
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
  });
}

export async function notificationsAllowed(): Promise<boolean> {
  if (!supported) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** Asks for the Android 13+ notification permission (creating the channel first, as Android requires). */
export async function requestNotifications(): Promise<boolean> {
  if (!supported) return false;
  try {
    await ensureChannel();
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Schedules the "session complete" notification. Returns its id, or null when not allowed. */
export async function scheduleFocusEnd(at: number, minutes: number): Promise<string | null> {
  if (!supported || !(await notificationsAllowed())) return null;
  try {
    await ensureChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus session complete',
        body: `${minutes} minutes done. Nice work — take a short break before the next thing.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: CHANNEL },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id?: string | null) {
  if (!supported || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
