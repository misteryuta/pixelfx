// Cinematic direction for the ULTIMATE moves: a camera that cuts and moves between framings (close, wide, low, tilted,
// whip pans, shake), and insert shots: full-frame close-ups painted over the scene for a beat (a giant eye opening,
// two eyes split by a slash, the summon or the Susanoo from another angle: from below, from the front, from behind
// it toward the target), on backdrops of speed lines. The viewer applies the camera per frame (zoom about the point it
// frames, a roll) and adds the cinema bars; during an insert the camera sits at 1 so the insert fills the frame.
import { clamp, smooth, ease, hex, mix, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { irisOf } from "./_badge.js";

const INK = hex("#08060c");

/**
 * The camera: keys [t, { z, x, y, r, shake }, how]; how: "cut" (there at once), "whip" (a fast move with a little
 * overshoot), or anything else (an operator's eased move from the previous key). shake: an amount of hand-held jolt.
 */
export function cineCam(list) {
  const keys = [];
  let prev = { z: 1, x: 0, y: -30, r: 0, shake: 0 };
  for (const [t, v, how] of [...list].sort((a, b) => a[0] - b[0])) { prev = { ...prev, shake: 0, ...v }; keys.push({ t, v: prev, how }); }
  return (t) => {
    let o = keys[0].v;
    if (t > keys[0].t) {
      o = keys[keys.length - 1].v;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i], b = keys[i + 1];
        if (t >= b.t) continue;
        if (b.how === "cut") { o = a.v; break; }
        const u = clamp((t - a.t) / (b.t - a.t)), e = b.how === "whip" ? ease.outBack(ease.inOutCubic(u), 1.4) : u * u * (3 - 2 * u);
        o = {};
        for (const k of ["z", "x", "y", "r", "shake"]) o[k] = a.v[k] + (b.v[k] - a.v[k]) * e;
        break;
      }
    }
    const s = o.shake ?? 0, j = s > 0 ? [noise2(t * 31, 1, 7) * s * 3, noise2(t * 29, 2, 8) * s * 3, noise2(t * 23, 3, 9) * s] : [0, 0, 0];
    return { z: o.z, x: o.x + j[0], y: o.y + j[1], r: o.r + j[2] };
  };
}

/** Paint whichever inserts are on at t, last thing in draw(): list of [t0, t1, fn(p, u, t, box)], u 0..1 through it. */
export function inserts(p, t, box, list) {
  for (const [t0, t1, fn] of list) if (t >= t0 && t < t1) fn(p, (t - t0) / (t1 - t0), t, box);
}
/** Camera keys holding the frame still (z 1) through each insert, then cutting back to the key `after` (or holding). */
export const insertKeys = (list) => list.flatMap(([t0, t1]) => [[t0, { z: 1, x: 0, y: -100, r: 0, shake: 0 }, "cut"], [t1 - 0.002, { z: 1, x: 0, y: -100, r: 0, shake: 0 }, "cut"]]);

/**
 * An insert's backdrop over the whole frame: a flat ground (c0) with style "rays" (speed lines converging on (cx, cy)),
 * "flow" (horizontal streaks racing by), "burst" (a starburst of wedges) or "plain"; c1 the lines' colour.
 */
export function backdrop(p, box, t, { c0 = "#120a18", c1 = "#3a2050", style = "rays", cx, cy, k = 1, seed = 1 } = {}) {
  const [x0, y0, x1, y1] = box, C0 = hex(c0), C1 = hex(c1), X = cx ?? (x0 + x1) / 2, Y = cy ?? (y0 + y1) / 2;
  p.shade(x0, y0, x1, y1, (x, y) => {
    if (style === "rays" || style === "burst") {
      const a = Math.atan2(y - Y, x - X), d = Math.hypot(x - X, y - Y), n = Math.floor(((a + Math.PI) / TAU) * (style === "burst" ? 28 : 90));
      const on = rand(n, seed + Math.floor(t * (style === "burst" ? 8 : 24))) > (style === "burst" ? 0.5 : 0.72) && d > 18;
      return on ? mix(C0, C1, clamp(d / 160) * k) : C0;
    }
    if (style === "flow") {
      const row = Math.floor(y / 2), ph = (t * (3 + rand(row, seed) * 4) + rand(row, seed + 1)) % 1;
      return rand(row, seed + 2) > 0.55 && Math.abs((x - x0) / (x1 - x0) - ph) < 0.18 ? C1 : C0;
    }
    return C0;
  });
}

/**
 * A giant eye filling the frame: the skin, the brow, the lids (open 0..1), the white and the iris (kind: an eye from
 * _badge.js, turning by rot), at (cx, cy), iris radius R. skin/shadow/brow colours per character; flip mirrors it.
 */
export function eyeShot(p, box, t, { kind = "sharingan", iris = null, grey = 0, cx, cy, R = 30, open = 1, rot = 0, skin = "#f1c7a3", shadow = "#c9957a", brow = "#1a1418", flip = false, lookX = 0, mark = null, rim = null } = {}) {
  const [x0, y0, x1, y1] = box, X = cx ?? (x0 + x1) / 2, Y = cy ?? (y0 + y1) / 2 + 8, S = hex(skin), SD = hex(shadow), B = hex(brow), base = iris ?? irisOf(kind);
  // grey: the eye's light going out (Izanami's price), the iris fading to a dull grey
  const fn = base && grey > 0 ? (u, v, r, a, ro) => mix(base(u, v, r, a, ro), hex("#8a8690"), grey) : base, RIM = rim ? hex(rim) : null;
  const EH = R * 1.2 * clamp(open), f = flip ? -1 : 1, EW = R * 3.1;
  p.shade(x0, y0, x1, y1, (x, y) => {
    const u = ((x - X) * f) / EW, yy = y - Y;
    // the brow: a band above, thicker toward the nose, slanting down to it, its outer end tapering
    const bt = R * (0.42 - 0.18 * Math.max(0, u)), bv = (yy + R * 2.0 - u * R * 0.35) / bt;
    if (Math.abs(u) < 1.12 && bv > -1 && bv < 1) return B;
    // the almond (its height shrinking toward the corners, the upper lid heavier)
    const half = Math.max(0, 1 - u * u), top = -EH * half * 1.05, bot = EH * half * 0.85;
    if (Math.abs(u) < 1 && yy > top && yy < bot) {
      const iu = (x - X - lookX * R) / R, iv = (yy + R * 0.08) / R, ir = Math.hypot(iu, iv);
      if (ir < 1 && fn) return fn(iu, iv, ir, Math.atan2(iv, iu), rot);
      return yy < top + 3 ? hex("#b8b0b8") : hex("#f4f0f2");
    }
    // the lid lines: the upper thick with lashes at the outer corner, the lower thin
    if (Math.abs(u) < 1.08 && yy > top - 4 && yy <= top + 0.5) return INK;
    if (Math.abs(u) < 1 && u > 0.65 && yy > top - 8 && yy < top - 3 && (Math.floor(x) % 3 === 0)) return INK;
    if (Math.abs(u) < 0.95 && yy >= bot - 0.5 && yy < bot + 1.5) return SD;
    // the fold over the lid, the shading of the socket
    if (Math.abs(u) < 1 && yy > top - R * 0.55 && yy < top - R * 0.42) return SD;
    // a dark ring round the eye (Gaara's sleepless rings), marks (whiskers...)
    if (RIM && Math.abs(u) < 1.18 && yy > top - R * 0.35 && yy < bot + R * 0.3 && !(Math.abs(u) < 1 && yy > top - 4 && yy < bot + 1.5)) return RIM;
    if (mark && mark(u, yy / R)) return hex("#1a1418");
    return Math.hypot(u, yy / (R * 2)) < 1.1 ? mix(S, SD, 0.25) : S;
  });
}

/**
 * Two shots split by a slanted seam through the middle: left(p, d) paints the left side, right(p, d) the right (d: a
 * horizontal offset that slides the halves in); the seam glints. slant: screen px across per px down.
 */
export function splitShot(p, box, t, left, right, { slant = 0.35, u = 1, seam = "#ffffff" } = {}) {
  const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sx = p.cellX(cx, cy), sy = p.cellY(cx, cy), slide = (1 - ease.outCubic(clamp(u))) * 60;
  const clip = (side, fn) => {
    const put = p.put, bl = p.blendPx, add = p.add, ok = (x, y) => side * (x - sx + slant * (y - sy)) < 0;
    p.put = function (x, y, c, a) { if (ok(x, y)) put.call(this, x, y, c, a); };
    p.blendPx = function (x, y, c, a) { if (ok(x, y)) bl.call(this, x, y, c, a); };
    p.add = function (x, y, c, k) { if (ok(x, y)) add.call(this, x, y, c, k); };
    try { fn(); } finally { delete p.put; delete p.blendPx; delete p.add; }
  };
  clip(1, () => left(p, -slide));
  clip(-1, () => right(p, slide));
  const S = hex(seam);
  for (let y = y0; y <= y1; y++) { const x = cx - slant * (y - cy); p.px(x, y, S); p.dot(x + 1, y, S, 0.5); }
}

/** A white (or other) flash at each cut: times, how long (s), colour. */
export function cutFlash(p, box, t, times, d = 0.05, c = WHITE) {
  const [x0, y0, x1, y1] = box;
  for (const c0 of times) if (t >= c0 && t < c0 + d) p.rect(x0, y0, x1 - x0, y1 - y0, c, 1 - ((t - c0) / d) * 0.5);
}
/** Speed lines streaking in toward (cx, cy) from the frame's edges, strength k. */
export function speedLines(p, box, t, cx, cy, k = 1, c = WHITE, seed = 3) {
  if (k <= 0.01) return;
  const [x0, y0, x1, y1] = box, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  for (let i = 0; i < 44; i++) {
    const a = rand(i, seed) * TAU, r0 = R * (0.45 + 0.35 * rand(i, seed + 1 + Math.floor(t * 18))), L = 18 + 46 * rand(i, seed + Math.floor(t * 20));
    p.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * (r0 + L), cy + Math.sin(a) * (r0 + L), c, k * (0.4 + 0.5 * rand(i, seed + 2)));
  }
}
/** A line of text slid in at the bottom left of an insert, in and out over its life u. */
export function caption(p, box, u, text, color = "#ffe8b0") {
  const [x0, , , y1] = box, k = ease.outCubic(clamp(u * 4)) * (1 - smooth(0.85, 1, u));
  if (k <= 0) return;
  p.text(text, x0 + 14 - (1 - k) * 30, y1 - 24, hex(color), { font: "big", outline: INK });
}
