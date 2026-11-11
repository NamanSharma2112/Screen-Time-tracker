# Play Console: every field, in order

The exact answers for publishing **Screen Time Tracker** on Google Play. Work top to bottom in
[Play Console](https://play.google.com/console). Copy the text in `code` exactly.

Google rewords its forms often. If a question reads differently from this sheet, answer the
**facts** in the [fact sheet](#fact-sheet-what-the-app-actually-does) at the bottom. Never pick
an answer just because it matches the wording here.

**Files you'll upload**

| What | File |
| --- | --- |
| App bundle | `screen-time-tracker-1.0.0-1.aab` (built separately, not in this repo) |
| App icon (512×512, 32-bit PNG) | `docs/play-store/icon-512.png` |
| Feature graphic (1024×500) | `docs/play-store/feature-graphic.png` |
| Phone screenshots (1080×1920) | `docs/play-store/screenshots/01-today.png` … `06-private.png` |

---

## 1. Create the app

**All apps → Create app**

| Field | Answer |
| --- | --- |
| App name | `Screen Time Tracker: Focus` |
| Default language | English (United States), en-US |
| App or game | **App** |
| Free or paid | **Free** (you can't switch a free app to paid later) |
| Declarations | Tick **Developer Program Policies** and **US export laws** |

Play App Signing is on by default for new apps. Keep it on: Google holds the app signing key, and
you keep the **upload key** that the bundle is signed with.

---

## 2. Set up your app (Dashboard → "Set up your app")

### Privacy policy
`https://namansharma.com/screen-time-tracker/privacy.html`

> Merge the portfolio branch `claude/work-easing-lab` and deploy first, so this URL is live
> before you submit. The page must load publicly, without a login.

### App access
**All functionality is available without any access restrictions.**

The app has no login. If there's a free-text box, paste:
```
No account or login. Usage statistics need Android's Usage access, which the app asks for during onboarding with an explanation screen (Settings › Apps › Special app access › Usage access › Screen Time Tracker). If it is declined, the app shows sample data and every other feature works.
```

### Ads
**No, my app does not contain ads.**

### Content rating
Start the questionnaire:
- Email: `namansharmans03@gmail.com`
- Category: **All other app types** (it's not a game, social or communication app)
- Violence, sexuality, language, controlled substances, crude humour, gambling: **No** to all
- Does the app let users interact with or exchange content with other users? **No**
  (sharing the weekly recap uses Android's own share sheet; there's no messaging in the app)
- Does the app share the user's location? **No**
- Can users buy digital goods? **No**
- Does the app contain a web browser or search engine? **No**

Expected rating: **Everyone / PEGI 3 / IARC 3+**.

### Target audience and content
- Target age groups: tick **13–15, 16–17, 18 and over** only. Don't tick anything under 13
  (the Terms set the minimum age at 13).
- Could the app unintentionally appeal to children? **No**. The hamster is a focus companion
  inside a productivity tool, not a children's character, and there's nothing to buy.

### News app
**No**

### COVID-19 contact tracing and status apps (if still listed)
**My app is not a publicly available COVID-19 contact tracing or status app.**

### Data safety
- Does your app collect or share any of the required user data types? **No**

  Google's definition: data processed only on the device, never sent off it, is *not collected*.
  The release build has no `INTERNET` permission at all, so nothing can leave the device.
- Then **Next → Save**. The deletion and encryption questions don't appear when the answer is No.

Details: [`data-safety.md`](data-safety.md).

### Government apps
**No**

### Financial features
**My app doesn't provide any financial features.**

### Health
Play's health declaration lists health feature types. Answer from the facts:
- The app tracks **phone usage** and offers **focus tools and a daily mood/energy check-in**.
- It does **not** diagnose, treat or monitor any medical condition. It isn't a medical device,
  it reads no health sensors and it doesn't use Health Connect.

If there's a wellbeing option such as *"Stress management, relaxation, mental acuity"*, tick only
that one. Don't tick medical, clinical, disease-management or "medical device" options. If none
fits, answer that the app has **no health features**.

### Advertising ID
**No**, the app doesn't use the advertising ID. The release manifest has no `AD_ID`
permission (checked in the built bundle).

### Sensitive permissions
No declaration form is needed. The bundle uses none of the restricted permissions (SMS, call log,
all-files access, `QUERY_ALL_PACKAGES`, accessibility, background location, exact alarms). See
[the permissions list below](#permissions-in-the-release-bundle).

---

## 3. Store settings (Grow → Store presence → Store settings)

| Field | Answer |
| --- | --- |
| App category | **Productivity** |
| Tags | Pick the closest of: *Productivity*, *Time management*, *Digital wellbeing* |
| Email | `namansharmans03@gmail.com` |
| Website (optional) | `https://namansharma.com` |
| Phone (optional) | leave empty |
| External marketing | Your choice |

---

## 4. Main store listing (Grow → Store presence → Main store listing)

| Field | Answer |
| --- | --- |
| App name (30 max) | `Screen Time Tracker: Focus` |
| Short description (80 max) | `Calm screen-time stats and ADHD-friendly focus tools. Private, 100% on-device.` |
| Full description (4000 max) | Copy the block from [`listing.md`](listing.md), without the ``` fences |
| App icon | `icon-512.png` |
| Feature graphic | `feature-graphic.png` |
| Phone screenshots | `screenshots/01-today.png` to `06-private.png`, in that order |
| Video | Optional. Leave empty, or add a YouTube link if you upload the launch video |

Tablet and Chromebook screenshots are optional. Skip them.

---

## 5. Upload the build

### If your developer account is a personal account created after 13 November 2023
Google requires a **closed test with at least 12 testers opted in for 14 days in a row** before
you can apply for production. Organisation accounts are exempt.

1. **Test and release → Testing → Closed testing → Create track** (or use the default "Alpha").
2. **Testers**: create an email list with at least 12 Gmail addresses, or use a Google Group.
3. **Create new release → Upload** `screen-time-tracker-1.0.0-1.aab`.
4. Release name: `1.0.0 (1)`
5. Release notes:
   ```
   <en-US>
   First release: calm screen-time stats, a focus timer with a hamster buddy, and ADHD-friendly tools (task breakdown, brain dump, dopamine menu, check-ins). Everything stays on your phone.
   </en-US>
   ```
6. **Countries / regions**: add the countries you want (or all).
7. **Review release → Start rollout to Closed testing**. Then **Publishing overview → Send for review**.
8. Share the opt-in link with testers. They must install and **stay opted in for 14 days**.
9. After 14 days: **Dashboard → Apply for production access**, answer the questions about the
   test, then promote the release to **Production**.

### If the account is an organisation account (or older than November 2023)
**Test and release → Production → Create new release**, then steps 3–7 above. You can still start
with **Internal testing** to try it on your own phone first.

---

## Permissions in the release bundle

Checked by reading the merged manifest of the signed release bundle (`versionCode 1`, `versionName 1.0.0`,
`minSdk 24`, `targetSdk 36`, 4 CPU architectures).

**What the app asks for**

| Permission | Why |
| --- | --- |
| `PACKAGE_USAGE_STATS` | Reads screen time. The user grants it in Android Settings after the in-app explanation. |
| `POST_NOTIFICATIONS` | Local reminders only (focus ended, up next, hyperfocus check-in). |
| `VIBRATE` | Haptic feedback (can be turned off). |
| `RECEIVE_BOOT_COMPLETED` | Restores the scheduled background check after a restart. |
| `WAKE_LOCK`, `FOREGROUND_SERVICE` | Added by the background-work library (WorkManager). No foreground service *type* is declared, so Play's foreground-service declaration is not needed. |
| `MODIFY_AUDIO_SETTINGS` | Declared by the audio library for the body-double ambient sound. |
| `ACCESS_NETWORK_STATE` | Android's job scheduler needs it to run the background check. It cannot send data. |

**Added by libraries, harmless without internet.** These are all "normal" permissions that need no
declaration: about 20 launcher-badge permissions (`READ_APP_BADGE`, `com.sec.android.provider.badge.*`,
`com.huawei...`, etc., from the notifications library), `com.google.android.c2dm.permission.RECEIVE`
(Firebase Cloud Messaging code inside the notifications library) and
`...BIND_GET_INSTALL_REFERRER_SERVICE` (install-referrer client).

**Deliberately absent (verified):** `INTERNET`, `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`,
`READ/WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_*`, `AD_ID`, `QUERY_ALL_PACKAGES`, location, contacts,
camera, accessibility.

> **Firebase note.** The notifications library bundles Google's Firebase Cloud Messaging code, so
> Play's scanner may show Firebase among the app's SDKs. The app never registers for push messages
> and has no `INTERNET` permission, so that code cannot send anything. That's why Data safety stays
> **No data collected**. If a reviewer asks, say exactly this. If you ever want the Firebase code
> gone entirely, switch to a notifications setup that doesn't include it (a change that needs
> testing on a real device).

---

## Fact sheet: what the app actually does

- **Reads** per-app usage and unlock events through Android Usage access, *only if the user
  grants it* after an explanation screen. This is held in memory, never stored as detail and
  never uploaded.
- **Stores on the device** (app-private storage): preferences, focus sessions, reflections,
  brain-dump notes, tasks, check-ins, dopamine-menu ideas, up-next reminders, Terms acceptance.
- **Sends nothing anywhere.** No servers, accounts, analytics, crash reporting or ads. The release
  build has no `INTERNET` permission.
- **Local notifications only**: focus end, up-next heads-ups, hyperfocus check-ins.
- **Background work**: a periodic WorkManager job for the optional hyperfocus check-in. No
  foreground service.
- **Widgets**: today's dial and the focus buddy.
- **Health**: wellbeing and productivity only. A health disclaimer is in the app and at
  `https://namansharma.com/screen-time-tracker/health.html`.
- **Age**: 13+.
- **Developer**: Naman Sharma · `namansharmans03@gmail.com` · governed by the laws of India.
- **Terms**: `https://namansharma.com/screen-time-tracker/terms.html`
