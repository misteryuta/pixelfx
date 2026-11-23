// Sprites the team drew (assets/sprites/*.png, native pixel size), drawn as cut-out puppets: one part (an arm) can be
// cut out by a mask and turned about its pivot; the hole it leaves is filled from the body pixels beside it. Scaled
// with nearest sampling (whole pixel blocks), mirrored, tinted, flattened to a solid silhouette, cropped.
import { readFileSync, existsSync } from "node:fs";
import { decodePNG, ASSETS } from "./_cine3d.js";

const cache = new Map();
/** A sprite: { w, h, data } or null when the file can't be read (a browser). */
export function spriteOf(name) {
  if (cache.has(name)) return cache.get(name);
  let s = null;
  try { const f = ASSETS + "sprites/" + name + ".png"; if (existsSync(f)) s = decodePNG(readFileSync(f)); } catch (e) { s = null; }
  cache.set(name, s);
  return s;
}
const px = (s, x, y) => (x < 0 || y < 0 || x >= s.w || y >= s.h ? 0 : s.data[(y * s.w + x) * 4 + 3] > 127 ? (255 << 24) | (s.data[(y * s.w + x) * 4 + 2] << 16) | (s.data[(y * s.w + x) * 4 + 1] << 8) | s.data[(y * s.w + x) * 4] : 0);
const mixc = (c, t, k) => {
  const r = (c & 255) + ((t & 255) - (c & 255)) * k, g = ((c >>> 8) & 255) + (((t >>> 8) & 255) - ((c >>> 8) & 255)) * k, b = ((c >>> 16) & 255) + (((t >>> 16) & 255) - ((c >>> 16) & 255)) * k;
  return (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r);
};

/**
 * Draw sprite s with its anchor (ax, ay) in sprite px at (x, y). opts: scale, flip, a (alpha), tint + k, solid (one
 * colour), crop [x0, y0, x1, y1] in sprite px, sy (squash), part: { mask(x, y) -> bool, pivot: [px, py], rot }.
 * Returns where = (sx, sy) -> screen point of a sprite point, the part turned if it belongs to it.
 */
export function drawSprite(p, s, x, y, { ax = 0, ay = 0, scale = 1, sy = 1, flip = false, a = 1, tint = null, k = 0, solid = null, crop = null, part = null } = {}) {
  if (!s) return () => [x, y];
  const [c0, r0, c1, r1] = crop ?? [0, 0, s.w, s.h], f = flip ? -1 : 1, S = scale, SY = scale * sy;
  const rot = part?.rot ?? 0, cs = Math.cos(rot), sn = Math.sin(rot), [pvx, pvy] = part?.pivot ?? [0, 0];
  const toScreen = (u, v) => [x + f * (u - ax) * S, y + (v - ay) * SY];
  const where = (u, v, inPart = true) => {
    if (part && inPart) { const du = u - pvx, dv = v - pvy; u = pvx + du * cs - dv * sn; v = pvy + du * sn + dv * cs; }
    return toScreen(u, v);
  };
  const ext = Math.max(s.w, s.h) * 1.5;
  const bx0 = x - ext * S, bx1 = x + ext * S, by0 = y - (ay + ext) * SY, by1 = y + (s.h - ay + ext) * SY;
  const color = (c) => (solid !== null ? solid : tint !== null && k > 0 ? mixc(c, tint, k) : c);
  p.shade(bx0, by0, bx1, by1, (X, Y, out) => {
    const u = f * (X - x) / S + ax, v = (Y - y) / SY + ay;
    // the part, turned: look the screen point up in the part's own frame
    if (part) {
      const du = u - pvx, dv = v - pvy, pu = pvx + du * cs + dv * sn, pv = pvy - du * sn + dv * cs, iu = Math.floor(pu), iv = Math.floor(pv);
      if (iu >= c0 && iu < c1 && iv >= r0 && iv < r1 && part.mask(iu, iv)) { const c = px(s, iu, iv); if (c) { out.a = a; return color(c); } }
    }
    const iu = Math.floor(u), iv = Math.floor(v);
    if (iu < c0 || iu >= c1 || iv < r0 || iv >= r1) return;
    let c = px(s, iu, iv);
    if (!c) return;
    // where the part was: fill from the body beside it (or leave it empty if the part stood clear of the body)
    if (part && rot !== 0 && part.mask(iu, iv)) {
      c = 0;
      for (let d = 1; d < 6 && !c; d++) if (!part.mask(iu + d, iv)) c = px(s, iu + d, iv);
      if (!c || !part.body(iu, iv)) return;
    }
    out.a = a;
    return color(c);
  });
  return where;
}
