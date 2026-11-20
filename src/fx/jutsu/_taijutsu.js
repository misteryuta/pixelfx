// Taijutsu (helper, not an effect): what the hand-to-hand fights share. Two fighters: the act's own character on the
// left, facing right, and a rival drawn here from the same rig, mirrored to face him, in another color. Moves are pose
// keys like any act's (poseAt, 12 fps limbs); the rival's x runs toward the hero. Plus the cinema: hit sparks and
// block sparks, smears behind fists and feet sampled from the motion itself, speed lines for a rush, a clash ring.
// Hits carry an `sfx` tag (punch, heavy, kick, block, parry, whoosh, clash, land, step) so a game can sound them.
import { poseAt, skeleton, hex, clamp, smooth, ease, rand, WHITE, TAU, mix } from "../../core/index.js";
import { drawFigure } from "./_lib.js";

/**
 * A camera over time from shots: [[t, { z, x, y, r }, "cut"?], ...]. Between shots it glides (Hermite keys); a shot
 * marked "cut" jumps there at once, like an edit. Returns camera(t) for an effect to export.
 */
export function shots(list) {
  // each shot eases into the next (in and out, like a camera operator's move); a "cut" holds the last framing until
  // the moment of the cut, then is simply there
  const keys = [];
  let prev = { z: 1, x: 0, y: -24, r: 0 };
  for (const [t, v, how] of list) keys.push({ t, v: (prev = { ...prev, ...v }), cut: how === "cut" });
  return (t) => {
    if (t <= keys[0].t) return { ...keys[0].v };
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t >= b.t) continue;
      if (b.cut) return { ...a.v };
      const u = (t - a.t) / (b.t - a.t), e = u * u * (3 - 2 * u), o = {};
      for (const k of ["z", "x", "y", "r"]) o[k] = a.v[k] + (b.v[k] - a.v[k]) * e;
      return o;
    }
    return { ...keys[keys.length - 1].v };
  };
}

export const GUARD = { crouch: 5, lean: 3, fx: 9, fy: -26, bx: 13, by: -24, ffx: 8, fbx: -8 };
export const RUN = { crouch: 7, lean: 14, fx: -7, fy: -17, bx: -9, by: -19, ffx: 12, fbx: -12, ghost: true };
export const JAB = { crouch: 4, lean: 8, fx: 23, fy: -27, bx: 9, by: -25, ffx: 11, fbx: -9 };
export const CROSS = { crouch: 5, lean: 11, fx: 5, fy: -25, bx: 25, by: -27, ffx: 13, fbx: -10, twist: 3 };
export const WIND = { crouch: 6, lean: -4, fx: -10, fy: -26, bx: 10, by: -27, ffx: 8, fbx: -10 };
export const HAYMAKER = { crouch: 5, lean: 14, fx: 26, fy: -28, bx: 2, by: -22, ffx: 14, fbx: -11, twist: -2, ghost: true };
export const UPPER = { crouch: 0, lean: 6, fx: 17, fy: -40, bx: 6, by: -24, ffx: 10, fbx: -9, toeB: true };
export const KICK = { crouch: 2, lean: -8, fx: 2, fy: -26, bx: -6, by: -24, ffx: 25, ffy: -27, fbx: -3 };
export const LOWKICK = { crouch: 12, lean: 4, fx: 4, fy: -14, bx: -6, by: -12, ffx: 26, ffy: -2, fbx: -6 };
export const KNEE = { crouch: 3, lean: 6, fx: 14, fy: -28, bx: 18, by: -29, ffx: 12, ffy: -18, fbx: -6 };
export const BLOCK = { crouch: 6, lean: -2, fx: 9, fy: -31, bx: 10, by: -28, armsFront: true, ffx: 6, fbx: -10 };
export const PARRY = { crouch: 5, lean: -2, fx: 15, fy: -33, bx: 9, by: -22, ffx: 8, fbx: -9 };
export const PARRY2 = { crouch: 5, lean: -2, fx: 6, fy: -22, bx: 16, by: -32, ffx: 8, fbx: -9 };
export const DUCK = { crouch: 15, lean: 15, fx: 9, fy: -15, bx: 11, by: -13, ffx: 10, fbx: -9 };
export const RECOIL = { crouch: 3, lean: -11, fx: -2, fy: -22, bx: 3, by: -20, hx: -2, ffx: 5, fbx: -12 };
export const FLY = { crouch: 0, lean: -16, fx: -8, fy: -30, bx: -3, by: -33, ffx: 12, ffy: -10, fbx: 3, fby: -6 };
export const GUT = { crouch: 7, lean: 16, fx: 6, fy: -18, bx: 9, by: -17, ffx: 4, fbx: -10 };
export const LAND = { crouch: 13, lean: 6, fx: 12, fy: -14, bx: -6, by: -16, ffx: 10, fbx: -12 };

export const RIVAL = hex("#c8502a");

/** A rival's pose track: () => { q, x, y } at time t; bx: where his feet stand when his own x is 0. */
export function rival(keys, bx) {
  return (t) => {
    const q = poseAt(keys, t);
    return { q, x: bx - (q.x ?? 0), y: q.y ?? 0 };
  };
}
/** A joint of a rival (mirrored) or of the hero, in the effect's space. */
export function jointOf(q, name, x, y, face = 1) {
  const j = skeleton(q).joints[name];
  return face > 0 ? [x + j[0], y + j[1]] : [x - j[0] - 1, y + j[1]];
}
export function drawRival(p, R, t, tint = RIVAL) {
  const s = R(t);
  // his shadow, then him
  p.ellipse(s.x, 0.5, 10 - Math.min(6, Math.abs(s.y) * 0.3), 1.5, hex("#08060c"), 0.5);
  drawFigure(p, s.q, s.x, s.y, { face: -1, tint, k: 0.38 });
}
/** Fading copies of a rival's whole body over the last instants (his after-images on a rush). */
export function rivalGhosts(p, R, t, tint = RIVAL, n = 4) {
  for (let i = n; i >= 1; i--) {
    const s = R(t - i * 0.03);
    drawFigure(p, s.q, s.x, s.y, { face: -1, solid: mix(tint, WHITE, 0.4), a: 0.35 * (1 - i / (n + 1)) });
  }
}

/** The smear behind a fist or foot: where the joint was over the last few hundredths, as a tapering bright band. */
export function smear(p, at, t, { n = 6, dt = 0.016, w = 4, c = WHITE, c2 = hex("#ffe8a0"), a = 1 } = {}) {
  let prev = at(t);
  for (let i = 1; i <= n; i++) {
    const q = at(t - i * dt), u = i / (n + 1);
    if (Math.hypot(q[0] - prev[0], q[1] - prev[1]) > 0.6) p.beam(prev[0], prev[1], q[0], q[1], Math.max(1, w * (1 - u)), i < 3 ? c : c2, a * (1 - u));
    prev = q;
  }
}

/** A hit spark at (x, y), age seconds old: a white star with long spikes, a ring, flecks; big for the heavy ones. */
export function hitSpark(p, x, y, age, { big = false, dir = 1, c = hex("#ffd040") } = {}) {
  const life = big ? 0.26 : 0.18;
  if (age < 0 || age > life) return;
  const u = age / life, R = (big ? 22 : 12) * ease.outCubic(Math.min(1, u * 2.5));
  p.glow(x, y, R * 2.4, c, 0.8 * (1 - u));
  if (u < 0.5) {
    const n = big ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(i, 3) * 0.4, L = R * (i % 2 ? 0.6 : 1.2) * (1 - u);
      p.beam(x, y, x + Math.cos(a) * L + dir * 2, y + Math.sin(a) * L, i % 2 ? 1.5 : 2.5, i % 2 ? c : WHITE);
    }
    p.circle(x, y, R * 0.3 * (1 - u), WHITE);
  }
  p.ring(x, y, R, 1, u < 0.4 ? WHITE : c, 1 - u);
  for (let i = 0; i < 5; i++) {
    const a = dir > 0 ? -1 + rand(i, 7) * 2 : Math.PI - 1 + rand(i, 7) * 2, d = R * (0.6 + u * 1.5);
    p.px(x + Math.cos(a) * d, y + Math.sin(a) * d, u < 0.5 ? WHITE : c);
  }
}
/** A block: a flat flash of force against the guard, a ring squashed across the blow, sparks fanning off it. */
export function blockSpark(p, x, y, age, { dir = 1, c = hex("#8fd6ff") } = {}) {
  if (age < 0 || age > 0.2) return;
  const u = age / 0.2;
  p.glow(x, y, 20, c, 0.6 * (1 - u));
  p.ellipse(x, y, 3 + 4 * u, 10 + 8 * u, (d) => (d > 0.7 ? WHITE : 0), 1 - u);
  for (let i = 0; i < 6; i++) {
    const a = (dir > 0 ? Math.PI : 0) + (rand(i, 9) - 0.5) * 2, d = 4 + u * 18;
    p.line(x + Math.cos(a) * d * 0.4, y + Math.sin(a) * d * 0.4, x + Math.cos(a) * d, y + Math.sin(a) * d, i % 2 ? WHITE : c, 1 - u);
  }
}
/** A clash of two blows: a ring of air blown out round the contact, dust thrown off the floor. */
export function clashRing(p, x, y, age) {
  if (age < 0 || age > 0.5) return;
  const u = age / 0.5;
  p.ellipse(x, y, 6 + 50 * ease.outCubic(u), 4 + 30 * ease.outCubic(u), (d) => (d > 0.85 ? WHITE : 0), 1 - u);
  p.ellipse(x, 0, 8 + 70 * ease.outCubic(u), 2 + 4 * u, (d) => (d > 0.8 ? hex("#c9bfb8") : 0), 0.8 * (1 - u));
}
/** Speed lines streaking across the frame (a rush): k how strong, dir which way they run. */
export function speedLines(p, x0, y0, x1, y1, t, k, dir = -1) {
  if (k <= 0) return;
  for (let i = 0; i < 18; i++) {
    const y = y0 + rand(i, 1) * (y1 - y0), L = 20 + rand(i, 2) * 40, sp = 300 + rand(i, 3) * 300, span = x1 - x0 + L, x = x0 + (((rand(i, 4) * span + dir * t * sp) % span) + span) % span - L;
    p.line(x, y, x + L, y, i % 3 ? hex("#e8e4f0") : WHITE, k * (0.3 + 0.4 * rand(i, 5)));
  }
}
