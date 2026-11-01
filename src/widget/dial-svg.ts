/**
 * The Today dial as an SVG string, for surfaces that can't run React Native views
 * (the home-screen widget renders SVG to a bitmap). Same rings as `DottedDial`.
 */
const RINGS = [
  { r: 0.64, count: 44, size: 3.6, opacity: 1, dash: true },
  { r: 0.75, count: 56, size: 2.6, opacity: 0.85 },
  { r: 0.86, count: 66, size: 1.9, opacity: 0.6 },
  { r: 0.97, count: 78, size: 1.4, opacity: 0.38 },
];

export function dialSvg({
  size,
  progress,
  accent,
  track,
}: {
  size: number;
  progress: number;
  accent: string;
  track: string;
}) {
  const c = size / 2;
  const R = size / 2;
  const scale = size / 268; // dot sizes were tuned for a 268px dial
  const lit = Math.max(0, Math.min(1, progress));
  let body = `<circle cx="${c}" cy="${c}" r="${R * 0.54}" fill="${accent}" fill-opacity="0.12"/>`;
  for (const ring of RINGS) {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 - Math.PI / 2;
      const x = c + Math.cos(a) * R * ring.r;
      const y = c + Math.sin(a) * R * ring.r;
      const fill = i / ring.count < lit ? accent : track;
      const s = ring.size * scale;
      if (ring.dash) {
        const deg = (a * 180) / Math.PI;
        body += `<rect x="${-s * 0.9}" y="${-s / 2}" width="${s * 1.8}" height="${s}" rx="${s / 2.5}" fill="${fill}" fill-opacity="${ring.opacity}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(1)})"/>`;
      } else {
        body += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(s / 2).toFixed(2)}" fill="${fill}" fill-opacity="${ring.opacity}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
}
