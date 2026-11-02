import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { useUsage } from '@/state/usage';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

/** Explains why we're showing sample data, and offers the fix when there is one. */
export function DataNotice() {
  const { source, deviceSupported, permission, requestPermission, error } = useUsage();
  const { settings } = useSettings();
  const { colors, accent, accentSoft } = useTheme();

  let title: string | null = null;
  let body = '';
  let action: (() => void) | undefined;

  if (error) {
    title = "Couldn't read usage";
    body = error;
  } else if (source === 'demo' && settings.dataSource === 'device') {
    if (deviceSupported && !permission) {
      title = 'Allow usage access';
      body = 'Turn on Usage Access for this app to see your real screen time. Showing sample data for now.';
      action = requestPermission;
    } else if (!deviceSupported) {
      title = 'Showing sample data';
      body =
        Platform.OS === 'ios'
          ? 'iOS only shares Screen Time through Apple’s Screen Time API, which is coming soon. Explore the app with sample data meanwhile.'
          : 'Real tracking needs a development build (npx expo run:android). Expo Go and web use sample data.';
    }
  }
  if (!title) return null;

  return (
    <View>
      <PressableScale disabled={!action} onPress={action} style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={[styles.icon, { backgroundColor: accentSoft }]}>
          <Ionicons name={action ? 'lock-open-outline' : 'sparkles-outline'} size={18} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="callout" weight="600">
            {title}
          </Txt>
          <Txt variant="footnote" tone="secondary">
            {body}
          </Txt>
        </View>
        {action ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
