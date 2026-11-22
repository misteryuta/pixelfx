// Shared staging for the ULTIMATE moves (one per main-cast character, lore-based; see the viewer's ULTIMATE section):
// a darkened sky that closes in behind the scene while the ultimate builds, an "ULTIMATE" banner with the technique's
// name sweeping in at the start, and speed streaks for the decisive instant. Every ultimate keeps at most one impact
// frame of its own style; these helpers add none.
import { clamp, smooth, ease, hex, noise2, rand, mix, WHITE } from "../../core/index.js";

const GOLD = ["#3a2406", "#8a5a10", "#e0a428", "#ffe28a", "#fff8dc"].map(hex), INK = hex("#0a0610");

/** The frame box of an effect in its own coordinates (feet at 0, 0): [x0, y0, x1, y1]. */
export const frameOf = (meta) => [-meta.origin[0], -meta.origin[1], meta.size[0] - meta.origin[0], meta.size[1] - meta.origin[1]];

/**
 * The ultimate's sky: from t0 the background behind everything darkens toward `tone` (dithered, so the floor and the
 * figures stay crisp), with slow drifting wisps of `glow`; it lifts again by t1. Draw it first in drawBack.
 */
export function ultSky(p, t, box, { t0, t1, tone = "#0a0614", glow = "#3a2a6a", k = 0.75 }) {
  const a = smooth(t0, t0 + 0.35, t) * (1 - smooth(t1 - 0.4, t1, t)) * k;
  if (a <= 0.01) return;
  const [x0, y0, x1] = box, T = hex(tone), G = hex(glow);
  p.shade(x0, y0, x1, 0, (x, y, out) => {
    const v = (y - y0) / -y0, n = noise2(x * 0.025 + t * 0.3, y * 0.04 - t * 0.15, 41);
    out.a = a * (0.55 + 0.45 * (1 - v));
    return n > 0.42 ? mix(T, G, Math.min(0.55, (n - 0.42) * 2)) : T;
  });
}

/**
 * The banner: a slanted gold brush stroke sweeps in from the left at t0, "ULTIMATE" in small gold letters over the
 * technique's name in big letters, held, then wiped off by t0 + hold.
 */
export function ultBanner(p, t, box, { t0 = 0.05, name, hold = 1.3, color = "#ffe28a" }) {
  const age = t - t0;
  if (age < 0 || age > hold + 0.25) return;
  const [x0, y0] = box, inn = ease.outCubic(clamp(age / 0.22)), out = ease.inCubic(clamp((age - hold) / 0.25));
  const W = 30 + name.length * 6 + 16, X = x0 + 6 - (1 - inn) * (W + 20) + out * (W + 40), Y = y0 + 8;
  // the stroke: a slanted bar, ragged at its ends, dark gold under bright
  for (let i = 0; i < 18; i++) {
    const y = Y + i, sl = (18 - i) * 0.5, rag = rand(i, 3) * 6;
    p.line(X + sl - rag, y, X + sl + W + rag * 0.6, y, i < 2 || i > 15 ? GOLD[1] : GOLD[0], 0.85);
  }
  p.line(X + 9, Y + 1, X + W + 4, Y + 1, GOLD[2]);
  p.text("ULTIMATE", X + 12, Y + 2, GOLD[3], { font: "mini", outline: INK });
  p.text(name, X + 12, Y + 9, (gx, gy) => (gy < 2 ? GOLD[4] : gy < 4 ? hex(color) : GOLD[2]), { font: "big", outline: INK });
  // a glint running along the stroke
  const g = (age * 1.6) % 1.4;
  if (g < 1) p.line(X + 9 + g * W, Y, X + 4 + g * W, Y + 17, WHITE, 0.7);
}

/** Speed streaks across the frame (the decisive instant), drifting in direction dir (1 right, -1 left), strength k. */
export function ultStreaks(p, t, box, k, dir = 1, c = WHITE) {
  if (k <= 0.01) return;
  const [x0, y0, x1, y1] = box, W = x1 - x0;
  for (let i = 0; i < 26; i++) {
    const y = y0 + rand(i, 1) * (y1 - y0 - 10), L = 20 + rand(i, 2) * 60, ph = (t * (3 + rand(i, 3) * 3) + rand(i, 4)) % 1, x = dir > 0 ? x0 + ph * (W + L) - L : x1 - ph * (W + L);
    p.line(x, y, x + L, y, c, k * (0.3 + 0.5 * rand(i, 5)));
  }
}

/** Draw fn() so that only what is above the floor line shows (things rising out of the ground). */
export function aboveGround(p, fn) {
  const gy = p.cellY(0, 0), put = p.put, bl = p.blendPx;
  p.put = function (sx, sy, c, a) { if (sy < gy) put.call(this, sx, sy, c, a); };
  p.blendPx = function (sx, sy, c, a) { if (sy < gy) bl.call(this, sx, sy, c, a); };
  try { fn(); } finally { delete p.put; delete p.blendPx; }
}
