import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic layer over app.json.
 *
 * NO_INTERNET=1 (set by the `production` EAS profile) removes Android's INTERNET permission from
 * the release build, so the app *provably* cannot send data anywhere. Development builds keep it,
 * because they need to talk to the Metro dev server.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const noInternet = process.env.NO_INTERNET === '1';
  return {
    ...config,
    name: config.name ?? 'Screen Time Tracker',
    slug: config.slug ?? 'screen-time-tracker',
    android: {
      ...config.android,
      blockedPermissions: [
        ...(config.android?.blockedPermissions ?? []),
        // ACCESS_NETWORK_STATE stays: WorkManager (expo-background-task) needs it to evaluate its
        // "device is connected" constraint. It only reports connectivity; it can't transfer data.
        ...(noInternet ? ['android.permission.INTERNET'] : []),
      ],
    },
    extra: { ...config.extra, noInternet },
  };
};
