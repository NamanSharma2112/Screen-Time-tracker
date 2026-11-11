# Building the release bundle (.aab) yourself

How `screen-time-tracker-1.0.0-1.aab` was made, so you can repeat it for every update.

## Option A: EAS (simplest for updates)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile production
```

> **Use the same upload key as the first release.** Play only accepts updates signed with the
> upload key you registered. EAS makes its own key unless you give it yours. For the first
> bundle, upload the one built from the keystore below. Before the first EAS build, run
> `npx eas-cli@latest credentials -p android` and choose **Keystore → Set up a new keystore →
> upload an existing keystore** with `upload-keystore.jks` (alias `upload`). Otherwise Play will
> reject the update.

## Option B: build locally (what produced the first bundle)

Needs JDK 17+ (21 works), the Android SDK (platform 36, build-tools 36.0.0) and Node 22.

```bash
export ANDROID_HOME=/path/to/android-sdk
NO_INTERNET=1 CI=1 npx expo prebuild --platform android --clean
```

`prebuild` regenerates `android/`, so the signing setup has to be re-applied each time. In
`android/app/build.gradle`:

1. Add a `release` entry inside `signingConfigs { … }` that reads `UPLOAD_STORE_FILE`,
   `UPLOAD_STORE_PASSWORD`, `UPLOAD_KEY_ALIAS` and `UPLOAD_KEY_PASSWORD` from Gradle properties.
2. In `buildTypes { release { … } }` change `signingConfig signingConfigs.debug` to
   `signingConfig signingConfigs.release`.

Then:

```bash
cd android
NO_INTERNET=1 NODE_ENV=production ./gradlew bundleRelease \
  -PUPLOAD_STORE_FILE=/path/to/upload-keystore.jks \
  -PUPLOAD_STORE_PASSWORD=*** -PUPLOAD_KEY_ALIAS=upload -PUPLOAD_KEY_PASSWORD=***
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`. A first build takes about 25
minutes (it compiles the native libraries).

## Every release

- Raise `android.versionCode` in `app.json` by 1 (Play rejects a repeated number). EAS does this
  for you with `autoIncrement`.
- **Never commit the keystore or its passwords.** Keep two copies somewhere safe. If the upload
  key is lost you can ask Play Console support to reset it (Play App Signing holds the real
  app-signing key), but it costs days.
- `NO_INTERNET=1` is what removes the `INTERNET` permission. Build without it only if you add
  online features, and update the Privacy Policy and Data safety form first.
