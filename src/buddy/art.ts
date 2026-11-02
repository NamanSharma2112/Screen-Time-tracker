/**
 * Original hamster artwork as layered SVG strings (200×200 frame), in a soft illustrated style:
 * fluffy fur edges, gradient shading, glossy eyes. Each layer is drawn once and then moved/faded as a
 * whole by the animation — nothing is re-rasterised per frame, so it stays smooth on Android.
 */
export type Mood = 'hopeful' | 'neutral' | 'content' | 'happy' | 'excited' | 'overjoyed' | 'eating';

const INK = '#3B2416';

const svg = (defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs>${defs}</defs>${body}</svg>`;

/** Stable 0–1 noise. */
const noise = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * A blob whose outline is made of irregular soft tufts — reads as fur rather than a hard edge.
 * `bottomCalm` (0–1) smooths the lower edge, where fur is pressed flat against the ground.
 */
function fluffy(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tufts: number,
  depth: number,
  seed = 1,
  bottomCalm = 0,
) {
  let d = '';
  for (let i = 0; i <= tufts; i++) {
    const a = (i / tufts) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0) {
      d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      continue;
    }
    const am = ((i - 0.5) / tufts) * Math.PI * 2 - Math.PI / 2;
    const lower = Math.max(0, Math.sin(am)); // 1 at the bottom
    const k = depth * (0.45 + noise(i, seed) * 0.9) * (1 - bottomCalm * lower);
    const lean = (noise(i, seed + 7) - 0.5) * 0.25; // tufts lean a little, irregularly
    const qx = cx + Math.cos(am + lean / tufts) * (rx + k);
    const qy = cy + Math.sin(am + lean / tufts) * (ry + k);
    d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ' Z';
}

/** Short curved strokes just inside an outline, suggesting fur texture. */
function furStrokes(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  color: string,
  seed: number,
  from = 0,
  to = 1,
) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * (i + noise(i, seed) * 0.6)) / n;
    const a = t * Math.PI * 2 - Math.PI / 2;
    const r = 0.86 + noise(i, seed + 3) * 0.08;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    const len = 5 + noise(i, seed + 5) * 4;
    const nx = Math.cos(a) * len;
    const ny = Math.sin(a) * len;
    out += `<path d="M${(x - nx * 0.5).toFixed(1)} ${(y - ny * 0.5).toFixed(1)} q${(nx * 0.5 - ny * 0.25).toFixed(1)} ${(ny * 0.5 + nx * 0.25).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}" stroke="${color}" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.5"/>`;
  }
  return out;
}

const DEFS = `
  <radialGradient id="fur" cx="38%" cy="28%" r="80%">
    <stop offset="0" stop-color="#FAD39A"/><stop offset="0.55" stop-color="#EFA95A"/><stop offset="1" stop-color="#D1823A"/>
  </radialGradient>
  <radialGradient id="cream" cx="50%" cy="35%" r="70%">
    <stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#F6E3C6"/>
  </radialGradient>
  <radialGradient id="ear" cx="50%" cy="45%" r="60%">
    <stop offset="0" stop-color="#FFC3C3"/><stop offset="1" stop-color="#EE8F95"/>
  </radialGradient>
  <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="blush" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#FF8FA3" stop-opacity="0.85"/><stop offset="1" stop-color="#FF8FA3" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="iris" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#6B4430"/><stop offset="0.6" stop-color="#2B1A10"/><stop offset="1" stop-color="#140B06"/>
  </radialGradient>
  <linearGradient id="paw" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF4E6"/><stop offset="1" stop-color="#F1D2AE"/>
  </linearGradient>`;

/** Ears are separate layers so each can twitch on its own. */
export const EAR_L = svg(
  DEFS,
  `<path d="${fluffy(56, 58, 18, 17, 9, 2.2, 3)}" fill="url(#fur)"/><ellipse cx="57.5" cy="59.5" rx="10" ry="9.5" fill="url(#ear)"/>`,
);
export const EAR_R = svg(
  DEFS,
  `<path d="${fluffy(144, 58, 18, 17, 9, 2.2, 4)}" fill="url(#fur)"/><ellipse cx="142.5" cy="59.5" rx="10" ry="9.5" fill="url(#ear)"/>`,
);

/** Body, belly, cheek fluff, feet, nose — identical for every mood. */
export const BODY = svg(
  DEFS,
  `
  <ellipse cx="100" cy="184" rx="62" ry="8" fill="url(#shadow)"/>
  <!-- body: a chubby pear — wide, soft bottom; round head -->
  <path d="${fluffy(100, 124, 72, 58, 36, 4.5, 11, 0.85)}" fill="url(#fur)"/>
  <path d="${fluffy(100, 96, 60, 52, 30, 4, 21, 0.9)}" fill="url(#fur)"/>
  ${furStrokes(100, 124, 70, 56, 7, '#B86F2C', 31, 0.14, 0.36)}
  ${furStrokes(100, 124, 70, 56, 7, '#B86F2C', 37, 0.64, 0.86)}
  <!-- rim light on the upper-left fur -->
  <path d="M52 78 Q60 52 92 46" stroke="#FFE7C2" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7"/>
  <!-- darker crown stripe -->
  <path d="M88 47 Q100 42 112 47 Q107 57 100 58 Q93 57 88 47 Z" fill="#C7772F" fill-opacity="0.3"/>
  <!-- white muzzle + cheek fluff, and belly -->
  <path d="${fluffy(100, 112, 46, 33, 24, 2.6, 41, 0.3)}" fill="url(#cream)"/>
  <path d="${fluffy(100, 154, 40, 27, 20, 2.4, 51, 0.6)}" fill="url(#cream)"/>
  <!-- feet with pink pads -->
  <ellipse cx="74" cy="178" rx="15" ry="7.5" fill="url(#paw)"/><ellipse cx="74" cy="178.5" rx="5" ry="2.8" fill="#F7A9AE"/>
  <ellipse cx="126" cy="178" rx="15" ry="7.5" fill="url(#paw)"/><ellipse cx="126" cy="178.5" rx="5" ry="2.8" fill="#F7A9AE"/>
  <!-- whisker pores + nose -->
  <circle cx="82" cy="104" r="1.3" fill="#C9A27C"/><circle cx="78" cy="109" r="1.3" fill="#C9A27C"/>
  <circle cx="118" cy="104" r="1.3" fill="#C9A27C"/><circle cx="122" cy="109" r="1.3" fill="#C9A27C"/>
  <path d="M94.5 96 Q100 92.5 105.5 96 Q103 101.5 100 101.5 Q97 101.5 94.5 96 Z" fill="#F08A97"/>
  <ellipse cx="98.4" cy="95.6" rx="1.8" ry="1" fill="#fff" fill-opacity="0.8"/>
`,
);

/** Little front paws held at the chest (drawn above the cookie when eating). */
export const PAWS = svg(
  DEFS,
  `
  <ellipse cx="85" cy="138" rx="10" ry="8.5" fill="url(#paw)"/>
  <path d="M80 134 L80 138 M85 133 L85 137 M90 134 L90 138" stroke="#D9B48C" stroke-width="1.2" stroke-linecap="round"/>
  <ellipse cx="115" cy="138" rx="10" ry="8.5" fill="url(#paw)"/>
  <path d="M110 134 L110 138 M115 133 L115 137 M120 134 L120 138" stroke="#D9B48C" stroke-width="1.2" stroke-linecap="round"/>
`,
);

/** Paws thrown up in celebration. */
export const PAWS_UP = svg(
  DEFS,
  `
  <ellipse cx="40" cy="98" rx="10" ry="12.5" fill="url(#paw)" transform="rotate(-28 40 98)"/>
  <ellipse cx="160" cy="98" rx="10" ry="12.5" fill="url(#paw)" transform="rotate(28 160 98)"/>
`,
);

/** Open, glossy eyes — on their own layer so they can blink. Null for moods with closed "^ ^" eyes. */
export function eyes(mood: Mood) {
  if (mood === 'happy' || mood === 'excited' || mood === 'overjoyed' || mood === 'eating') return null;
  const big = mood === 'hopeful';
  const r = big ? 10.5 : 9;
  const eye = (cx: number) => `
    <ellipse cx="${cx}" cy="84" rx="${r}" ry="${r * 1.08}" fill="url(#iris)"/>
    <circle cx="${cx + r * 0.32}" cy="${84 - r * 0.38}" r="${r * (big ? 0.42 : 0.36)}" fill="#fff"/>
    <circle cx="${cx - r * 0.35}" cy="${84 + r * 0.4}" r="${r * 0.16}" fill="#fff" fill-opacity="0.9"/>
    ${big ? `<path d="M${cx - r} ${84 + r * 0.7} Q${cx} ${84 + r * 1.35} ${cx + r} ${84 + r * 0.7}" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5" fill="none"/>` : ''}`;
  return svg(DEFS, eye(77) + eye(123));
}

/** Brows, closed "^ ^" eyes, mouth and blush for each mood. */
export function face(mood: Mood) {
  const blush = (o: number, r = 13) =>
    `<ellipse cx="62" cy="106" rx="${r}" ry="${r * 0.62}" fill="url(#blush)" opacity="${o}"/>` +
    `<ellipse cx="138" cy="106" rx="${r}" ry="${r * 0.62}" fill="url(#blush)" opacity="${o}"/>`;
  const happyEyes = `
    <path d="M66 87 Q77 73 88 87" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M112 87 Q123 73 134 87" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  const catMouth = (wide = 1) =>
    `<path d="M${100 - 9 * wide} 107 Q${100 - 4.5 * wide} ${113 + wide} 100 107.5 Q${100 + 4.5 * wide} ${113 + wide} ${100 + 9 * wide} 107" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  // Open smile with a tongue; h = how wide.
  const openSmile = (h: number) =>
    `<path d="M${100 - h} 106 Q100 ${106 + h * 2.1} ${100 + h} 106 Q100 ${106 + h * 0.35} ${100 - h} 106 Z" fill="#7E2F33"/>` +
    `<path d="M${100 - h * 0.55} ${106 + h * 1.05} Q100 ${106 + h * 1.85} ${100 + h * 0.55} ${106 + h * 1.05} Q100 ${106 + h * 0.65} ${100 - h * 0.55} ${106 + h * 1.05} Z" fill="#F4808F"/>`;

  switch (mood) {
    case 'hopeful':
      // Big puppy eyes, soft raised brows: "shall we?"
      return svg(
        DEFS,
        `<path d="M64 66 Q75 59 87 64" stroke="#B9732F" stroke-width="3.4" stroke-linecap="round" fill="none"/>
         <path d="M113 64 Q125 59 136 66" stroke="#B9732F" stroke-width="3.4" stroke-linecap="round" fill="none"/>
         <path d="M94 110 Q100 107 106 110" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
         ${blush(0.55, 12)}`,
      );
    case 'neutral':
      return svg(DEFS, `${catMouth(0.9)}${blush(0.55, 12)}`);
    case 'content':
      return svg(DEFS, `${catMouth(1.25)}${blush(0.8, 13)}`);
    case 'happy':
      return svg(DEFS, `${happyEyes}${openSmile(8)}${blush(0.85, 13)}`);
    case 'excited':
      return svg(DEFS, `${happyEyes}${openSmile(10.5)}${blush(1, 14)}`);
    case 'overjoyed':
      return svg(DEFS, `${happyEyes}${openSmile(13)}${blush(1, 16)}`);
    case 'eating':
      // Stuffed cheeks and a munching mouth.
      return svg(
        DEFS,
        `${happyEyes}
         <path d="${fluffy(62, 108, 21, 17, 14, 2.2, 61, 0.2)}" fill="url(#cream)"/>
         <path d="${fluffy(138, 108, 21, 17, 14, 2.2, 62, 0.2)}" fill="url(#cream)"/>
         ${blush(0.9, 12)}
         <path d="M94 110 Q100 116 106 110" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
      );
  }
}

/** A chocolate-chip cookie (40×40). */
export const COOKIE = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <defs><radialGradient id="ck" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#E7B06A"/><stop offset="1" stop-color="#B9773A"/></radialGradient></defs>
  <path d="${fluffy(20, 20, 16.5, 16.5, 16, 1.1, 71)}" fill="url(#ck)"/>
  <circle cx="13" cy="14" r="2.8" fill="#4A2A18"/><circle cx="25" cy="11.5" r="2.3" fill="#4A2A18"/><circle cx="27.5" cy="24" r="2.8" fill="#4A2A18"/>
  <circle cx="15" cy="27" r="2.3" fill="#4A2A18"/><circle cx="20.5" cy="19.5" r="1.9" fill="#4A2A18"/>
  <ellipse cx="14" cy="11" rx="4" ry="2" fill="#fff" fill-opacity="0.25"/></svg>`;

/** Sparkle star with a soft glow (24×24). */
export const SPARKLE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <defs><radialGradient id="g"><stop offset="0" stop-color="#FFE48A" stop-opacity="0.9"/><stop offset="1" stop-color="#FFE48A" stop-opacity="0"/></radialGradient></defs>
  <circle cx="12" cy="12" r="11" fill="url(#g)"/>
  <path d="M12 2 Q13 10 22 12 Q13 14 12 22 Q11 14 2 12 Q11 10 12 2 Z" fill="#FFC531"/></svg>`;

/** Mood for a running session at progress p (0–1): happier as you go. */
export function moodFor(progress: number): Mood {
  if (progress >= 0.75) return 'excited';
  if (progress >= 0.5) return 'happy';
  if (progress >= 0.25) return 'content';
  return 'neutral';
}
