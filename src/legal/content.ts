// Plain data with relative imports only, so `scripts/build-legal-docs.mjs` can also render these
// documents to Markdown for hosting. Keep the wording in sync with what the app actually does.
import { LEGAL } from './config.ts';

export type LegalSection = { heading: string; body: string[]; bullets?: string[] };
export type LegalDoc = { id: LegalDocId; title: string; summary: string; sections: LegalSection[] };
export type LegalDocId = 'privacy' | 'terms' | 'health';

const { appName, developerName, contactEmail, jurisdiction, effectiveDate, minimumAge, releaseWithoutInternet } = LEGAL;

export const PRIVACY: LegalDoc = {
  id: 'privacy',
  title: 'Privacy Policy',
  summary: `${appName} works entirely on your phone. We have no servers, no accounts, no analytics and no ads, and we never see your data.`,
  sections: [
    {
      heading: 'Who we are',
      body: [
        `${appName} (“the app”) is published by ${developerName} (“we”, “us”). This policy explains what information the app uses, why, and the choices you have. Effective ${effectiveDate}.`,
      ],
    },
    {
      heading: 'The short version',
      body: [],
      bullets: [
        'Everything the app shows is computed on your device.',
        'Nothing is sent to us or to anyone else. The app has no backend, user accounts, analytics, advertising or crash-reporting SDKs.',
        ...(releaseWithoutInternet
          ? [
              'The version published on Google Play does not even request Android’s Internet permission, so it is technically unable to send data off your phone.',
            ]
          : []),
        'You can delete everything the app stores at any time from Preferences › Delete all data, or by uninstalling the app.',
      ],
    },
    {
      heading: 'Information the app reads on your device',
      body: ['If you choose to grant Android’s “Usage access” permission, the app reads, on your device only:'],
      bullets: [
        'Which apps were in the foreground and when (Android usage events), to calculate screen time per app, per hour and per day, sessions and your daily timeline.',
        'When the device was unlocked, to count pickups and your first pickup of the day.',
        'The names, icons and Play Store categories of installed apps that you have used, so the app can label them.',
      ],
    },
    {
      heading: 'How that information is used and stored',
      body: [
        'Usage information is read from Android when you open the app and is kept only in the app’s memory while it is running. It is not copied to storage, not uploaded, and not shared.',
        'If you turn on the hyperfocus check-in, Android periodically (about every 15 minutes) lets the app read your most recent usage in the background, on the device, to see whether one app has held your attention for longer than the time you chose. Nothing is stored except a marker that prevents repeat nudges for the same stretch.',
        'You can withdraw access at any time in Android Settings › Apps › Special app access › Usage access. The app then shows sample data instead.',
      ],
    },
    {
      heading: 'Information you create in the app',
      body: ['The following is saved in the app’s private storage on your device:'],
      bullets: [
        'Your preferences (theme, colour, daily goal, display options).',
        'Focus sessions you run (start time, length, whether completed) and your reflections on them.',
        'Notes you type into Brain Dump.',
        'Tasks and steps you create, your daily check-ins (energy, mood, focus), your dopamine-menu ideas and the “up next” reminders you set.',
        'Which version of these terms you accepted.',
      ],
    },
    {
      heading: 'Permissions',
      body: [],
      bullets: [
        'Usage access (PACKAGE_USAGE_STATS) — optional; powers the screen-time statistics described above.',
        'Notifications (POST_NOTIFICATIONS) — optional; tells you when a focus session ends.',
        'Run at startup (RECEIVE_BOOT_COMPLETED) — keeps a scheduled focus reminder after your phone restarts.',
        'Vibration (VIBRATE) — haptic feedback, which you can turn off in Preferences.',
        'Audio settings (MODIFY_AUDIO_SETTINGS) — declared by the audio library used for body-double ambient sound. The app plays sound only while you are in a focus session and does not change your system audio settings.',
        'Background work and network state (ACCESS_NETWORK_STATE) — used by Android’s job scheduler to run the optional hyperfocus check-in. Network state only reports whether the phone is online; it cannot send data.',
        'Visibility of launchable apps — so the app can show the names and icons of apps you use. It does not request access to all installed packages.',
      ],
    },
    {
      heading: 'Things only you can see — and choose to share',
      body: [],
      bullets: [
        'If you add the home-screen widget, it shows today’s screen time on your home screen, where anyone who can see your phone can read it.',
        'If you share a weekly recap, the image is created on your device and sent only to the app or person you pick. What happens next is governed by their policies.',
      ],
    },
    {
      heading: 'Sharing and selling',
      body: [
        'We do not sell, rent, share or transfer your information to anyone, because it never leaves your device. We do not use it for advertising or profiling.',
      ],
    },
    {
      heading: 'Backups',
      body: [
        'If Android device backup is turned on, Android may include the app’s private storage (preferences, focus history and notes) in your encrypted Google backup. This is controlled by your device settings, not by us. Usage statistics are never stored, so they are never backed up.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Because all data stays on your device, you are in full control: you can view it in the app, delete it with Preferences › Delete all data, or remove the app. Depending on where you live (for example under the GDPR, UK GDPR, CCPA/CPRA or India’s DPDP Act) you may have rights to access, correct or delete personal data. We hold no personal data about you, but you can contact us with any privacy question.',
      ],
    },
    {
      heading: 'Children',
      body: [
        `The app is not directed to children under ${minimumAge}, and we do not knowingly collect information from anyone. If you are a parent and have questions, contact us.`,
      ],
    },
    {
      heading: 'Security',
      body: [
        'Data stays inside Android’s app sandbox, which other apps cannot read. Keep your device protected with a screen lock to protect it further.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If we change this policy we will update the effective date, and for material changes the app will ask you to review the new version before continuing.',
      ],
    },
    {
      heading: 'Contact',
      body: [`Questions or requests: ${contactEmail}`],
    },
  ],
};

export const TERMS: LegalDoc = {
  id: 'terms',
  title: 'Terms of Use',
  summary: `The rules for using ${appName}. Plain-English, but binding — please read them.`,
  sections: [
    {
      heading: 'Agreement',
      body: [
        `These Terms of Use (“Terms”) are an agreement between you and ${developerName} about your use of ${appName}. By tapping “Agree & Continue” or using the app, you accept these Terms and our Privacy Policy. If you do not agree, do not use the app. Effective ${effectiveDate}.`,
      ],
    },
    {
      heading: 'Eligibility',
      body: [
        `You must be at least ${minimumAge} years old, or the minimum age of digital consent where you live if higher. If you are under 18, you confirm a parent or guardian has agreed to these Terms.`,
      ],
    },
    {
      heading: 'Your licence',
      body: [
        'We grant you a personal, non-exclusive, non-transferable, revocable licence to install and use the app on Android devices you own or control, for your own non-commercial use. Google Play’s terms of service also apply to your download.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: ['You agree not to:'],
      bullets: [
        'use the app to monitor another person’s device or activity without their knowledge and consent;',
        'copy, modify, reverse-engineer or redistribute the app except as allowed by law or by the open-source licences of its components;',
        'use the app in any way that is unlawful or harms others.',
      ],
    },
    {
      heading: 'Not medical advice',
      body: [
        'The app offers general wellbeing and productivity tools, including features designed with ADHD in mind. It is not a medical device and does not diagnose, treat, cure or prevent any condition, and it is not a substitute for advice from a qualified professional. See the Health Disclaimer for more.',
      ],
    },
    {
      heading: 'Accuracy',
      body: [
        'Screen-time figures are calculated from data Android provides and may differ from other tools such as Digital Wellbeing, especially around midnight, after restarts, or on devices that report events differently. Focus timers and notifications depend on your device’s battery and notification settings and may be delayed.',
      ],
    },
    {
      heading: 'Your content',
      body: [
        'Notes, reflections and settings you create belong to you and stay on your device. You are responsible for backing them up; we cannot recover data we never had.',
      ],
    },
    {
      heading: 'Intellectual property',
      body: [
        'The app, its design and its content are owned by us or our licensors. Third-party open-source components are licensed under their own terms, listed in Preferences › Open-source licences.',
      ],
    },
    {
      heading: 'Disclaimer of warranties',
      body: [
        'To the fullest extent permitted by law, the app is provided “as is” and “as available”, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We do not warrant that the app will be uninterrupted, error-free or meet your needs.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        'To the fullest extent permitted by law, we will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of data, productivity or profits, arising from your use of the app. Our total liability for any claim is limited to the amount you paid for the app (if any). Nothing in these Terms limits liability that cannot be limited by law, or your statutory rights as a consumer.',
      ],
    },
    {
      heading: 'Ending these Terms',
      body: [
        'You can stop using the app at any time by uninstalling it. We may suspend or discontinue the app. Sections that by their nature should survive (such as disclaimers and limitation of liability) survive termination.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'We may update these Terms. For material changes the app will ask you to accept the new version; continuing to use the app afterwards means you accept them.',
      ],
    },
    {
      heading: 'Governing law',
      body: [
        `These Terms are governed by the laws of ${jurisdiction}, without regard to conflict-of-law rules, except where the law of your country of residence gives you mandatory protections.`,
      ],
    },
    {
      heading: 'Contact',
      body: [`${developerName} — ${contactEmail}`],
    },
  ],
};

export const HEALTH: LegalDoc = {
  id: 'health',
  title: 'Health Disclaimer',
  summary: 'Helpful tools, not treatment.',
  sections: [
    {
      heading: 'Wellbeing tools, not a medical device',
      body: [
        `${appName} includes features inspired by common ADHD and focus strategies — visual timers, body doubling, task breakdown, brain dumps, a dopamine menu, daily check-ins, transition warnings, hyperfocus check-ins and reflection. They are general self-help tools. They are not a medical device and do not diagnose, treat, cure or prevent ADHD or any other condition.`,
      ],
    },
    {
      heading: 'Talk to a professional',
      body: [
        'If you think you may have ADHD, or you’re struggling with focus, mood, sleep or phone use, please speak to a doctor or a qualified mental-health professional. Do not change any treatment or medication based on this app.',
      ],
    },
    {
      heading: 'If you are in crisis',
      body: [
        'If you are thinking about harming yourself or you are in danger, contact your local emergency number now, or a crisis line in your country.',
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = { privacy: PRIVACY, terms: TERMS, health: HEALTH };
