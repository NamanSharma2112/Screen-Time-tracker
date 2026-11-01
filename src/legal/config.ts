/**
 * Everything the legal documents and store listing need to know about you.
 *
 * ⚠️ Fill in the bracketed values before publishing. They appear verbatim in the in-app
 * Privacy Policy and Terms, and in the generated docs/ pages you host for Google Play.
 * Bump `version` whenever the Terms or Privacy Policy change materially: everyone is asked to
 * review and accept them again on next launch.
 */
export const LEGAL = {
  appName: 'Screen Time Tracker',
  developerName: '[Your name or company]',
  contactEmail: '[support@your-domain.com]',
  /** Governing law for the Terms, e.g. "India" or "the State of California, USA". */
  jurisdiction: '[Your country / state]',
  /** Public URLs Google Play links to (see docs/legal — host them with GitHub Pages or similar). */
  privacyPolicyUrl: '[https://your-domain.com/privacy]',
  termsUrl: '[https://your-domain.com/terms]',
  effectiveDate: '1 November 2026',
  version: 1,
  /** Minimum age for the Terms. Play target audience should be set to 13+ to match. */
  minimumAge: 13,
  /**
   * Whether the builds you publish are made with NO_INTERNET=1 (the default `production` EAS
   * profile). Keep this in sync — the Privacy Policy makes a promise based on it.
   */
  releaseWithoutInternet: true,
} as const;

/** True while any placeholder above is still unfilled. Shown as a warning in development builds. */
export const LEGAL_HAS_PLACEHOLDERS = Object.values(LEGAL).some((v) => typeof v === 'string' && v.includes('['));
