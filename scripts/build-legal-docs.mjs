#!/usr/bin/env node
// Renders the in-app legal documents (src/legal/content.ts) to Markdown + standalone HTML in
// docs/legal/, so the exact same text can be hosted (e.g. GitHub Pages) and linked from Google Play.
// Usage: npm run legal:docs   (requires Node >= 22.6 for --experimental-strip-types)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { LEGAL_DOCS } = await import(path.join(root, 'src/legal/content.ts'));
const { LEGAL, LEGAL_HAS_PLACEHOLDERS } = await import(path.join(root, 'src/legal/config.ts'));

const outDir = path.join(root, 'docs/legal');
fs.mkdirSync(outDir, { recursive: true });

const FILES = { privacy: 'privacy-policy', terms: 'terms-of-use', health: 'health-disclaimer' };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const doc of Object.values(LEGAL_DOCS)) {
  const md = [`# ${doc.title}`, '', `_${LEGAL.appName} · Effective ${LEGAL.effectiveDate}_`, '', doc.summary, ''];
  const html = [];
  for (const s of doc.sections) {
    md.push(`## ${s.heading}`, '');
    html.push(`<h2>${esc(s.heading)}</h2>`);
    for (const p of s.body) {
      md.push(p, '');
      html.push(`<p>${esc(p)}</p>`);
    }
    if (s.bullets) {
      md.push(...s.bullets.map((b) => `- ${b}`), '');
      html.push(`<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`);
    }
  }
  const name = FILES[doc.id];
  fs.writeFileSync(path.join(outDir, `${name}.md`), md.join('\n'));
  fs.writeFileSync(
    path.join(outDir, `${name}.html`),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(doc.title)} · ${esc(LEGAL.appName)}</title>
<style>:root{color-scheme:light dark}body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:680px;margin:0 auto;padding:48px 20px;color:#0b0b0f;background:#f2f2f4}
@media(prefers-color-scheme:dark){body{color:#f5f5f7;background:#000}.card{background:#111113!important}}
.card{background:#fff;border-radius:24px;padding:28px 28px 12px}h1{font-size:30px;letter-spacing:-.5px;margin:0 0 4px}h2{font-size:18px;margin-top:28px}.meta{color:#8e8e93;margin:0 0 20px}.lead{font-size:18px}</style></head>
<body><div class="card"><h1>${esc(doc.title)}</h1><p class="meta">${esc(LEGAL.appName)} · Effective ${esc(LEGAL.effectiveDate)}</p><p class="lead">${esc(doc.summary)}</p>${html.join('\n')}</div></body></html>\n`,
  );
  console.log(`✓ docs/legal/${name}.{md,html}`);
}
if (LEGAL_HAS_PLACEHOLDERS)
  console.warn('\n⚠️  src/legal/config.ts still has [placeholders] — fill them in before publishing.');
