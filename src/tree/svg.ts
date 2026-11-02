import type { TreeModel } from './model';

/**
 * Draws the streak tree as an SVG string (used by both the app, via SvgXml, and the home-screen
 * widget). Procedural but deterministic: the same model always draws the same tree, and new leaves
 * appear in new places without the old ones jumping around.
 */
export function treeSvg(
  m: Pick<TreeModel, 'growth' | 'vitality' | 'today'>,
  opts: { accent: string; dark: boolean; size?: number },
) {
  const S = opts.size ?? 200;
  const k = S / 200;
  const { growth, vitality } = m;
  const parts: string[] = [];
  const f = (n: number) => (n * k).toFixed(1);

  const potColor = opts.dark ? '#C46A4F' : '#E07A5F';
  const potDark = opts.dark ? '#9C5340' : '#C8664D';
  const soil = opts.dark ? '#5A4032' : '#6F4E37';
  const bark = opts.dark ? '#A47B57' : '#8B5E3C';

  // Leaf colour: lively green → tired olive as vitality drops.
  const leaf = mix('#34C759', '#B8A15A', 1 - (vitality - 0.3) / 0.7);
  const leafLight = mix(leaf, '#FFFFFF', 0.25);
  const droop = (1 - vitality) * 55; // degrees

  // Pot + soil.
  parts.push(
    `<path d="M${f(62)} ${f(158)} L${f(138)} ${f(158)} L${f(130)} ${f(196)} Q${f(130)} ${f(198)} ${f(127)} ${f(198)} L${f(73)} ${f(198)} Q${f(70)} ${f(198)} ${f(70)} ${f(196)} Z" fill="${potColor}"/>`,
  );
  parts.push(`<rect x="${f(56)}" y="${f(150)}" width="${f(88)}" height="${f(12)}" rx="${f(5)}" fill="${potDark}"/>`);
  parts.push(`<ellipse cx="${f(100)}" cy="${f(152)}" rx="${f(40)}" ry="${f(4)}" fill="${soil}"/>`);

  if (growth === 0) {
    // A seed waiting in the soil, with a tiny hopeful shoot when today is on track.
    parts.push(`<ellipse cx="${f(100)}" cy="${f(147)}" rx="${f(6)}" ry="${f(4.5)}" fill="#A0703F"/>`);
    if (m.today) parts.push(budPath(100, 141, f, leaf));
    return wrap(S, parts, growth);
  }

  // Trunk grows with leaves, then levels off.
  const g = Math.min(growth, 60);
  const height = 18 + Math.min(g, 40) * 1.9 + Math.max(0, g - 40) * 0.4; // up to ~102
  const topY = 150 - height;
  const sway = 6 * Math.sin(growth * 0.7);
  const trunkW = 2.5 + Math.min(g, 50) * 0.13;
  parts.push(
    `<path d="M${f(100)} ${f(150)} Q${f(100 + sway * 1.6)} ${f(150 - height * 0.55)} ${f(100 + sway)} ${f(topY)}" stroke="${bark}" stroke-width="${f(trunkW)}" stroke-linecap="round" fill="none"/>`,
  );

  // Branches, alternating sides, from the bottom up.
  const branchCount = Math.min(Math.floor(growth / 2), 10);
  const anchors: { x: number; y: number; ang: number }[] = [{ x: 100 + sway, y: topY, ang: -90 }];
  for (let i = 0; i < branchCount; i++) {
    const t = 0.38 + (i / Math.max(1, branchCount)) * 0.55;
    const by = 150 - height * t;
    const bx = 100 + sway * t * 1.2;
    const side = i % 2 === 0 ? -1 : 1;
    const len = Math.min(14 + growth * 0.55, 46) * (1 - t * 0.35);
    const ang = -90 + side * (38 + (i % 3) * 8);
    const ex = bx + Math.cos((ang * Math.PI) / 180) * len;
    const ey = by + Math.sin((ang * Math.PI) / 180) * len;
    parts.push(
      `<path d="M${f(bx)} ${f(by)} Q${f((bx + ex) / 2)} ${f((by + ey) / 2 + 3)} ${f(ex)} ${f(ey)}" stroke="${bark}" stroke-width="${f(Math.max(1.4, trunkW * 0.45))}" stroke-linecap="round" fill="none"/>`,
    );
    anchors.push({ x: ex, y: ey, ang });
  }

  // A soft canopy once it's a young tree, so it reads as full rather than spiky.
  if (growth >= 14) {
    const cy = topY + height * 0.18;
    const r = Math.min(26 + growth * 0.45, 44);
    parts.push(`<circle cx="${f(100 + sway)}" cy="${f(cy)}" r="${f(r)}" fill="${leaf}" fill-opacity="0.22"/>`);
  }

  // Leaves: leaf i always goes to the same anchor and the same offset.
  const leaves = Math.min(growth, 48);
  for (let i = 0; i < leaves; i++) {
    const a = anchors[i % anchors.length];
    const ring = Math.floor(i / anchors.length);
    const jitter = pseudo(i);
    const dist = 4 + ring * 6 + jitter * 4;
    const dir = a.ang + (jitter - 0.5) * 120;
    const x = a.x + Math.cos((dir * Math.PI) / 180) * dist;
    const y = a.y + Math.sin((dir * Math.PI) / 180) * dist;
    const rot = dir + 90 + droop * (x < 100 ? -1 : 1);
    const fill = i % 3 === 0 ? leafLight : leaf;
    parts.push(
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(6.5)}" ry="${f(3.8)}" fill="${fill}" transform="rotate(${rot.toFixed(0)} ${f(x)} ${f(y)})"/>`,
    );
    // Blossoms on a well-loved tree.
    if (growth >= 60 && i % 4 === 1)
      parts.push(`<circle cx="${f(x + 3)}" cy="${f(y - 2)}" r="${f(2.6)}" fill="${opts.accent}"/>`);
  }

  // Today's bud: the leaf that will appear at midnight if today stays under goal.
  if (m.today) parts.push(budPath(100 + sway, topY - 5, f, leaf));

  return wrap(S, parts, growth);
}

function budPath(x: number, y: number, f: (n: number) => string, leaf: string) {
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4)}" ry="${f(6)}" fill="none" stroke="${leaf}" stroke-width="${f(1.6)}" stroke-dasharray="${f(2)} ${f(2)}"/>`;
}

/** Small plants are framed closer (the "camera" pulls back as the tree grows), anchored on the pot. */
function wrap(S: number, parts: string[], growth: number) {
  const V = (growth < 3 ? 120 : growth < 7 ? 145 : growth < 14 ? 170 : 200) * (S / 200);
  const x = S / 2 - V / 2;
  const y = S - V;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${V.toFixed(1)} ${V.toFixed(1)}">${parts.join('')}</svg>`;
}

/** Stable 0–1 noise per leaf index. */
function pseudo(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function mix(a: string, b: string, t: number) {
  const tt = Math.max(0, Math.min(1, t));
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - tt) + ((pb >> s) & 255) * tt);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
