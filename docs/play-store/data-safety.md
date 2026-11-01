# Data safety form answers

Google defines **"collected"** as data sent off the user's device. It also says data processed
only on the device does not count as collected. Screen Time Tracker has no servers, accounts,
analytics, crash reporting or ads. Everything stays on the device, so these are the answers:

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | Not applicable (no data collected) |
| Do you provide a way for users to request that their data be deleted? | Not applicable. Users can still erase everything in the app via *Preferences › Delete all data*, or by uninstalling. |

For reference, this is what the app reads or stores **on the device only**:

| Data | Source | Stored? | Leaves device? |
| --- | --- | --- | --- |
| App usage events (which app, when) | Android Usage access (optional) | No, held in memory only | No |
| Device unlock times | Android Usage access | No, held in memory only | No |
| Installed app names, icons and categories | PackageManager | No, held in memory only | No |
| Preferences, focus history, reflections | User | Yes, app-private storage | No* |
| Brain-dump notes, tasks, check-ins, dopamine menu, up-next reminders | User | Yes, app-private storage | No* |
| Recap image | Generated on device | Temporary file | Only if the user shares it via the Android share sheet (user-initiated; not collection by the developer) |

\* If the user has Android device backup turned on, Android may include app-private storage in
the user's own encrypted Google backup. Google treats this as the user's own backup, not
collection by the developer.

Release builds made with the `production` EAS profile (`NO_INTERNET=1`) **don't declare the
`INTERNET` permission at all**, which backs up these answers technically.

If you later add analytics, crash reporting (e.g. Sentry), sign-in or cloud sync, **you must
update this form, the Privacy Policy (`src/legal/content.ts`) and the in-app disclosure**.
