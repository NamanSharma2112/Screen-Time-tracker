import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { AppMeta } from '@/data/types';

import { Txt } from './Txt';

/**
 * An app's logo. On a real device this is the app's own launcher icon (read from Android);
 * sample data uses a brand-coloured tile with a logo glyph; anything else falls back to an initial.
 */
export function AppIcon({ app, size = 40 }: { app?: AppMeta; size?: number }) {
  const radius = size * 0.26;
  if (app?.icon) {
    return (
      <Image
        source={{ uri: app.icon }}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityIgnoresInvertColors
        fadeDuration={0}
      />
    );
  }
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius, backgroundColor: app?.color ?? '#A6A6AE' },
      ]}
    >
      {app?.glyph ? (
        <Ionicons name={app.glyph as ComponentProps<typeof Ionicons>['name']} size={size * 0.56} color="#fff" />
      ) : (
        <Txt variant="headline" color="#fff" style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
          {(app?.name ?? '?').slice(0, 1).toUpperCase()}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
