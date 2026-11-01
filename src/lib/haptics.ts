import * as Haptics from 'expo-haptics';

/**
 * One place for every haptic in the app, so the "Haptics" preference turns them all off.
 * Mirrors the iOS vocabulary: selection ticks, impacts of increasing weight, and notifications.
 */
let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const run = (fn: () => Promise<void>) => {
  if (enabled) fn().catch(() => {});
};

export const haptics = {
  /** Picker-wheel tick: selection changes, toggles, tabs. */
  selection: () => run(() => Haptics.selectionAsync()),
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  rigid: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
