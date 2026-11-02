# Launch kit

Everything here is made from the real app (screenshots of the actual screens; the hamster is the
same artwork the app draws). Replace `[link]` with the Play Store or testing link when you have it.
Written in first person; switch "I" to "we" if you're posting as a team.

## What to post where

| Platform | Media | File |
| --- | --- | --- |
| **X** | Video (best) or image | `launch-video-1080x1350.mp4` · `images/hero-1600x900-light.png` |
| **LinkedIn** | Carousel (upload the PDF as a *document*) or video | `carousel/linkedin-carousel.pdf` · `launch-video-1080x1350.mp4` · `images/hero-1080x1350-light.png` |
| **Peerlist** | Thumbnail + gallery + video | `images/square-1080-light.png` (thumbnail) · `images/hero-1600x900-*.png`, `carousel/slide-*.png` (gallery) · the video |

Dark versions of every image are included (`*-dark.png`) if they suit your feed better.

Tip: Google Play requires a new personal developer account to run a **closed test with at least 12
testers for 14 days** before going live. Every post below ends by asking for testers, so the launch
posts double as your tester sign-up.

---

## X

**Single post** (attach the video):

```
Most screen-time apps make you feel guilty.

Mine has a hamster instead 🐹 It gets a cookie for every quarter of a focus session and celebrates when you finish.

Built for ADHD brains. 100% on-device. No account, no ads.

Coming soon to Android. Want early access? Reply 👇
```

**Optional thread** (post 1 above, then):

```
2/ Why: most screen-time apps feel like a report card. Red numbers, broken streaks, shame.

For an ADHD brain that's the fastest way to stop opening the app. So this one is calm, kind, and never punishes you.
```

```
3/ What's inside:
• A calm daily dial + weekly insights
• Break a scary task into tiny steps
• Brain dump a thought in two taps
• A "dopamine menu" for when you reach for your phone
• Gentle time checks for time blindness
• A body-double mode
```

```
4/ Private by design: everything is calculated on your phone. The release build doesn't even ask for internet access.

I need 12 testers on Android to get it onto Google Play. Reply or DM and I'll add you 🍪
```

---

## LinkedIn

Attach `carousel/linkedin-carousel.pdf` as a document (it shows as a swipeable carousel), or the video.

```
I built a screen-time app that doesn't make you feel guilty. 🐹

Most screen-time apps work like a report card: big red numbers, streaks you break, a little shame every evening. For a lot of people, especially with ADHD, that's exactly why they stop opening them.

So I tried the opposite.

Screen Time Tracker shows your day as a calm dial with no alarms. And when you want to focus, a small hamster keeps you company. It catches a cookie at every quarter of your session and celebrates when you finish. It sounds silly. It works, because it turns "don't use your phone" into "let's feed the hamster."

Around it are tools for the moments your brain says "not now":
→ Too big to start? Break it into tiny steps, each with a short timer
→ Head too busy? Brain-dump a thought in two taps
→ Reaching for your phone? Pick from your own dopamine menu
→ Time blindness? Gentle time checks and up-next warnings
→ Lost in an app? One kind hyperfocus check-in

And it's private by design: everything is calculated on your phone. The release build doesn't even ask for internet access. No account, no ads, no trackers.

It's coming soon to Android. To get onto Google Play I need 12 people to test it for two weeks. If you'd like early access, comment "🍪" or send me a message and I'll add you.

#ADHD #DigitalWellbeing #Productivity #Android #ReactNative #BuildInPublic
```

---

## Peerlist

**Project name:** Screen Time Tracker

**Tagline:** Calm screen time + a focus buddy for ADHD brains

**Description:**

```
A calm screen-time tracker and focus app for Android, designed with ADHD brains in mind.

Instead of red numbers and broken streaks, you get a calm daily dial and a hamster that keeps you company while you focus. It catches a cookie at every quarter of a session and celebrates when you finish.

Also inside: task breakdown into tiny timed steps, two-tap brain dump, a personal dopamine menu, gentle time checks, up-next warnings, hyperfocus check-ins, a body-double mode, weekly insights and home-screen widgets.

Private by design: everything is calculated on the phone, and the release build has no internet permission at all. No account, no ads, no trackers.
```

**Built with:** React Native · Expo · TypeScript · Reanimated · React Native SVG · Kotlin (Android UsageStatsManager module)

**Scroll post** (attach the video):

```
Shipping something small and kind: a screen-time app that doesn't make you feel guilty 🐹

When you focus, a hamster catches a cookie at every quarter and celebrates when you finish. Around it: tools for ADHD brains (tiny steps, brain dump, dopamine menu, time checks).

Fun build details:
• Real usage data from a small Kotlin module over Android's UsageStatsManager
• The hamster is layered SVG, animated only with transform/opacity on the UI thread, so it stays smooth on mid-range phones
• The release build has no INTERNET permission. Privacy enforced by the OS, not just a promise

Coming soon to Android and looking for 12 testers. Want in? 🍪
```
