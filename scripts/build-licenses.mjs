#!/usr/bin/env node
// Collects the licence of every production dependency that ships in the app and writes
// src/legal/licenses.json for the in-app "Open-source licences" screen.
// Usage: npm run legal:licenses (re-run after adding or upgrading dependencies)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirs = execSync('npm ls --omit=dev --all --parseable', { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  .toString()
  .split('\n')
  .filter((d) => d && d !== root);

const LICENSE_FILES = /^(licen[cs]e|copying|notice)(\.(md|txt|markdown))?$/i;
const texts = new Map(); // dedupe identical licence texts
const packages = new Map();

for (const dir of dirs) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch {
    continue;
  }
  if (!pkg.name || pkg.private) continue;
  const key = `${pkg.name}@${pkg.version}`;
  if (packages.has(key)) continue;
  const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'See package');
  const file = fs.readdirSync(dir).find((f) => LICENSE_FILES.test(f));
  let textId = null;
  if (file) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8').trim();
    if (!texts.has(text)) texts.set(text, texts.size);
    textId = texts.get(text);
  }
  packages.set(key, { name: pkg.name, version: pkg.version, license, textId });
}

const out = {
  packages: [...packages.values()].sort((a, b) => a.name.localeCompare(b.name)),
  texts: [...texts.keys()],
};
fs.writeFileSync(path.join(root, 'src/legal/licenses.json'), JSON.stringify(out));
console.log(`✓ ${out.packages.length} packages, ${out.texts.length} unique licence texts → src/legal/licenses.json`);
