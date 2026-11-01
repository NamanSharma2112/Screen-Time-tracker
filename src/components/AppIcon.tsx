import { Image, StyleSheet, View } from 'react-native';

import type { AppMeta } from '@/data/types';

import { Txt } from './Txt';

/** Real launcher icon when we have one, otherwise an iOS-style squircle tile with the app's initial. */
export function AppIcon({ app, size = 40 }: { app?: AppMeta; size?: number }) {
  const radius = size * 0.26;
  if (app?.icon) {
    return <Image source={{ uri: app.icon }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius, backgroundColor: app?.color ?? '#A6A6AE' },
      ]}
    >
      <View style={[styles.sheen, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} />
      <Txt variant="headline" color="#fff" style={{ fontSize: size * 0.42 }}>
        {(app?.name ?? '?').slice(0, 1).toUpperCase()}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.12)' },
});
