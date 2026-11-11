# Publishing on Google Play

Everything you need to take **Screen Time Tracker** from this repo to the Play Store. Work through it
top to bottom. Google's rules change often, so check each linked Play Console page as you go.

## 1. Before your first build

- [ ] **Fill in `src/legal/config.ts`.** Add your name or company, a support email, your
      jurisdiction, and the public URLs of your policies. Then run `npm run legal:docs` to
      regenerate `docs/legal/`.
- [ ] **Host the legal pages.** The simplest way is GitHub Pages: repo **Settings → Pages →
      Deploy from branch → `/docs`**. Your Privacy Policy URL will then be
      `https://<user>.github.io/<repo>/legal/privacy-policy.html`. Put that URL in
      `privacyPolicyUrl` and in the Play Console.
- [ ] **Choose a final name and package id.** `app.json` uses `com.screentimetracker.app`.
      The package id can never change after the first upload. Avoid "Screen Time" on its own as a
      brand, because it's Apple's feature name. Something distinctive also reads better in the
      store.
- [ ] Run `npm run legal:licenses` after any dependency change.

## 2. Build

```bash
npm install -g eas-cli          # or use npx eas-cli@latest
eas login
eas build --platform android --profile production   # signed .aab, versionCode auto-increments
```

Let EAS generate and keep your upload key, unless you already have one.

To test on a real phone first:

```bash
eas build --platform android --profile preview      # installable .apk
```

## 3. Play Console setup

| Section | What to enter |
| --- | --- |
| **App category** | Productivity (or Health & Fitness). Contains ads: **No**. |
| **Privacy policy** | Your hosted `privacy-policy.html` URL. |
| **App access** | "All functionality is available without special access." Tell reviewers: *"Usage statistics need Android's Usage access, which the app asks for during onboarding (Settings › Usage access › Screen Time Tracker). Without it the app shows sample data."* |
| **Ads** | No ads. |
| **Content rating** | Questionnaire → Utility/Productivity, nothing objectionable. Expect *Everyone / PEGI 3*. |
| **Target audience** | 13+ only (13–15, 16–17, 18+). Don't select under‑13 ages, or the Families policy applies. |
| **Data safety** | See [`data-safety.md`](data-safety.md). Short version: **no data collected or shared**. |
| **Health apps declaration** | Declare it as a wellbeing/productivity app with no medical functionality. Don't claim it diagnoses or treats ADHD. |
| **Government / financial / news** | Not applicable. |

## 4. Store listing

Copy is in [`listing.md`](listing.md). Graphics:

- App icon 512×512: [`icon-512.png`](icon-512.png)
- Feature graphic 1024×500: [`feature-graphic.png`](feature-graphic.png)
- Phone screenshots: take at least 4 from a real device (Today, Analytics, Focus, Brain dump).
  `docs/screenshots/` has reference shots.

Regenerate the icon and graphics with `node scripts/generate-assets.mjs`.

## 5. Testing tracks

- **New personal developer accounts** (created after 13 Nov 2023) must run a **closed test with
  at least 12 testers, opted in for 14 days in a row**, before they can apply for production.
  Organisation accounts are exempt. Use those two weeks to check usage tracking on several
  Android brands. Samsung, Xiaomi and OnePlus report usage events slightly differently.
- Start with **Internal testing**: `eas submit --platform android --profile production` uploads
  there as a draft. Then promote to Closed testing, then Production.

## 6. Policy notes

- **Usage access (`PACKAGE_USAGE_STATS`).** The onboarding includes an in-app *prominent
  disclosure*: it says what is read, why, and that nothing leaves the device. It asks for an
  explicit tap before sending the user to Settings, and the user can decline and still use the
  app. Keep that screen whenever you change the flow.
- **Package visibility.** The app declares `<queries>` for launcher apps only. It doesn't use
  `QUERY_ALL_PACKAGES`, which would need a separate declaration.
- **Notifications.** These are local only (focus endings, up-next heads-ups, hyperfocus
  check-ins). The app never signs up for push messages. Note that the Android notifications
  library it uses (`expo-notifications`) bundles Google's Firebase Cloud Messaging code, so the
  built bundle contains `FirebaseMessagingService` and the `c2dm` permission. With no `INTERNET`
  permission that code cannot reach the network, so nothing is sent. See `PLAY-CONSOLE.md`.
- **No internet.** The `production` and `preview` profiles build with `NO_INTERNET=1`, which
  removes the `INTERNET` permission. Use `--profile production-online` if you ever add a network
  feature, and set `releaseWithoutInternet: false` in `src/legal/config.ts`.
- **Background work.** The hyperfocus check-in uses WorkManager via `expo-background-task`. It's a
  periodic job, not a foreground service, so it doesn't need a foreground-service declaration.
  During closed testing, check the Play Console's pre-launch report and permission summary for
  any surprises from library manifests.
- **Widget.** This is a standard `AppWidgetProvider`, which needs no special declaration.
- **Target API.** Expo SDK 58 targets API 36, which meets the 2026 requirement for new apps and
  updates.
- **Wording.** Describe the app as ADHD-*friendly* or "designed with ADHD in mind". Don't say it
  treats or manages ADHD.

## 7. Each release

- [ ] `npm run typecheck && npm run lint`
- [ ] Bump `version` in `app.json` for user-visible releases. `versionCode` is managed by EAS.
- [ ] If the Terms or Privacy Policy changed in a material way: edit `src/legal/content.ts`,
      increase `LEGAL.version` (users are asked to accept again), run `npm run legal:docs`, and
      re-host the pages.
- [ ] `eas build -p android --profile production` → `eas submit -p android`
