#!/usr/bin/env node
// Renders the app icon, adaptive-icon layers, splash, notification icon and Play Store
// graphics from one SVG design (the dotted "dial" from the Today screen).
// Usage: node scripts/generate-assets.mjs   (needs Playwright + Chromium available)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ACCENT_A = '#FF7A84';
const ACCENT_B = '#FF3B5C';

/** Ring of radial dashes; `lit` fraction drawn solid, the rest faded. */
function dial({
  cx,
  cy,
  r,
  count = 40,
  dash = 0.16,
  width = 0.05,
  lit = 0.7,
  color = '#fff',
  dim = 0.32,
  core = true,
}) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const r1 = r * (1 - dash / 2);
    const r2 = r * (1 + dash / 2);
    const x1 = cx + Math.cos(a) * r1,
      y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * r2,
      y2 = cy + Math.sin(a) * r2;
    const on = i / count < lit;
    out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-opacity="${on ? 1 : dim}" stroke-width="${r * width}" stroke-linecap="round"/>`;
  }
  // Outer halo of fine dots, like the in-app dial.
  for (let i = 0; i < count * 1.5; i++) {
    const a = (i / (count * 1.5)) * Math.PI * 2 - Math.PI / 2;
    const rr = r * 1.32;
    out += `<circle cx="${cx + Math.cos(a) * rr}" cy="${cy + Math.sin(a) * rr}" r="${r * 0.022}" fill="${color}" fill-opacity="${i / (count * 1.5) < lit ? 0.75 : 0.22}"/>`;
  }
  if (core) out += `<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="${color}" fill-opacity="0.16"/>`;
  return out;
}

const bg = (w, h) =>
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACCENT_A}"/><stop offset="1" stop-color="${ACCENT_B}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`;

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const ASSETS = [
  // Legacy/full icon (also used by Expo for the Play icon).
  ['assets/icon.png', 1024, 1024, svg(1024, 1024, bg(1024, 1024) + dial({ cx: 512, cy: 512, r: 270 }))],
  // In-app logo (shown in a rounded tile by <Logo/>); small so it decodes cheaply.
  ['assets/logo.png', 256, 256, svg(256, 256, bg(256, 256) + dial({ cx: 128, cy: 128, r: 68 }))],
  // Adaptive icon: art must sit inside the central 66% safe zone.
  ['assets/android-icon-foreground.png', 1024, 1024, svg(1024, 1024, dial({ cx: 512, cy: 512, r: 200 }))],
  ['assets/android-icon-background.png', 1024, 1024, svg(1024, 1024, bg(1024, 1024))],
  [
    'assets/android-icon-monochrome.png',
    1024,
    1024,
    svg(1024, 1024, dial({ cx: 512, cy: 512, r: 200, dim: 0.45, core: false })),
  ],
  // Splash: the dial on transparent, placed by expo-splash-screen on the background colour.
  ['assets/splash-icon.png', 512, 512, svg(512, 512, dial({ cx: 256, cy: 256, r: 150, color: ACCENT_B, dim: 0.25 }))],
  // Status-bar notification icon: white silhouette only.
  [
    'assets/notification-icon.png',
    96,
    96,
    svg(96, 96, dial({ cx: 48, cy: 48, r: 26, count: 24, width: 0.09, dim: 0.5, core: false })),
  ],
  ['assets/favicon.png', 48, 48, svg(48, 48, bg(48, 48) + dial({ cx: 24, cy: 24, r: 12, count: 20, width: 0.1 }))],
  // Shown in the launcher's widget picker.
  [
    'assets/widget-preview.png',
    360,
    360,
    svg(
      360,
      360,
      `<rect x="6" y="6" width="348" height="348" rx="44" fill="#FFFFFF"/>` +
        dial({ cx: 180, cy: 172, r: 92, color: ACCENT_B, dim: 0.18, core: false }) +
        `<circle cx="180" cy="172" r="66" fill="${ACCENT_B}" fill-opacity="0.1"/>` +
        `<text x="180" y="168" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="40" font-weight="700" fill="#0B0B0F">3h 12m</text>` +
        `<text x="180" y="196" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="17" fill="#6E6E76">of 4h goal</text>` +
        `<text x="180" y="318" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="17" font-weight="600" fill="#6E6E76">Today · 42 pickups</text>`,
    ),
  ],
  // Play Store listing.
  ['docs/play-store/icon-512.png', 512, 512, svg(512, 512, bg(512, 512) + dial({ cx: 256, cy: 256, r: 135 }))],
  [
    'docs/play-store/feature-graphic.png',
    1024,
    500,
    svg(
      1024,
      500,
      bg(1024, 500) +
        dial({ cx: 850, cy: 250, r: 108 }) +
        `<text x="72" y="228" font-family="Inter, -apple-system, Roboto, sans-serif" font-size="58" font-weight="700" fill="#fff" letter-spacing="-1.5">Screen time,</text>` +
        `<text x="72" y="296" font-family="Inter, -apple-system, Roboto, sans-serif" font-size="58" font-weight="700" fill="#fff" fill-opacity="0.75" letter-spacing="-1.5">gently.</text>` +
        `<text x="74" y="350" font-family="Inter, -apple-system, Roboto, sans-serif" font-size="24" fill="#fff" fill-opacity="0.85">ADHD-friendly focus tools · 100% on-device</text>`,
    ),
  ],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, w, h, markup] of ASSETS) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  const out = path.join(root, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
  console.log(`✓ ${file} (${w}×${h})`);
}
await browser.close();
