// ULTIMATE: Bijuudama Rasenshuriken (Tailed Beast Rasenshuriken, Naruto with Kurama). Narutopedia: Naruto in Kurama's
// chakra mode combines a Tailed Beast Ball with his Wind Release: Rasenshuriken: the black-violet ball of positive and
// negative chakra sits at the centre, ringed by the shrieking wind blades of the Rasenshuriken; on impact it swells into
// a sphere of countless microscopic wind blades shredding everything inside, the dark core detonating in its heart.
// Here: Naruto's cloak flares, Kurama's full avatar grows out of him and braces; light and dark chakra pour into a ball
// in its jaws while a white disc of churning wind opens round it and four great blades spin up out of the disc, howling;
// the head drops onto the target, the beast is kicked back by the throw, the shuriken streaks in, and it bursts into a
// huge white dome of wind blades crossing in every direction round a black-violet core, then collapses inward.
// The fox (lean, on all fours, nine tails up, the Nine-Tails chakra mode markings) is the one from the Tailed Beast
// Ball, kept here unchanged. New: the shuriken (core, wind disc, four blades), the blade dome; one spiral impact frame.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU, posed } from "../../core/index.js";
import { play, bodyAt, drawFigure, drawOutline, impactFrame, blast } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, ultStreaks, frameOf } from "./_ultimate.js";

const MODE = 0.75, FOX = MODE + 0.3, FOXED = FOX + 0.55, GATHER = FOXED, BALL = GATHER + 1.3, FIRE = BALL + 0.15, FLY = 0.26, HIT = FIRE + FLY, TX = 214, END = HIT + 3.6;
const WIND = ["#1a3a5a", "#5aa0d0", "#a8e0ff", "#e8faff", "#ffffff"].map(hex);
const GOLD = ["#5a2a06", "#c86a10", "#ff9a1c", "#ffc830", "#fff0a0"];
const FC = { rim: hex("#e8400e"), rim2: hex("#ff7a1c"), body: hex("#ffe070"), shade: hex("#ffc040"), far: hex("#f0a030"), lite: hex("#fff8c8"), ink: hex("#2a0a04") };
// the tailed beast bomb: near black, shot through with violet, a lilac rim; it goes off in a black-violet dome
const BALLC = ["#030106", "#0e0418", "#24093e", "#4a1a78", "#b07aff"].map(hex);
const BOOM = ["#030108", "#10041e", "#260a44", "#48167a", "#7a34c0", "#c890ff", "#f6ecff"].map(hex);
const DOME = ["#040108", "#12041f", "#2a0a4a", "#5a1e9a", "#efe0ff"].map(hex);
// the fox's neck pivot and its open mouth (where the ball sits), in its own space before the head turns
const NECK = [34, -66], MOUTH = [95, -73], AIMT = [TX - 10, -24];
// the whole avatar, standing on all fours round Naruto (he stands in its chest)
const HO = [0, 0];
const turnAbout = (x, y, a, c = NECK) => [c[0] + (x - c[0]) * Math.cos(a) - (y - c[1]) * Math.sin(a), c[1] + (x - c[0]) * Math.sin(a) + (y - c[1]) * Math.cos(a)];
// the tilt that drops the jaws onto the line to the target
const AIM = (() => {
  let a = 0;
  for (let i = 0; i < 8; i++) {
    const [mx, my] = turnAbout(MOUTH[0], MOUTH[1], a);
    a += Math.atan2(AIMT[1] - HO[1] - my, AIMT[0] - HO[0] - mx) - Math.atan2(MOUTH[1] - NECK[1], MOUTH[0] - NECK[0]) - a;
  }
  return a;
})();
const tiltAt = (t) => {
  if (t < GATHER) return -0.1;
  if (t < BALL) return -0.1 - 0.12 * smooth(GATHER, GATHER + 0.4, t) + (AIM + 0.22) * ease.inOutCubic(smooth(BALL - 0.45, BALL, t));
  if (t < FIRE) return AIM;
  const r = t - FIRE;
  return AIM - 0.25 * Math.exp(-r * 8) * Math.sin(Math.min(Math.PI, r * 12));
};
// the whole beast: grows out of him, crouches as it gathers, kicked back by the shot
const growAt = (t) => 1.15 * ease.outBack(clamp((t - FOX) / (FOXED - FOX)), 1.3);
const kickAt = (t) => (t < FIRE ? 0 : -9 * Math.exp(-(t - FIRE) * 6) * Math.sin(Math.min(Math.PI, (t - FIRE) * 18)) - 3 * smooth(FIRE, FIRE + 0.1, t) * (1 - smooth(FIRE + 0.3, FIRE + 0.8, t)));
const mouthAt = (t) => {
  const g = growAt(t), [mx, my] = turnAbout(MOUTH[0], MOUTH[1], tiltAt(t));
  return [(mx + HO[0]) * g + kickAt(t), (my + HO[1]) * g];
};

export const meta = {
  name: "Tailed beast rasenshuriken",
  desc: "ULTIMATE. Naruto with Kurama: the chakra fox grows out of him, a black-violet tailed beast ball forms in its jaws ringed by the howling blades of a Rasenshuriken; thrown, it bursts into a vast dome of wind blades round a dark core.",
  tags: ["jutsu", "ultimate", "naruto", "kurama", "bijuu", "wind", "projectile", "aoe", "one-shot"],
  size: [430, 280],
  origin: [104, 226],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: GOLD, seed: 27 },
};

const BRACE = { ...READY, crouch: 6, lean: -2, fx: 12, fy: -18, bx: -4, by: -20, ffx: 9, fbx: -9 };
const ROAR = { ...READY, crouch: 8, lean: 8, fx: 14, fy: -26, bx: 13, by: -28, armsFront: true, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  ghost: "#ffc830",
  poses: [
    [-0.25, READY],
    [0.05, { ...READY, crouch: 6, fx: 6, fy: -16, bx: 4, by: -16 }, "out"],
    [MODE, BRACE, "snap"],
    [GATHER, { ...BRACE, crouch: 7 }],
    [BALL, ROAR, "out"],
    [FIRE, { ...ROAR, lean: 2, crouch: 10 }, "snap"],
    [HIT + 0.6, { ...BRACE, crouch: 5 }],
    [END, READY],
  ],
  hits: [
    { t: MODE, stop: 0.08, shake: 0.2, amp: 2, target: false },
    { t: FOXED - 0.2, stop: 0.06, shake: 0.3, amp: 2, target: false },
    { t: FIRE, stop: 0.07, shake: 0.25, amp: 2, target: false, sfx: "cast" },
    { t: HIT, stop: 0.3, shake: 1.0, amp: 7, push: 2, straw: 30, skin: "shadow", sfx: "explosion" },
    ...[0.25, 0.45, 0.65, 0.85, 1.05, 1.25].map((d) => ({ t: HIT + d, stop: 0.02, shake: 0.4, amp: 2, flash: 0, push: 1, straw: 10, shiver: 0.8, sfx: d === 0.65 ? "whoosh" : undefined })),
    { t: HIT + 1.4, stop: 0.12, shake: 0.8, amp: 5, push: 8, straw: 40, sfx: "explosion" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: MODE, x: 0, n: 10 }, { t: FOXED - 0.2, x: 40, n: 16 }, { t: FIRE, x: 40, n: 12, dir: -1 }, { t: HIT + 0.05, x: TX - 40, n: 20, dir: -1 }, { t: HIT + 0.05, x: TX + 40, n: 20, dir: 1 }],
};

// ---- the fox, in its own space (feet on y = 0, facing right): part id at (x, y) or 0; far legs return 2, head 3
// the head is big (a third over the body's scale) and sits low, right on the chest: the back of the skull at (44, -80)
const HS = 1.45;
const headSpace = (x, y, tilt) => {
  const [hx, hy] = turnAbout(x, y, -tilt);
  return [48 + (hx - 44) / HS, -96 + (hy + 80) / HS, hx, hy];
};
const capsule = (x, y, ax, ay, bx, by, ra, rb) => {
  const dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)), qx = x - ax - dx * u, qy = y - ay - dy * u;
  return qx * qx + qy * qy < (ra + (rb - ra) * u) ** 2;
};
function foxPart(x, y, tilt, j) {
  // the head and neck turn about the base of the neck
  const [hx, hy, nx, ny] = headSpace(x, y, tilt);
  // the head: a skull, ears laid back, a long muzzle; the jaw drops open by j
  if (((hx - 60) / 17) ** 2 + ((hy + 98) / 14) ** 2 < 1) return 3;
  if (capsule(hx, hy, 46, -108, 30, -128, 6, 1) || capsule(hx, hy, 56, -110, 44, -132, 6, 1)) return 3;
  if (hx > 62 && hx < 92 && hy < -96 + (hx - 62) * 0.05 && hy > -108 + (hx - 62) * 0.12) return 3;
  const jy = -94 + j * (hx - 62) * 0.55;
  if (hx > 58 && hx < 88 && hy > jy && hy < jy + 7 - (hx - 58) * 0.1) return 3;
  // a short, thick neck: the head sits almost on the shoulders
  if (capsule(nx, ny, 30, -60, 50, -78, 19, 16)) return 1;
  // the body: a massive chest and hunched shoulders, the waist drawn in, a strong haunch, low on its legs
  if (((x - 22) / 25) ** 2 + ((y + 54) / 23) ** 2 < 1) return 1;
  if (((x - 14) / 18) ** 2 + ((y + 70) / 10) ** 2 < 1) return 1;
  if (capsule(x, y, 18, -56, -34, -46, 18, 13)) return 1;
  if (((x + 38) / 17) ** 2 + ((y + 36) / 17) ** 2 < 1) return 1;
  // the near legs: a heavy front leg planted, a hind leg folded under
  if (capsule(x, y, 28, -48, 33, -22, 11.5, 8) || capsule(x, y, 33, -22, 37, -3, 8, 6.5) || (((x - 41) / 10) ** 2 + ((y + 2) / 3.5) ** 2 < 1)) return 1;
  if (capsule(x, y, -40, -28, -28, -16, 10, 7) || capsule(x, y, -28, -16, -34, -3, 6.5, 5) || (((x + 30) / 8) ** 2 + ((y + 2) / 2.8) ** 2 < 1)) return 1;
  // the far legs, a step behind
  if (capsule(x, y, 14, -46, 18, -22, 9.5, 6.5) || capsule(x, y, 18, -22, 20, -3, 6.5, 5.5) || (((x - 24) / 8) ** 2 + ((y + 2) / 3) ** 2 < 1)) return 2;
  if (capsule(x, y, -50, -28, -48, -3, 7.5, 5)) return 2;
  return 0;
}

// the Rasenshuriken round the ball: a white disc of churning wind (seen edge-on a little, so an ellipse) and four
// great blades spinning out of it; s grows it 0..1
function drawShuriken(p, x, y, s, t) {
  if (s <= 0.02) return;
  const R = 26 * s, spin = t * 22;
  p.glow(x, y, R * 2.4, WIND[2], 0.45 * s);
  // the four blades: long curved white wedges, swept back against the spin
  for (let i = 0; i < 4; i++) {
    const a = spin + i * (Math.PI / 2), L = R * 2.1;
    const tip = [x + Math.cos(a) * L, y + Math.sin(a) * L * 0.55], b0 = [x + Math.cos(a - 0.5) * R * 0.6, y + Math.sin(a - 0.5) * R * 0.6 * 0.55], b1 = [x + Math.cos(a + 0.35) * R * 0.75, y + Math.sin(a + 0.35) * R * 0.75 * 0.55];
    const mid = [x + Math.cos(a - 0.25) * L * 0.7, y + Math.sin(a - 0.25) * L * 0.7 * 0.55];
    p.poly([b0, mid, tip, b1], WIND[3], 0.9);
    p.line(b1[0], b1[1], tip[0], tip[1], WHITE);
    p.line(b0[0], b0[1], mid[0], mid[1], WIND[1], 0.8);
  }
  // the disc: rings of wind racing round
  p.shade(x - R - 2, y - R * 0.6 - 2, x + R + 2, y + R * 0.6 + 2, (px, py, out) => {
    const dx = (px - x) / R, dy = (py - y) / (R * 0.55), d = Math.hypot(dx, dy);
    if (d > 1) return;
    const ang = Math.atan2(dy, dx), streak = Math.sin(ang * 6 - spin * 2 + d * 9);
    out.a = 0.8;
    return streak > 0.6 ? WHITE : streak > 0 ? WIND[3] : WIND[2];
  });
}

// the ball: dark and mottled, glowing red through its cracks
function drawBall(p, x, y, r, t, wob = 0) {
  if (r <= 0.5) return;
  p.glow(x, y, r * 4, BALLC[4], 0.55);
  p.shade(x - r - 2, y - r - 2, x + r + 2, y + r + 2, (px, py, out) => {
    const dx = (px - x) / (r + wob), dy = (py - y) / (r - wob), d = Math.hypot(dx, dy);
    if (d > 1) return;
    if (d > 0.88) {
      out.k = 0.3;
      return BALLC[4];
    }
    const n = noise2(dx * 3 + t * 1.5, dy * 3 - t, 5), crack = Math.abs(noise2(dx * 5 - t, dy * 5 + t * 2, 9)) < 0.07;
    if (crack) {
      out.k = 0.4;
      return BALLC[4];
    }
    const lit = n * 0.6 + (-dx - dy) * 0.25;
    return lit > 0.35 ? BALLC[3] : lit > 0 ? BALLC[2] : lit > -0.3 ? BALLC[1] : BALLC[0];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let fired = false, boomed = false;
  const ballR = (t) => (t < GATHER ? 0 : 3 + 9 * ease.outCubic(clamp((t - GATHER) / (BALL - GATHER - 0.3))));
  const shurS = (t) => ease.outBack(smooth(GATHER + 0.5, BALL, t), 1.6);
  const box = frameOf(meta);
  const ballPos = (t) => {
    if (t < FIRE) return mouthAt(t);
    const m = mouthAt(FIRE), u = ease.inQuad(clamp((t - FIRE) / FLY));
    return [m[0] + (AIMT[0] - m[0]) * u, m[1] + (AIMT[1] - m[1]) * u];
  };
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the cloak burns: flames licking up off random points of the body
      if (t > MODE && t < FOX && R.chance(80 * dt)) {
        const r = posed(b.q), i = R.int(0, r.n - 1);
        ps.spawn(P.FIRE, (b.q.x ?? 0) + r.xs[i], r.ys[i], R.range(-8, 8), -R.range(20, 50), R.range(0.12, 0.25), 0, R.range(1, 1.8));
      }
      // light and dark chakra drawn into the ball, about eight dark to two light
      if (t > GATHER && t < BALL) {
        for (let n = 0; n < 3; n++) if (R.chance(70 * dt)) {
          const a = R.range(0, TAU), d = R.range(40, 80), T = R.range(0.2, 0.35), v = (d * 3) / (Math.exp(3 * T) - 1), m = mouthAt(t);
          ps.spawn(P.STREAK, m[0] + Math.cos(a) * d, m[1] + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.8) ? DOME[3] : WHITE);
        }
      }
      if (!fired && t >= FIRE) {
        fired = true;
        const m = mouthAt(t);
        lights.add(m[0], m[1], 120, BALLC[4], 1, 0.25);
      }
      if (!boomed && t >= HIT) {
        boomed = true;
        lights.add(TX, -30, 240, BOOM[5], 1, 0.9);
        for (let i = 0; i < 40; i++) {
          const a = R.range(-Math.PI, 0), s = R.range(120, 380);
          ps.spawn(P.STREAK, TX, -20, Math.cos(a) * s, Math.sin(a) * s, R.range(0.15, 0.4), R.chance(0.5) ? BOOM[6] : BOOM[5]);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: MODE - 0.2, t1: END - 0.3, tone: "#0c0608", glow: "#3a1c0c" });
      const b = bodyAt(act.poses, t);
      // the fox: grows out of him, translucent for its first instant, then solid chakra with a burning rim
      if (t > FOX && t < HIT + 1.1) {
        const g = growAt(t), k = smooth(FOX, FOX + 0.15, t) * (1 - smooth(HIT + 0.5, HIT + 1.1, t)), kx = kickAt(t), tl = tiltAt(t), f = Math.floor(t * 20);
        const j = smooth(GATHER, BALL - 0.3, t) * (1 - 0.5 * smooth(FIRE + 0.2, HIT + 0.4, t));
        const L = (x, y) => [(x - kx) / g - HO[0], y / g - HO[1]];
        for (let i = 0; i < 9; i++) {
          const a0 = -2.15 - i * 0.17, L0 = (56 + (i % 3) * 10) * g, bx = -46 * g + kx, by = -40 * g;
          for (const [pad, col] of [[2, FC.rim], [1, FC.rim2], [0, FC.body]]) {
            for (let s = 0; s <= 12; s++) {
              const u = s / 12, aa = a0 + (0.5 + 0.08 * Math.sin(t * 3 + i)) * u * 0.7 + Math.sin(t * 5 + i + u * 4) * 0.08 * u;
              const x = bx + Math.cos(aa) * L0 * u, y = by + Math.sin(aa) * L0 * u, w = (3 + 6 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * (1 - 0.35 * u) * g;
              p.circle(x, y, w + pad, col, k);
            }
          }
        }
        p.glow(10 * g, -60 * g, 100 * g, hex(GOLD[2]), 0.4 * k);
        p.shade(-110, -170, 130, 1, (x, y, out) => {
          const [lx, ly] = L(x, y), part = foxPart(lx, ly, tl, j);
          if (!part) {
            // flames licking up off its outline
            const lick = 2 + 6 * noise2(x * 0.2, y * 0.1 + t * 8, 3);
            const [ux, uy] = L(x, y + lick);
            if (y < -1 && foxPart(ux, uy, tl, j) && noise2(x * 0.35, y * 0.25 + t * 10, 7) > 0.05) {
              out.a = k * 0.9;
              out.k = 0.3;
              return noise2(x * 0.3, y * 0.5 + t * 12, 2) > 0.5 ? FC.rim2 : FC.rim;
            }
            return;
          }
          out.a = k;
          const e = 1.6 / g, edge = foxPart(lx - e, ly, tl, j) !== part || foxPart(lx + e, ly, tl, j) !== part || foxPart(lx, ly - e, tl, j) !== part || foxPart(lx, ly + e, tl, j) !== part;
          if (edge) {
            out.k = 0.3;
            return FC.rim;
          }
          const [hx, hy] = headSpace(lx, ly, tl);
          if (part === 3) {
            // the slit eye with its long black stripe sweeping back toward the ear
            if (Math.abs(hx - 64) < 5 && Math.abs(hy + 103 + (hx - 64) * 0.2) < 1.3) return hex("#fff6d0");
            if (capsule(hx, hy, 68, -103.5, 42, -112, 1.6, 1)) return FC.ink;
            // the bars across the top of the muzzle, the whisker strokes
            for (const bx of [72, 78, 84]) if (Math.abs(hx - bx) < 1 && hy < -104 + (hx - 62) * 0.12 + 4.5 && hy > -108 + (hx - 62) * 0.12) return FC.ink;
            if (capsule(hx, hy, 66, -98, 74, -97, 0.7, 0.5) || capsule(hx, hy, 66, -96, 73, -94, 0.7, 0.5)) return FC.ink;
            // the inside of the open mouth, a row of teeth along each jaw
            if (hx > 60 && hx < 90 && hy > -96 + (hx - 62) * 0.05 && hy < -94 + j * (hx - 62) * 0.55) {
              if (j > 0.3 && (Math.floor(hx) % 3 === 0) && (hy < -95 + (hx - 62) * 0.05 || hy > -95 + j * (hx - 62) * 0.55)) return WHITE;
              return hex("#2a0618");
            }
          }
          if (part === 1) {
            // the bands round the neck
            const [, , nnx, nny] = headSpace(lx, ly, tl), nu = ((nnx - 30) * 20 + (nny + 60) * -18) / (20 * 20 + 18 * 18);
            if (capsule(nnx, nny, 30, -60, 50, -78, 19, 16) && nu > 0.1 && nu < 0.9 && (Math.abs(nu - 0.3) < 0.07 || Math.abs(nu - 0.62) < 0.07)) return FC.ink;
          }
          if (part === 1 || part === 2) {
            // the seal on the shoulder: a black ring, a burning gap, a black core
            const sd = Math.hypot(lx - 8, ly + 50);
            if (part === 1 && sd < 10) return sd > 7.2 ? FC.ink : sd > 4 ? FC.body : FC.ink;
            // a black stripe running down the back just inside its outline, and down the front of each leg
            if (ly < -40 && !foxPart(lx, ly - 3.2, tl, j) && foxPart(lx, ly - 1.2, tl, j)) return FC.ink;
            if (ly > -40 && ly < -6 && !foxPart(lx + 2.6, ly, tl, j) && foxPart(lx + 1, ly, tl, j)) return FC.ink;
          }
          if (part === 2) return FC.far;
          // lit from above: bright along its back and head, warmer underneath, chakra flickering through
          const under = part === 3 ? 0 : clamp((ly + 70) / 60) - 0.15 * noise2(lx * 0.1, ly * 0.1 - t * 3, 4);
          if (rand(Math.floor(lx / 2), Math.floor((ly + t * 30) / 3)) > 0.94) return FC.lite;
          return under > 0.72 ? FC.shade : FC.body;
        });
        if (f < 0) p.px(0, 0, 0);
      }
      // the cloak's flaring edge, behind the body
      if (t > MODE) {
        const k = smooth(MODE, MODE + 0.1, t);
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, hex(GOLD[3]), { w: 1, a: k, flick: t * 18 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, hex(GOLD[2]), { w: 2, a: 0.6 * k, flick: t * 13 + 3 });
      }
      blast(p, t - HIT - 1.4, { x: TX, y: 0, R: 50, C: BOOM, seed: 11, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "BIJUUDAMA RASENSHURIKEN", hold: 1.1, color: "#ffb030" });
      drawBadge(p, t, { kind: "kurama", t0: 0.1, t1: MODE, label: "KURAMA", head: b.head });
      if (t > MODE) {
        const flare = t - MODE < 0.08;
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: flare ? WHITE : hex(GOLD[3]), k: flare ? 0.9 : 0.62 });
        const [nx, ny] = [b.chest[0], b.chest[1] - 5];
        for (let i = 0; i < 6; i++) {
          const a = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7;
          p.px(nx + Math.cos(a) * 4, ny + Math.sin(a) * 2.5, DOME[0]);
        }
        p.ring(b.chest[0], b.chest[1] + 7, 2, 1, DOME[0]);
      }
      drawGlint(p, t, "kurama", MODE + 0.05, END - 0.6, b.head);
      // the ball, then the shot: a streak with pressure rings peeling off behind it
      const r = ballR(t);
      if (r > 0 && t < HIT) {
        const [x, y] = ballPos(t);
        if (t < FIRE) for (let i = 0; i < 3; i++) p.ring(x, y, r + 5 + ((t * 30 + i * 5) % 15), 1, i ? BALLC[3] : BALLC[4], 0.6);
        if (t >= FIRE) {
          const m = mouthAt(FIRE), dx = AIMT[0] - m[0], dy = AIMT[1] - m[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
          p.glowLine(m[0], m[1], x, y, 18, BALLC[4], 0.8);
          p.beam(m[0] + ux * 8, m[1] + uy * 8, x, y, 6, BALLC[4]);
          p.beam(m[0] + ux * 8, m[1] + uy * 8, x, y, 2.5, WHITE);
          // pressure rings: thin ellipses standing across the line, left behind as it passes
          for (let i = 0; i < 4; i++) {
            const s = clamp((t - FIRE) / FLY - i * 0.2);
            if (s <= 0) continue;
            const cx = m[0] + dx * (i * 0.2 + 0.1), cy = m[1] + dy * (i * 0.2 + 0.1), age = (t - FIRE) - i * 0.2 * FLY;
            p.ellipse(cx, cy, 3 + age * 20, 10 + age * 90, (d) => (d > 0.8 ? WHITE : 0), Math.max(0, 1 - age * 2.5));
          }
        }
        drawShuriken(p, x, y, shurS(t), t);
        drawBall(p, x, y, r, t, t < FIRE ? Math.sin(t * 40) * 0.7 : 0);
      }
      // the flash of the shot
      if (t >= FIRE && t < FIRE + 0.05) p.circle(...mouthAt(FIRE), 30, WHITE);
      if (t > FIRE && t < HIT + 0.1) ultStreaks(p, t, box, 0.8, 1, WIND[3]);
      // the burst: a dome of wind blades crossing in every direction round the black-violet core, swelling, roaring,
      // then collapsing inward into one last detonation
      const age = t - HIT;
      if (age >= 0 && age < 1.9) {
        const grow = ease.outCubic(clamp(age / 0.35)), coll = ease.inCubic(clamp((age - 1.25) / 0.2)), DR = 100 * grow * (1 - 0.85 * coll), fade = 1 - smooth(1.45, 1.9, age);
        if (DR > 1 && fade > 0) {
          p.shade(TX - DR, -DR * 1.05, TX + DR, 1, (x, y, out) => {
            const dx = (x - TX) / DR, dy = (y + DR * 0.05) / DR, d = Math.hypot(dx, dy);
            if (d > 1) return;
            out.a = fade * (0.3 + 0.35 * d);
            // the blades: thin straight streaks at many angles through the dome
            const n1 = Math.abs(Math.sin((dx * 0.7 + dy) * 40 + age * 30)), n2 = Math.abs(Math.sin((dx - dy * 0.6) * 46 - age * 26)), n3 = Math.abs(Math.sin((dx * 1.3 - dy * 0.2) * 52 + age * 34));
            if (n1 > 0.93 || n2 > 0.93 || n3 > 0.95) { out.a = fade; return n1 > 0.975 || n2 > 0.975 ? WHITE : WIND[3]; }
            if (d > 0.93) return WIND[4];
            const core = d < 0.32 + 0.05 * Math.sin(age * 30);
            if (core) return d < 0.2 ? BALLC[0] : BALLC[3];
            return d > 0.8 ? WIND[2] : noise2(dx * 4 + age * 3, dy * 4, 17) > 0.2 ? WIND[1] : WIND[0];
          });
          p.glow(TX, -DR * 0.3, DR * 1.5, WIND[2], 0.5 * fade);
        }
        // the one impact frame: the instant it bursts
        if (age < 0.06) impactFrame(p, -104, -226, 326, 54, TX, -20, false, 31, { style: "spiral", ink: hex("#04101e"), paper: hex("#e6f6ff"), lines: 40 });
      }
      // the last detonation of the core as the dome collapses
      blast(p, age - 1.4, { x: TX, y: 0, R: 50, C: BOOM, seed: 11 });
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
