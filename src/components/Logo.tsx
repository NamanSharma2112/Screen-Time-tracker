import { Image, StyleSheet, View } from 'react-native';

import { LEGAL } from '@/legal/config';

import { Txt } from './Txt';

/** The app mark: the dial on the accent gradient, in an iOS-style rounded tile. */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
      accessibilityIgnoresInvertColors
      accessibilityLabel={`${LEGAL.appName} logo`}
    />
  );
}

/** Logo + name, for headers like About or onboarding. */
export function LogoLockup({ size = 64, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <View style={styles.lockup}>
      <Logo size={size} />
      <Txt variant="headline">{LEGAL.appName}</Txt>
      {subtitle ? (
        <Txt variant="footnote" tone="secondary">
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: 'center', gap: 6 },
});
