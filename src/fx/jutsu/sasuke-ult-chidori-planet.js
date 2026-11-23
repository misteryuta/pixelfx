// ULTIMATE: Chidori: Planet Splitter (Sasuke, Rinnegan and Eternal Mangekyou, "The Last" era). The cutscene follows
// the camera language of the reference shot for shot (16.8 s): framings, cuts, angles, camera moves and the beats of
// the effects, all drawn in our own pixel style.
// Story: the foe comes flying in; Sasuke, crouched, draws his sword over the shoulder (close, low, the camera circling);
// the grip and the blade flashing; one cut sends the foe high; the ground's rocks lift off; he raises the sword; his
// eyes, the Sharingan and the Rinnegan, close; gravity wraps the foe in a dark sphere, the rocks swirl in and pack
// round it into a moon; dark; the stone moon looming against the sky, then from far above the clouds: tiny, high,
// glowing as it falls back burning; his face in the dusk, lightning crawling over it; the Chidori bursts in his hand,
// bolts everywhere; the burning moon fills the sky over him; he leaps; his profile rising, the Chidori crackling; a blue
// streak; the punch into the molten crust, a white burst (the one impact frame); the explosion inside, his arm through
// it; the moon seen whole, blue lightning veining it from within; it bursts; the blast drives the foe down to the planet
// seen from space, a streak and a flash on its face; white; the foe falls out of the storm and crashes.
import { Particles, P, Rng, fbm, clamp, smooth, ease, hex, mix, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, bolt, drawChidori, drawChunk, impactFrame, blast } from "./_lib.js";
import { drawGlint } from "./_badge.js";
import { cineCam, inserts, insertKeys, backdrop, eyeShot, speedLines, cutFlash } from "./_cinema.js";
import { shotOf, frameAt, drawShot } from "./_cine3d.js";
import { spriteOf, drawSprite } from "./_sprite.js";

// ---- Sasuke as the team drew him (assets/sprites/sasuke_side.png, 29 x 60) and their close-up of his eyes
// (sasuke_eyes.png, 100 x 46). The sprite is a cut-out puppet: the near arm turns about the shoulder for the sword and
// the Chidori; the rig figure stays hidden.
const SAS = () => spriteOf("sasuke_side"), EYEART = () => spriteOf("sasuke_eyes");
const AX = 14, AY = 60, ARM = { pivot: [4.5, 19], hand: [2.5, 37], mask: (x, y) => y >= 16 && y <= 39 && x <= (y < 20 ? 4 : 5), body: (x) => x >= 4 };
const lerpK = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i], u = (t - t0) / (t1 - t0), e = u * u * (3 - 2 * u); return a + (b - a) * e; }
  return keys[keys.length - 1][1];
};
// the arm (radians, negative swings it forward) and the sword's screen angle through the move
const ARMK = [[0, 0], [0.2, 0], [0.62, 2.6], [0.95, 2.2], [1.4, 2.2], [1.72, -1.0], [2.2, -0.7], [2.5, -0.7], [2.8, -2.9], [7.99, -2.9], [8.0, -0.8], [8.3, -0.9], [10.3, -0.9], [10.48, -2.4]];
const SAK = [[0.62, Math.PI + 0.1], [1.4, Math.PI - 0.1], [1.72, 0.35], [2.2, 0.7], [2.5, 0.7], [2.8, -1.55]];
const swordOn = (t) => t >= 0.62 && t < CHARGE;
const sasAt = (t) => {
  const b = bodyAt(act.poses, t), q = b.q;
  return { x: q.x ?? 0, y: q.y ?? 0, sy: 1 - (q.crouch ?? 0) * 0.012, rot: lerpK(ARMK, t), sa: lerpK(SAK, t) };
};
/** The hand (and head) on screen: the sprite point turned with the arm. */
function sasPoint(t, u, v, inArm = true) {
  const S = sasAt(t), du = u - ARM.pivot[0], dv = v - ARM.pivot[1], cs = Math.cos(S.rot), sn = Math.sin(S.rot);
  const pu = inArm ? ARM.pivot[0] + du * cs - dv * sn : u, pv = inArm ? ARM.pivot[1] + du * sn + dv * cs : v;
  return [S.x + (pu - AX), S.y + (pv - AY) * S.sy];
}
const sasHand = (t) => sasPoint(t, ARM.hand[0], ARM.hand[1]);
function drawSasuke(p, t, opts = {}) {
  const S = sasAt(t), img = SAS();
  if (!img) return false;
  // the sword behind the arm, then him
  if (swordOn(t) && !opts.noSword) {
    const [hx, hy] = sasHand(t), ux = Math.cos(S.sa), uy = Math.sin(S.sa), L = 34;
    p.beam(hx - ux * 5, hy - uy * 5, hx, hy, 2.5, INK);
    p.beam(hx, hy, hx + ux * L, hy + uy * L, 2, STEEL[1]);
    p.line(hx, hy - 1, hx + ux * L, hy + uy * L - 1, STEEL[2]);
  }
  drawSprite(p, img, S.x, S.y, { ax: AX, ay: AY, sy: S.sy, part: { ...ARM, rot: S.rot }, ...opts });
  return true;
}

// the 3D shots rendered in Blender (blender/cine_sasuke.py), pixelated: swirl, moon, horizon, sun, planet, earth
const MV = "sasuke-ult-chidori-planet", S3 = (name) => shotOf(MV, name);

// ---- timing (seconds, matched to the reference's cuts) ----
const DRAW0 = 0.2, GRIP0 = 1.4, HIT1 = 1.78, WIDE = 2.0, RAISE = 2.5, EYES = 3.0, SPH = 3.8, SWIRL = 4.05, DARK = 4.5,
  MOON = 5.0, HOR = 5.78, FACE = 7.25, CHARGE = 8.0, SUN = 9.22, LEAP = 10.48, STREAK = 11.1, PUNCH = 11.3, FIRE = 11.6,
  PLANET = 12.5, BLUE = 13.75, EARTH = 14.5, FALL = 15.65, CRASH = 16.2, END = 16.8;
const TX = 300, MEET = 70;
const BOX = [-120, -262, 376, 28], CX = 128, CY = -117;

const LIT = ["#0a1240", "#2a4ab8", "#6a9aff", "#bfe0ff", "#ffffff"].map(hex);
const ROCK = ["#1e1810", "#54452f", "#8a7a56", "#bcae86"].map(hex);
const DUSTC = ["#2a2018", "#5a4630", "#9a7a52", "#d8b884", "#fff0c8"].map(hex);
const CLOAK = ["#7e7768", "#b4ad9a", "#d6d0bf"].map(hex), SLEEVE = ["#141628", "#24284a", "#3a4070"].map(hex);
const SKIN = ["#b88a74", "#e6c2a8", "#f6dcc8"].map(hex), STEEL = ["#4a5068", "#a8b2c8", "#e8f0ff"].map(hex);
const INK = hex("#0a0a12");

export const meta = {
  name: "Chidori: Planet Splitter",
  desc: "ULTIMATE. Sasuke: one draw-cut sends the foe high; the Rinnegan's gravity packs the ground's rocks round it into a moon that rises over the clouds and falls back burning; he meets it with a Chidori, punches through its molten heart, and the blast drives the foe down to the planet.",
  tags: ["jutsu", "ultimate", "sasuke", "chidori", "lightning", "rinnegan", "gravity", "sword", "cutscene", "one-shot"],
  size: [496, 290],
  origin: [120, 262],
  duration: END,
  loop: false,
  fps: 20,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a1240", "#2a4ab8", "#6a9aff", "#bfe0ff", "#f4faff"], seed: 177 },
};

// ---- the body ----
const CROUCH = { crouch: 8, lean: 4, fx: 9, fy: -13, bx: -3, by: -15, ffx: 10, fbx: -9 };
const REACH = { crouch: 5, lean: 1, fx: -5, fy: -35, bx: 6, by: -18, ffx: 9, fbx: -9 };
const DRAWN = { crouch: 3, lean: -2, fx: -3, fy: -31, bx: 7, by: -20, ffx: 9, fbx: -9, weapon: "sword", sa: Math.PI };
const CHG = { crouch: 6, lean: 4, fx: 15, fy: -12, bx: -9, by: -22, ffx: 11, fbx: -10, weapon: null };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, CROUCH],
    [DRAW0, CROUCH],
    [0.62, REACH, "out"],
    [0.95, DRAWN, "out"],
    [GRIP0, { ...DRAWN, fx: -6, fy: -30, sa: 3.0, lean: -3 }],
    [HIT1 - 0.06, { ...DRAWN, x: 40, fx: 16, fy: -19, sa: 0.25, lean: 6, crouch: 5 }, "out"],
    [WIDE + 0.2, { ...DRAWN, x: 40, fx: 15, fy: -15, sa: 0.7, lean: 4, crouch: 4 }],
    [RAISE + 0.3, { ...DRAWN, x: 40, fx: 3, fy: -44, sa: -1.55, lean: -3, crouch: 1, bx: 8, by: -24 }, "out"],
    [EYES, { ...DRAWN, x: 40, fx: 3, fy: -45, sa: -1.6, lean: -3, crouch: 1, bx: 8, by: -24 }],
    [CHARGE - 0.01, { ...DRAWN, x: 40, fx: 3, fy: -45, sa: -1.6, lean: -3, crouch: 1, bx: 8, by: -24 }],
    [CHARGE, { ...CHG, x: 40 }, "snap"],
    [CHARGE + 0.4, { ...CHG, x: 40, fx: 17, fy: -10, crouch: 8, lean: 6 }, "out"],
    [SUN, { ...CHG, x: 40, fx: 17, fy: -10, crouch: 8, lean: 6 }],
    [LEAP, { ...CHG, x: 40, y: -40, gait: false, fx: 12, fy: -40, crouch: 0, lean: 2 }],
  ],
  hits: [
    { t: DRAW0, target: false, sfx: "whoosh" },
    { t: 0.95, target: false, sfx: "parry" },
    { t: GRIP0 + 0.17, target: false, sfx: "whoosh" },
    { t: HIT1, stop: 0.08, shake: 0.25, amp: 3, push: 0, straw: 30, flash: 1, sfx: "heavy" },
    { t: WIDE, target: false, sfx: "rumble" },
    { t: RAISE, target: false, sfx: "whoosh" },
    { t: EYES + 0.05, target: false, sfx: "cast" },
    { t: SPH, target: false, sfx: "rumble" },
    { t: SWIRL, target: false, sfx: "whoosh" },
    { t: MOON, target: false, sfx: "rumble" },
    { t: HOR + 0.6, target: false, sfx: "cast" },
    { t: FACE + 0.2, target: false, sfx: "thunder" },
    { t: CHARGE, target: false, sfx: "thunder" },
    { t: CHARGE + 0.55, target: false, sfx: "thunder" },
    { t: CHARGE + 1.0, target: false, sfx: "thunder" },
    { t: SUN, target: false, sfx: "rumble" },
    { t: LEAP, target: false, sfx: "whoosh" },
    { t: STREAK, target: false, sfx: "whoosh" },
    { t: PUNCH, target: false, stop: 0.1, shake: 0.3, amp: 3, sfx: "explosion" },
    { t: FIRE, target: false, sfx: "explosion" },
    { t: PLANET + 0.2, target: false, sfx: "rumble" },
    { t: BLUE, target: false, shake: 0.25, amp: 3, sfx: "explosion" },
    { t: EARTH + 0.3, target: false, sfx: "whoosh" },
    { t: FALL, target: false, sfx: "thunder" },
    { t: CRASH, stop: 0.08, shake: 0.35, amp: 4, push: 0, straw: 40, flash: 1, sfx: "explosion" },
    { t: END - 0.25, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: DRAW0, x: 0, n: 8, dir: -1 }, { t: HIT1 - 0.1, x: 40, n: 12, dir: 1 }, { t: CHARGE, x: 40, n: 16, dir: -1 }, { t: CRASH, x: TX - 20, n: 24, dir: -1 }, { t: CRASH, x: TX + 20, n: 24, dir: 1 }],
};
// he leaps into the sky and is not seen on the ground again
export const actorAlpha = (t) => (SAS() ? 0 : t > LEAP + 0.08 ? 0 : 1);

// the foe: flying in, cut high into the sky, gone (inside the moon), then falling out of the storm and crashing
const fallDy = (t) => -300 * (1 - clamp((t - FALL) / (CRASH - FALL))) ** 2;
const TS = 1.5;
export const targetState = (t) => {
  const st = targetRaw(t);
  return st && SAS() ? { s: TS, ...st, dy: (st.dy ?? 0) - (TS - 1) * 26 + (t >= CRASH ? 10 : 0) } : st;
};
const targetRaw = (t) => {
  if (t < HIT1) { const u = ease.inQuad(clamp(t / HIT1)); return { dx: (MEET - TX) * u, dy: -62 + 50 * u, rot: -0.4 - 0.5 * u }; }
  if (t < 2.75) { const u = clamp((t - HIT1) / (2.75 - HIT1)); return { dx: MEET - TX + 70 * u, dy: -12 - 330 * ease.outCubic(u), rot: -0.9 - 7 * u, tint: [LIT[3], 0.4 * (1 - u)] }; }
  if (t < FALL) return { a: 0 };
  if (t < CRASH) return { dy: fallDy(t), rot: 2 + (t - FALL) * 9, tint: [LIT[3], 0.35] };
  return { dx: 6, dy: 19, rot: 1.57 };
};

// ---- small painters ----
/** Draw fn() only where test(screenX, screenY) holds. */
function clip(p, test, fn) {
  const put = p.put, bl = p.blendPx, add = p.add;
  p.put = function (x, y, c, a) { if (test(x, y)) put.call(this, x, y, c, a); };
  p.blendPx = function (x, y, c, a) { if (test(x, y)) bl.call(this, x, y, c, a); };
  p.add = function (x, y, c, k) { if (test(x, y)) add.call(this, x, y, c, k); };
  try { fn(); } finally { delete p.put; delete p.blendPx; delete p.add; }
}
/** Cells (a jittered grid): e is how close (u, v) lies to a border (0 on it), id names the cell. */
function cells(u, v, seed) {
  const iu = Math.floor(u), iv = Math.floor(v);
  let d1 = 9, d2 = 9, id = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const gx = iu + i, gy = iv + j, h = gx * 131 + gy * 977, px = gx + rand(h, seed), py = gy + rand(h, seed + 1), d = Math.hypot(u - px, v - py);
      if (d < d1) { d2 = d1; d1 = d; id = h; } else if (d < d2) d2 = d;
    }
  return { e: d2 - d1, id };
}
const inBox = (x0, y0, x1, y1) => [Math.max(BOX[0], x0), Math.max(BOX[1], y0), Math.min(BOX[2], x1), Math.min(BOX[3], y1)];
/**
 * A ball of packed rock, lit from the upper left: kind "stone" (grey plates), "heat" (stone turning to glowing ember by
 * heat), "sun" (a burning surface with dark glowing cracks), "lava" (a dark crust split by molten cracks).
 */
function ball(p, cx, cy, R, t, kind, { heat = 0, seed = 3, sc = 5 } = {}) {
  const [x0, y0, x1, y1] = inBox(cx - R - 1, cy - R - 1, cx + R + 1, cy + R + 1);
  if (x1 <= x0 || y1 <= y0) return;
  const G = ["#2e3038", "#5a5e68", "#8a8e98", "#b8bcc4"].map(hex), E = ["#3a1206", "#a83a0a", "#ff8a20", "#ffd060", "#fff4c0"].map(hex);
  const L = ["#1e0806", "#3c100c", "#5e1a10", "#ff4a14", "#ffb050"].map(hex);
  p.shade(x0, y0, x1, y1, (x, y) => {
    const dx = (x - cx) / R, dy = (y - cy) / R, r2 = dx * dx + dy * dy;
    if (r2 > 1) return;
    const nz = Math.sqrt(1 - r2), lit = clamp(-0.5 * dx - 0.55 * dy + 0.66 * nz), f = 1 / (0.5 + 0.5 * nz);
    const c = cells(dx * f * sc + 20, dy * f * sc + 20, seed), v = rand(c.id, seed + 7);
    if (kind === "stone" || kind === "heat") {
      let col = c.e < 0.07 ? G[0] : mix(G[1], G[3], clamp(lit * 0.9 + (v - 0.5) * 0.3));
      if (c.e >= 0.07 && c.e < 0.12 && lit > 0.5) col = G[3];
      if (r2 > 0.9) col = mix(col, G[0], (r2 - 0.9) * 6);
      if (heat > 0) {
        const h = heat * (0.55 + 0.45 * (1 - lit * 0.5)), hot = c.e < 0.08 ? E[Math.min(4, 2 + Math.floor(heat * 2.9))] : mix(E[1], E[3], clamp(heat * 1.2 - 0.2 + v * 0.2));
        col = mix(col, hot, clamp(h));
      }
      return col;
    }
    if (kind === "sun") {
      const n = noise2(dx * 6 + t * 0.6, dy * 6, 21);
      if (c.e < 0.05) return mix(E[0], E[1], clamp(0.5 + n));
      if (c.e < 0.1) return E[2];
      return mix(E[2], E[4], clamp(0.25 + nz * 0.6 + n * 0.3 + v * 0.15));
    }
    // lava
    if (c.e < 0.045) return L[4];
    if (c.e < 0.09) return L[3];
    let col = mix(L[0], L[2], clamp(lit + (v - 0.5) * 0.3));
    if (r2 > 0.82) col = mix(col, L[3], (r2 - 0.82) * 4.5);
    return col;
  });
}
/** A rough ragdoll for the foe in the inserts: tiny, curled. */
function tinyFoe(p, x, y, s, a = 0) {
  const O = hex("#e8701c"), D = hex("#2a1a14"), Y = hex("#f2c040");
  const rot = (u, v) => [x + (u * Math.cos(a) - v * Math.sin(a)) * s, y + (u * Math.sin(a) + v * Math.cos(a)) * s];
  const ln = (a0, a1, c, w) => { const [p0, p1] = [rot(...a0), rot(...a1)]; p.beam(p0[0], p0[1], p1[0], p1[1], w * s, c); };
  ln([0, -2], [0, 3], O, 2.4); ln([0, 0], [-3, 2], O, 1.2); ln([0, 0], [3, -1], D, 1.2); ln([0, 3], [-2, 6], D, 1.3); ln([0, 3], [2, 6], D, 1.3);
  const h = rot(0, -4); p.circle(h[0], h[1], 1.6 * s, Y);
}
/** Lightning bolts crawling across a region from (x0, y0) toward (x1, y1), re-rolled every frame. */
function crawl(p, t, x0, y0, x1, y1, n, seed, k = 1) {
  const f = Math.floor(t * 18);
  for (let i = 0; i < n; i++) {
    const a = rand(f + i, seed), b = rand(f + i, seed + 1);
    bolt(p, x0 + (x1 - x0) * a * 0.3, y0 + (y1 - y0) * b, x0 + (x1 - x0) * (0.6 + 0.4 * b), y0 + (y1 - y0) * a, f + i * 7, LIT, { jag: 0.22, seed: seed + i, glow: 0.35 * k });
  }
}
/** Speed streaks running along direction (dx, dy) across the box, moving. */
function streaks(p, box, t, dx, dy, n, c, k = 1, seed = 5, sp = 3) {
  const [x0, y0, x1, y1] = box, W = x1 - x0, H = y1 - y0, nx = -dy, ny = dx;
  for (let i = 0; i < n; i++) {
    const off = (rand(i, seed) - 0.5) * Math.hypot(W, H), ph = ((t * (sp + rand(i, seed + 1) * sp) + rand(i, seed + 2)) % 1) * 2 - 1, L = 30 + 90 * rand(i, seed + 3);
    const mx = CX + nx * off + dx * ph * W * 0.8, my = CY + ny * off + dy * ph * H * 0.8;
    p.line(mx, my, mx + dx * L, my + dy * L, c, k * (0.35 + 0.55 * rand(i, seed + 4)));
  }
}
const sky = (t) => (t < 3.5 ? ["#2c2650", "#6c5c92", "#a898c4"] : t < 10 ? ["#241c22", "#5e4642", "#9a7462"] : ["#181c2a", "#3a4054", "#68708a"]).map(hex);

// ---- the rocks the cut tears loose ----
const RK = Array.from({ length: 34 }, (_, i) => ({ x: -110 + rand(i, 11) * 480, s: 2 + rand(i, 12) * 6, h: 18 + rand(i, 13) * 150, ph: rand(i, 14) * TAU, front: rand(i, 15) < 0.4, del: rand(i, 16) * 0.35, a: rand(i, 17) * TAU }));
function rocks(p, t, front) {
  if (t < WIDE - 0.05 || t > EYES + 0.02) return;
  for (const r of RK) {
    if (r.front !== front) continue;
    const up = ease.outCubic(smooth(WIDE + r.del, WIDE + 0.9 + r.del, t)), extra = smooth(RAISE, EYES, t) * 20;
    if (up <= 0) continue;
    const y = -up * r.h - extra * (r.h / 160) + Math.sin(t * 2.5 + r.ph) * 2 * up;
    drawChunk(p, r.x, y - r.s, r.s * (front ? 1.25 : 1), r.a + t * 0.8, ROCK);
  }
}

// ---- the inserts (full-frame shots), each [t0, t1, painter(p, u, t, box)] ----
const INS = [
  // the grip: his fist on the hilt, the blade sliding out and catching the light, then the light of the cut
  [GRIP0, HIT1, (p, u, t, box) => {
    const [x0, , , y1] = box, second = u > 0.45, v = second ? (u - 0.45) / 0.55 : u / 0.45;
    backdrop(p, box, t, { c0: "#121026", c1: "#2a2650", style: "flow", seed: 4 });
    const A = second ? -0.62 : -0.32, hx = second ? 150 + 10 * v : 116 + 8 * v, hy = second ? -98 : -122, ux = Math.cos(A), uy = Math.sin(A);
    // the cloak over the shoulder: a big pale slab across the lower left
    p.poly([[x0, y1], [x0, -150], [10, -190], [120, -70], [170, y1]], CLOAK[1]);
    p.poly([[x0, y1], [x0, -60], [40, -90], [90, y1]], CLOAK[0]);
    p.line(10, -190, 120, -70, CLOAK[2]);
    // the arm in its dark sleeve, from the bottom left to the fist
    p.beam(hx - ux * 260, hy - uy * 260 + 30, hx - ux * 14, hy - uy * 14, 34, SLEEVE[0]);
    p.beam(hx - ux * 240, hy - uy * 240 + 24, hx - ux * 16, hy - uy * 16, 22, SLEEVE[1]);
    // the blade out of the fist
    const L = second ? 360 : 70 + 290 * ease.outCubic(clamp(v * 1.1)), nx = -uy, ny = ux;
    p.beam(hx, hy, hx + ux * L, hy + uy * L, 9, STEEL[0]);
    p.beam(hx, hy, hx + ux * L, hy + uy * L, 6, STEEL[1]);
    p.line(hx + nx * 2, hy + ny * 2, hx + ux * L + nx * 2, hy + uy * L + ny * 2, STEEL[2]);
    // the hilt, wrapped, behind the fist
    p.beam(hx - ux * 56, hy - uy * 56, hx, hy, 12, INK);
    for (let i = 0; i < 6; i++) { const k = -50 + i * 9; p.line(hx + ux * k + nx * 5, hy + uy * k + ny * 5, hx + ux * (k + 6) - nx * 5, hy + uy * (k + 6) - ny * 5, SLEEVE[2]); }
    p.beam(hx - 2, hy - 8, hx + 2, hy + 8, 6, hex("#3a3a46"));
    // the fist
    p.circle(hx - ux * 6, hy - uy * 6, 17, SKIN[0]);
    p.circle(hx - ux * 8 - 2, hy - uy * 8 - 3, 14, SKIN[1]);
    for (let i = 0; i < 4; i++) { const k = -14 + i * 7; p.line(hx - ux * 6 + nx * k * 0.9 + ux * 10, hy - uy * 6 + ny * k * 0.9 + uy * 10, hx - ux * 6 + nx * k * 0.9 + ux * 16, hy - uy * 6 + ny * k * 0.9 + uy * 16, SKIN[0]); }
    p.circle(hx - ux * 12 - 4, hy - uy * 12 - 6, 4, SKIN[2]);
    // a glint running up the blade
    const g = (v * 1.3) % 1;
    p.glow(hx + ux * L * g, hy + uy * L * g, 22, WHITE, 0.8);
    p.line(hx + ux * L * g - 10, hy + uy * L * g, hx + ux * L * g + 10, hy + uy * L * g, WHITE);
    // the light of the cut: a white band sweeping over the frame
    if (second && v > 0.45) {
      const k = (v - 0.45) / 0.55, w = 6 + 60 * k, c0 = CX - 120 + 240 * k;
      p.shade(box[0], box[1], box[2], box[3], (x, y, out) => {
        const d = Math.abs((x - c0) * 0.55 + (y - CY) * 0.83);
        if (d > w) return;
        out.a = 1 - k * 0.3;
        return d < w * 0.5 ? WHITE : LIT[3];
      });
    }
    speedLines(p, box, t, CX + 60, CY, 0.5, LIT[3]);
  }],
  // the eyes: the Eternal Mangekyou (his right) and the Rinnegan (his left, half under the hair), pushing in
  [EYES, SPH, (p, u, t, box) => {
    const art = EYEART();
    if (art) {
      // his eyes as the team drew them, five times their pixels and pushing in; the lids lift; the irises glow
      const [x0, y0, x1, y1] = box, Z = 5 * (1 + 0.12 * ease.inOutCubic(u)), cx = CX + 2, cy = CY + 6;
      p.rect(x0, y0, x1 - x0, y1 - y0, hex("#000000"));
      drawSprite(p, art, cx, cy, { ax: art.w / 2, ay: art.h / 2, scale: Z });
      const open = ease.outCubic(smooth(0.02, 0.32, u)), top = cy - art.h * Z * 0.5, lid = (1 - open) * art.h * Z * 0.62;
      if (lid > 0) p.rect(x0, top, x1 - x0, lid, hex("#000000"));
      const sw = smooth(0.3, 0.7, u) * (1 - smooth(0.88, 1, u)), ey = cy + (25 - art.h / 2) * Z;
      if (sw > 0) { p.glow(cx + (21 - art.w / 2) * Z, ey, 9 * Z, hex("#ff2a1a"), 0.35 * sw); p.glow(cx + (85 - art.w / 2) * Z, ey, 9 * Z, hex("#b060ff"), 0.35 * sw); }
      for (let i = 0; i < 6; i++) { const x = x0 - 40 + (((u * (0.4 + rand(i, 31) * 0.5) + rand(i, 32)) % 1.2) * 600), y = -240 + rand(i, 33) * 260; drawChunk(p, x, y, 5 + rand(i, 34) * 10, t + i, ROCK); }
      p.shade(x0, y0, x1, y1, (x, y, out) => { const d = Math.hypot((x - CX) / 260, (y - CY) / 160); if (d < 0.9) return; out.a = clamp((d - 0.9) * 2.5) * 0.6; return hex("#000000"); });
      return;
    }
    const z = 1 + 0.14 * ease.inOutCubic(u), R = 26 * z, op = 0.7 + 0.3 * ease.outCubic(smooth(0.05, 0.4, u)), sx = p.cellX(CX, CY);
    const eye = { skin: "#f0d6c2", shadow: "#c4a294", brow: "#121426", open: op };
    const tr = 0, tv = 0;
    clip(p, (x) => x < sx, () => eyeShot(p, box, t, { ...eye, kind: "sasukeEMS", cx: CX - 84 * z + tr, cy: CY + 10 + tv, R, rot: t * 1.3 }));
    clip(p, (x) => x >= sx, () => eyeShot(p, box, t, { ...eye, kind: "rinnegan", cx: CX + 84 * z + tr, cy: CY + 6 + tv, R, flip: true }));
    // the nose between them, in shadow
    p.shade(CX - 14, CY - 30, CX + 14, BOX[3], (x, y, out) => { const d = Math.abs(x - CX + (y - CY) * 0.08); if (d > 10) return; out.a = 0.35 * (1 - d / 10); return hex("#b08a7c"); });
    // the hair: long dark locks hanging over the brow, curving, tapering to points; thick over the Rinnegan
    const H = [hex("#0e101c"), hex("#1c2034"), hex("#363c60")];
    const locks = [[-150, 70, -160, -30, -20], [-70, 46, -46, -120, 16], [96, 40, 116, -84, 10], [176, 58, 180, -40, 24], [292, 70, 300, -46, 20], [330, 90, 380, 10, 20]];
    for (const [xa, w, xb, yb, bend] of locks) {
      const sw = Math.sin(t * 2.2 + xa * 0.1) * 2, yt = BOX[1] + 20, N = 22;
      for (let i = 0; i < N; i++) {
        const a = i / N, b = (i + 1) / N, bx = (k) => xa + (xb - xa) * k + Math.sin(k * Math.PI) * bend + sw * k, by = (k) => yt + (yb - yt) * k;
        const wa = w * (1 - a) ** 0.8 + 1;
        p.beam(bx(a), by(a), bx(b), by(b), wa, H[0]);
        if (wa > 6) { p.line(bx(a) - wa * 0.25, by(a), bx(b) - wa * 0.22, by(b), H[1]); p.line(bx(a) + wa * 0.15, by(a), bx(b) + wa * 0.12, by(b), H[2], 0.6); }
      }
    }
    // the hood over the brow
    p.poly([[BOX[0], BOX[1]], [BOX[2], BOX[1]], [BOX[2], -224], [CX, -236], [BOX[0], -212]], hex("#1c2038"));
    p.line(BOX[0], -212, CX, -236, hex("#3a3f68")); p.line(CX, -236, BOX[2], -224, hex("#3a3f68"));
    // the light in the eyes swelling as they open, a tremble, the frame's edges closing in
    const sw = smooth(0.3, 0.75, u) * (1 - smooth(0.85, 1, u));
    if (sw > 0) { p.glow(CX - 84 * z, CY + 10, R * 1.3, hex("#ff2a1a"), 0.35 * sw); p.glow(CX + 84 * z, CY + 6, R * 1.3, hex("#b48cff"), 0.35 * sw); }
    p.shade(BOX[0], BOX[1], BOX[2], BOX[3], (x, y, out) => { const d = Math.hypot((x - CX) / 260, (y - CY) / 160); if (d < 0.85) return; out.a = clamp((d - 0.85) * 2.2) * (0.5 + 0.3 * u); return hex("#06040a"); });
    // rocks drifting past in front
    for (let i = 0; i < 7; i++) { const x = BOX[0] - 40 + (((u * (0.4 + rand(i, 31) * 0.5) + rand(i, 32)) % 1.2) * 600), y = -240 + rand(i, 33) * 260; drawChunk(p, x, y, 4 + rand(i, 34) * 10, t + i, ROCK); }
  }],
  // the gravity: the foe wrapped in a dark sphere, the rocks streaking in toward it
  [SPH, SWIRL, (p, u, t, box) => {
    backdrop(p, box, t, { c0: "#141a34", c1: "#5a6ca8", style: "rays", cx: CX, cy: CY });
    for (let i = 0; i < 46; i++) {
      const a = rand(i, 21) * TAU, k = (u * 1.4 + rand(i, 22)) % 1, r = 40 + 240 * (1 - k), x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * 0.8;
      p.line(x, y, x + Math.cos(a) * 26, y + Math.sin(a) * 21, hex("#8a9ac8"), 0.4);
      drawChunk(p, x, y, 2 + rand(i, 23) * 6 * (r / 200 + 0.4), a + t * 3, ROCK);
    }
    const R = 40 + 4 * Math.sin(t * 20);
    p.shade(CX - R - 2, CY - R - 2, CX + R + 2, CY + R + 2, (x, y, out) => {
      const d = Math.hypot(x - CX, y - CY) / R;
      if (d > 1) return;
      out.a = 0.88;
      if (d > 0.9) return LIT[2];
      return noise2(Math.atan2(y - CY, x - CX) * 3 + t * 8, d * 4, 51) > 0.35 ? hex("#1a2244") : hex("#060812");
    });
    tinyFoe(p, CX, CY + 2, 3, 0.5 + t * 2);
  }],
  // the rocks spiral in and pack into a clump, chunks rushing past the camera
  [SWIRL, DARK, (p, u, t, box) => {
    backdrop(p, box, t, { c0: "#10142a", c1: "#46588e", style: "rays", cx: CX, cy: CY, seed: 3 });
    const sh = S3("swirl");
    if (sh) {
      drawShot(p, box, frameAt(sh, u));
      speedLines(p, box, t, CX, CY, 0.7, hex("#8a9ad0"));
      if (u > 0.7) p.rect(box[0], box[1], box[2] - box[0], box[3] - box[1], hex("#06070c"), (u - 0.7) / 0.3 * 0.85);
      return;
    }
    const spin = u * 2.6;
    for (let i = 0; i < 70; i++) {
      const a0 = rand(i, 41) * TAU, k = clamp(u * 1.35 - rand(i, 42) * 0.35), r = (1 - ease.inCubic(k)) * 260 + 8, a = a0 + spin + (1 - r / 260) * 2.2;
      const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * 0.85, s = (2 + rand(i, 43) * 5) * (0.6 + r / 160);
      p.line(x, y, x + Math.sin(a) * 14, y - Math.cos(a) * 12, hex("#6a7cb0"), 0.5);
      drawChunk(p, x, y, s, a * 2, ROCK);
    }
    const cr = 6 + 26 * ease.outCubic(u);
    for (let i = 0; i < 26; i++) { const a = rand(i, 44) * TAU + spin, r = cr * Math.sqrt(rand(i, 45)); drawChunk(p, CX + Math.cos(a) * r, CY + Math.sin(a) * r, cr * 0.32, a, ROCK); }
    // three big chunks flying at the camera
    for (let i = 0; i < 3; i++) {
      const k = clamp(u * 2 - i * 0.45);
      if (k <= 0 || k >= 1) continue;
      const a = 0.7 + i * 2.1 + spin * 0.3, r = 40 + 260 * ease.inCubic(k);
      drawChunk(p, CX + Math.cos(a) * r, CY + Math.sin(a) * r, 8 + 70 * ease.inCubic(k), a, ROCK);
    }
    if (u > 0.7) p.rect(box[0], box[1], box[2] - box[0], box[3] - box[1], hex("#06070c"), (u - 0.7) / 0.3 * 0.85);
  }],
  // dark; the moon's edge looming in
  [DARK, MOON, (p, u, t, box) => {
    p.shade(box[0], box[1], box[2], box[3], (x, y) => (rand(Math.floor(x) * 7 + Math.floor(y) * 131, Math.floor(t * 20)) > 0.985 ? hex("#1a1c24") : hex("#0a0b11")));
    const k = smooth(0.45, 1, u);
    if (k > 0) {
      const mx = CX + 230, my = CY - 70, R = 240;
      p.shade(mx - R, my - R, mx + R, my + R, (x, y, out) => { const d = Math.hypot(x - mx, y - my) / R; if (d > 1) return; out.a = k * (0.5 + 0.4 * (1 - d)); return cells((x - mx) * 0.03, (y - my) * 0.03, 9).e < 0.06 ? hex("#0e0f14") : hex("#262830"); });
    }
  }],
  // the stone moon against the sky, seen from below, debris crumbling off it
  [MOON, HOR, (p, u, t, box) => {
    const S0 = hex("#6a9ad8"), S1 = hex("#e6eef8");
    p.shade(box[0], box[1], box[2], box[3], (x, y) => {
      const v = (y - box[1]) / (box[3] - box[1]), n = noise2(x * 0.012 + t * 0.2, y * 0.03, 61);
      const c = mix(S0, S1, clamp(v * 0.9 + (x - box[0]) / 1400));
      return n > 0.3 && v > 0.45 ? mix(c, WHITE, clamp((n - 0.3) * 2.2)) : c;
    });
    const R = 156 - 34 * ease.outCubic(u), mx = CX + 60, my = CY - 44 + 10 * u, sh = S3("moon");
    if (sh) drawShot(p, box, frameAt(sh, u));
    else ball(p, mx, my, R, t, "stone", { sc: 6, seed: 4 });
    for (let i = 0; i < (sh ? 0 : 26); i++) {
      const a = 1.0 + rand(i, 51) * 1.5, k = (u * 0.8 + rand(i, 52)) % 1, x = mx + Math.cos(a) * R * 0.9 + (rand(i, 53) - 0.5) * 20, y = my + Math.sin(a) * R * 0.9 + k * 90;
      drawChunk(p, x, y, 2 + rand(i, 54) * 6, t + i, ["#2e3038", "#4e525c", "#7a7e88", "#a8acb4"].map(hex));
    }
    if (u < 0.3) speedLines(p, box, t, sh ? CX - 40 : mx, sh ? CY - 60 : my, (0.3 - u) / 0.3, WHITE);
    // cloud drifting across the bottom right in front
    p.shade(CX, -40, box[2], box[3], (x, y, out) => { const n = noise2(x * 0.015 - t * 0.3, y * 0.04, 62) + (y + 40) / 140; if (n < 0.45) return; out.a = clamp((n - 0.45) * 3) * 0.9; return WHITE; });
  }],
  // from far above the clouds: the moon tiny and high, glowing as it falls back burning
  [HOR, FACE, (p, u, t, box) => {
    const sh = S3("horizon");
    if (sh) {
      const fr = frameAt(sh, u), SK = ["#1e2c66", "#4a6cb0", "#a8c8ee", "#eef8ff"].map(hex);
      p.shade(box[0], box[1], box[2], box[3], (x, y) => {
        const fx = Math.max(0, Math.min(fr.w - 1, Math.floor(x - box[0]))), edge = fr.low[fx] >= 0 ? fr.low[fx] : fr.h, d = edge - (y - box[1]);
        if (d < 4) return SK[3];
        if (d < 24) return mix(SK[3], SK[2], (d - 4) / 20);
        return mix(SK[2], SK[0], clamp((d - 24) / 170));
      });
      drawShot(p, box, fr);
      const m = sh.extra[Math.round(u * (sh.n - 1))]?.meteor, heat = smooth(0.25, 0.95, u);
      if (m && heat > 0) {
        const mx = box[0] + m[0], my = box[1] + m[1];
        p.glow(mx, my, 12 + 30 * heat, hex("#ffa030"), 0.75 * heat);
        if (heat > 0.4) { p.glow(mx, my, 8, hex("#fff0b0"), 0.8 * (heat - 0.4)); for (let i = 0; i < 6; i++) p.line(mx, my, mx - 10 - 18 * heat * rand(i, 63), my - 6 - 14 * heat * rand(i, 64), hex("#ffb050"), 0.5 * heat); }
      }
      return;
    }
    const ca = Math.cos(-0.24), sa = Math.sin(-0.24), drift = u * 10;
    const SK = ["#1e2c66", "#4a6cb0", "#a8c8ee", "#eef8ff"].map(hex), CL = ["#8aa0c4", "#c4d4ea", "#f0f6fc"].map(hex);
    p.shade(box[0], box[1], box[2], box[3], (x, y) => {
      const rx = (x - CX - drift) * ca - (y - CY) * sa, ry = (x - CX - drift) * sa + (y - CY) * ca, hz = 30 + rx * rx * 0.00045, d = hz - ry;
      if (d > 0) {
        if (d < 5) return SK[3];
        if (d < 22) return mix(SK[3], SK[2], (d - 5) / 17);
        return mix(SK[2], SK[0], clamp((d - 22) / 190));
      }
      const dd = -d, n = noise2(rx * 0.018, dd * 0.09 + 3, 71), m = noise2(rx * 0.05 + 9, dd * 0.2, 72);
      const c = mix(CL[2], CL[0], clamp(dd / 160 * 0.6 + (n < -0.1 ? 0.35 : 0)));
      return m > 0.5 ? mix(c, CL[1], 0.6) : c;
    });
    const heat = smooth(0.3, 0.95, u), mx = CX + 70 - drift * 0.5, my = CY - 66 + 8 * u, R = 10;
    if (heat > 0) p.glow(mx, my, R * (2 + 3.5 * heat), hex("#ffa030"), 0.7 * heat);
    ball(p, mx, my, R, t, "heat", { heat, sc: 2.2, seed: 5 });
    if (heat > 0.4) p.glow(mx, my, R * 1.3, hex("#fff0b0"), 0.6 * (heat - 0.4));
    for (let i = 0; i < 14; i++) { const k = (u + rand(i, 61)) % 1; p.dot(mx - 20 + rand(i, 62) * 40, my + 14 + k * 60, hex("#3a3e4a"), 1 - k); }
  }],
  // his face in the dusk, in shadow; lightning crawls over the frame and lights it
  [FACE, CHARGE, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box, fl = Math.max(smooth(0.26, 0.3, u) * (1 - smooth(0.34, 0.42, u)), smooth(0.55, 0.58, u) * (1 - smooth(0.62, 0.7, u)), smooth(0.82, 0.85, u) * (1 - smooth(0.9, 1, u)));
    const T = ["#9a7a6a", "#5c5a68", "#2a2e3a"].map(hex);
    p.shade(x0, y0, x1, y1, (x, y) => {
      const v = (y - y0) / (y1 - y0), n = noise2(x * 0.01 + t * 0.15, y * 0.025, 81);
      if (y > -50 + noise2(x * 0.02, 1, 82) * 8) return mix(T[2], hex("#14161e"), clamp((y + 50) / 70));
      const c = v < 0.35 ? mix(T[0], T[1], v / 0.35) : T[1];
      return n > 0.15 ? mix(c, hex("#3a3c4a"), clamp((n - 0.15) * 2)) : c;
    });
    const up = 12 * (1 - ease.outCubic(u)), X = CX, Y = up, img = SAS();
    if (img) {
      const Z = 8, k = 0.62 * (1 - fl * 0.85);
      drawSprite(p, img, X - 6, y1 + 4 + up, { ax: 11, ay: 24, scale: Z, crop: [0, 0, img.w, 24], tint: hex("#14121c"), k });
      // a red glint in his eye when the light hits him
      if (fl > 0.2) { const ex = X - 6 + (13 - 11) * Z, ey = y1 + 4 + up + (10 - 24) * Z; p.glow(ex, ey, 18, hex("#ff3020"), 0.7 * fl); }
      if (fl > 0) { crawl(p, t, x0, y0 + 20, x1, -60, 2, 91, fl); p.rect(x0, y0, x1 - x0, y1 - y0, LIT[3], 0.16 * fl); }
      return;
    }
    const dark = (c, k) => mix(c, hex("#16141c"), 0.8 * (1 - fl * k * 0.8));
    // the shoulders under the cloak, a high collar
    p.poly([[X - 230, y1], [X - 170, -36 + Y], [X - 64, -64 + Y], [X + 64, -64 + Y], [X + 170, -36 + Y], [X + 230, y1]], dark(CLOAK[1], 1));
    p.poly([[X - 230, y1], [X - 170, -36 + Y], [X - 120, -50 + Y], [X - 150, y1]], dark(CLOAK[0], 1));
    p.poly([[X - 62, -64 + Y], [X + 62, -64 + Y], [X + 50, -20 + Y], [X - 50, -20 + Y]], dark(SLEEVE[1], 0.6));
    // the hair behind, then the face, then the bangs over it and the cap
    const HC = hex("#0e0f18");
    p.poly([[X - 78, -58 + Y], [X - 74, -200 + Y], [X + 74, -200 + Y], [X + 80, -54 + Y], [X + 52, -70 + Y], [X - 54, -70 + Y]], HC);
    p.ellipse(X, -126 + Y, 44, 60, dark(SKIN[1], 1));
    p.ellipse(X + 14, -112 + Y, 26, 46, dark(SKIN[0], 0.8), 0.6);
    p.poly([[X - 44, -120 + Y], [X - 30, -70 + Y], [X, -64 + Y], [X + 30, -70 + Y], [X + 44, -120 + Y], [X + 40, -90 + Y], [X, -76 + Y], [X - 40, -90 + Y]], dark(SKIN[0], 0.6), 0.5);
    for (const [a, b, c, e] of [[-62, -40, -80, -58], [-40, -22, -146, -34], [-12, 4, -152, -6], [14, 30, -148, 20], [38, 58, -140, 46], [56, 70, -76, 66]]) p.poly([[X + a, -184 + Y], [X + b, -184 + Y], [X + e, c + Y]], HC);
    // the cap
    p.poly([[X - 74, -178 + Y], [X + 74, -178 + Y], [X + 64, -236 + Y], [X - 64, -236 + Y]], dark(hex("#4a3e36"), 0.8));
    p.poly([[X - 80, -176 + Y], [X + 80, -176 + Y], [X + 76, -186 + Y], [X - 76, -186 + Y]], dark(hex("#2e2622"), 0.8));
    p.line(X - 64, -236 + Y, X + 64, -236 + Y, dark(hex("#7a6a5e"), 1));
    // the eyes: slits, a red glint in his right when the lightning lights him
    for (const ex of [-22, 22]) p.line(X + ex - 9, -128 + Y, X + ex + 9, -126 + Y, INK);
    if (fl > 0.2) { p.glow(X - 22, -127 + Y, 10, hex("#ff3020"), 0.6 * fl); p.circle(X - 22, -127 + Y, 2, hex("#e02020")); }
    if (fl > 0) { crawl(p, t, x0, y0 + 20, x1, -60, 2, 91, fl); p.rect(x0, y0, x1 - x0, y1 - y0, LIT[3], 0.18 * fl); }
  }],
  // the burning moon fills the sky; far below, tiny, Sasuke with the Chidori blazing
  [SUN, LEAP, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box, j = [0, 0];
    p.shade(x0, y0, x1, y1, (x, y) => (rand(Math.floor(x) * 13 + Math.floor(y) * 71, Math.floor(t * 12)) > 0.992 ? hex("#ff9a40") : mix(hex("#2a120a"), hex("#120806"), clamp((y - y0) / 290))));
    const R = 176 + 36 * u, mx = CX + j[0], my = -262 + j[1], sh = S3("sun");
    if (sh) {
      const fr = frameAt(sh, u);
      p.shade(x0, y0, x1, y1, (x, y, out) => {
        const fx = Math.floor(x - x0 - j[0]);
        if (fx < 0 || fx >= fr.w || fr.bot[fx] < 0) return;
        const d = y - y0 - j[1] - fr.bot[fx], n = noise2(fx * 0.08 + t * 1.5, t * 4, 92), lick = 6 + 20 * Math.max(0, n);
        if (d < 0 || d > lick) return;
        out.a = 1 - (d / lick) * 0.4;
        return d < lick * 0.35 ? hex("#ffb040") : d < lick * 0.7 ? hex("#e05010") : hex("#5a1a08");
      });
      drawShot(p, box, fr, { dx: j[0], dy: j[1] });
    } else p.shade(mx - R - 40, my - R - 40, mx + R + 40, my + R + 40, (x, y, out) => {
      const d = Math.hypot(x - mx, y - my) - R, a = Math.atan2(y - my, x - mx);
      if (d < 0 || d > 40) return;
      const n = noise2(a * 9 + t * 2, d * 0.08 - t * 4, 92), lick = 14 + 22 * Math.max(0, n);
      if (d > lick) return;
      out.a = 1 - d / lick * 0.4;
      return d < lick * 0.4 ? hex("#ffb040") : d < lick * 0.75 ? hex("#e05010") : hex("#5a1a08");
    });
    if (!sh) ball(p, mx, my, R, t, "sun", { sc: 7, seed: 6 });
    // the ground: a black ridge
    p.shade(x0, -24, x1, y1, (x, y) => (y > -6 - 10 * Math.abs(noise2(x * 0.03, 2, 93)) ? hex("#0c0806") : undefined));
    // Sasuke, tiny, the Chidori in his hand
    const q = { ...CHG, crouch: 8, lean: 6, fx: 17, fy: -10 }, b = bodyAt([[0, q]], 0), hx = CX + b.handN[0], hy = -2 + b.handN[1];
    p.glow(hx, hy, 50, LIT[2], 0.6);
    const img = SAS();
    let ch = [hx, hy];
    if (img) { drawSprite(p, img, CX, -2, { ax: AX, ay: AY, solid: hex("#06060a"), part: { ...ARM, rot: -0.9 } }); const du = ARM.hand[0] - ARM.pivot[0], dv = ARM.hand[1] - ARM.pivot[1], c = Math.cos(-0.9), n = Math.sin(-0.9); ch = [CX + ARM.pivot[0] + du * c - dv * n - AX, -2 + ARM.pivot[1] + du * n + dv * c - AY]; }
    else drawFigure(p, q, CX, -2, { solid: hex("#06060a") });
    drawChidori(p, ch[0], ch[1], t, LIT, 1.4, 3);
    const f = Math.floor(t * 14);
    for (let i = 0; i < 3; i++) { const a = -1.2 - rand(f, i) * 0.8, L = 60 + 90 * rand(f, i + 5); bolt(p, ch[0], ch[1], ch[0] + Math.cos(a) * L, ch[1] + Math.sin(a) * L, f + i, LIT, { jag: 0.25, seed: i, glow: 0.3 }); }
    for (let i = 0; i < 16; i++) { const k = (u * 1.2 + rand(i, 94)) % 1; drawChunk(p, x0 + rand(i, 95) * 496, -200 + k * 220, 2 + rand(i, 96) * 4, t + i, ["#0a0606", "#1e0e08", "#3a1a0e", "#5a2a14"].map(hex)); }
  }],
  // the leap: a dark sweep, then his profile rising, the Chidori crackling ahead of him
  [LEAP, STREAK, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box;
    p.shade(x0, y0, x1, y1, (x, y) => mix(hex("#4a2a1a"), hex("#120c10"), clamp((y - y0) / 290 + 0.2)));
    streaks(p, box, t, 0.94, -0.34, 46, hex("#f0d0a0"), 0.7, 7, 4);
    if (u < 0.32) {
      const k = u / 0.32, yy = y1 + 40 - k * 420;
      p.poly([[x0, yy + 120], [x1, yy - 20], [x1, yy + 260], [x0, yy + 400]], hex("#0e0e16"));
      p.line(x0, yy + 120, x1, yy - 20, hex("#3a3040"));
      return;
    }
    const k = (u - 0.32) / 0.68, hx = CX + 90, hy = CY + 24 - 26 * k, img = SAS();
    if (img) {
      const cx = CX - 110, cy = CY + 6 - 16 * k, Z = 6, hb = y1 + 10 - 30 * k;
      p.glow(cx, cy, 70, LIT[2], 0.7);
      p.beam(hx - 20, hb - 40, cx + 16, cy + 8, 26, SLEEVE[0]);
      drawChidori(p, cx, cy, t, LIT, 3.2, 8);
      const f = Math.floor(t * 18);
      for (let i = 0; i < 6; i++) { const a = rand(f, i + 20) * TAU, L = 50 + 80 * rand(f, i + 30); bolt(p, cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L, f + i, LIT, { jag: 0.28, seed: i + 40, glow: 0.2 }); }
      drawSprite(p, img, hx, hb, { ax: 12, ay: 26, scale: Z, crop: [0, 0, img.w, 26], tint: hex("#ffb070"), k: 0.12 });
      return;
    }
    // the Chidori, out ahead and up
    const cx = CX - 110, cy = CY + 6 - 16 * k;
    p.beam(hx - 4, hy + 70, cx + 16, cy + 8, 24, SLEEVE[0]);
    p.beam(hx - 4, hy + 66, cx + 18, cy + 4, 14, SLEEVE[1]);
    p.glow(cx, cy, 70, LIT[2], 0.7);
    drawChidori(p, cx, cy, t, LIT, 3.2, 8);
    const f = Math.floor(t * 18);
    for (let i = 0; i < 6; i++) { const a = rand(f, i + 20) * TAU, L = 50 + 80 * rand(f, i + 30); bolt(p, cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L, f + i, LIT, { jag: 0.28, seed: i + 40, glow: 0.2 }); }
    // his head in profile, facing up and left: hair, face lit warm from the fire above, rim of blue from the Chidori
    const HC = hex("#101018");
    p.circle(hx + 16, hy - 18, 48, HC);
    for (let i = 0; i < 6; i++) { const a = -0.2 + i * 0.32; p.poly([[hx + 16 + Math.cos(a) * 40, hy - 18 + Math.sin(a) * 40], [hx + 16 + Math.cos(a + 0.2) * 40, hy - 18 + Math.sin(a + 0.2) * 40], [hx + 16 + Math.cos(a + 0.12) * 86, hy - 18 + Math.sin(a + 0.12) * 70]], HC); }
    const F = [[hx - 18, hy - 46], [hx - 30, hy - 30], [hx - 34, hy - 18], [hx - 48, hy - 4], [hx - 36, hy + 2], [hx - 38, hy + 12], [hx - 32, hy + 18], [hx - 34, hy + 26], [hx - 22, hy + 40], [hx + 6, hy + 44], [hx + 14, hy + 10]];
    p.poly(F, hex("#7a4a3a"));
    p.poly(F.map(([x, y]) => [x + (hx - x) * 0.18 + 2, y + (hy - y) * 0.18 - 3]), hex("#d89a72"));
    p.polyline(F.slice(1, 9), hex("#9ac8ff"));
    for (let i = 0; i < 4; i++) p.poly([[hx - 20 + i * 8, hy - 60], [hx - 12 + i * 8, hy - 60], [hx - 24 + i * 6, hy - 36 + i * 3]], HC);
    // the eye: a red-orange iris
    p.circle(hx - 24, hy - 14, 3.5, hex("#ff6a2a"));
    p.circle(hx - 24, hy - 14, 1.5, INK);
    p.px(hx - 25, hy - 16, WHITE);
    p.poly([[hx - 30, hy + 40], [hx + 60, hy + 40], [hx + 90, y1], [hx - 60, y1]], SLEEVE[0]);
  }],
  // a streak of blue light: his arm driving through
  [STREAK, PUNCH, (p, u, t, box) => {
    p.rect(box[0], box[1], box[2] - box[0], box[3] - box[1], hex("#0a0e2a"));
    const v0 = 150 - 300 * u;
    p.shade(box[0], box[1], box[2], box[3], (x, y, out) => {
      const s = (x - CX) * 0.9 - (y - CY) * 0.44, v = (x - CX) * 0.44 + (y - CY) * 0.9 - v0, w = 34 + 20 * Math.sin(s * 0.02 + t * 20) + 30 * noise2(s * 0.01 - t * 9, 1, 101);
      const d = Math.abs(v) / w;
      if (d > 1) return;
      out.a = 1;
      return d < 0.3 ? WHITE : d < 0.65 ? LIT[3] : d < 0.85 ? LIT[2] : LIT[1];
    });
    streaks(p, box, t, 0.9, -0.44, 30, WHITE, 0.6, 9, 6);
  }],
  // the punch: the molten crust close, lightning stabbing into it; a white burst, his fist in it
  [PUNCH, FIRE, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box;
    if (u < 0.22) {
      p.shade(x0, y0, x1, y1, (x, y) => { const c = cells(x * 0.035, y * 0.035, 11); return c.e < 0.05 ? hex("#ffa040") : c.e < 0.1 ? hex("#e04010") : mix(hex("#1e0a06"), hex("#3a160c"), rand(c.id, 3)); });
      crawl(p, t, CX - 160, CY - 90, CX + 160, CY + 90, 4, 111, 1);
      return;
    }
    p.shade(x0, y0, x1, y1, (x, y) => {
      const a = Math.atan2(y - CY, x - CX), d = Math.hypot(x - CX, y - CY), n = Math.floor(((a + Math.PI) / TAU) * 70), on = rand(n, 7 + Math.floor(t * 30)) > 0.45;
      if (d < 46) return WHITE;
      const tint = rand(n, 9) < 0.33 ? hex("#ffb0e0") : rand(n, 9) < 0.66 ? hex("#a0d0ff") : hex("#fff0b0");
      return on ? mix(WHITE, tint, clamp(d / 260)) : mix(hex("#e8eeff"), hex("#5a3a8a"), clamp((d - 46) / 230));
    });
    // his arm, from below, driving the fist in
    p.poly([[CX - 80, y1], [CX + 40, y1], [CX + 34, CY + 40], [CX - 2, CY + 26]], SLEEVE[1]);
    p.poly([[CX - 60, y1], [CX - 10, y1], [CX + 4, CY + 36]], SLEEVE[2]);
    p.circle(CX + 14, CY + 26, 18, hex("#c8a4a0"));
    // the one impact frame: lightning-shaped, ink and ice
    if (u < 0.42) impactFrame(p, x0, y0, x1, y1, CX + 14, CY + 20, u > 0.32, 177, { style: "bolts", ink: hex("#06081c"), paper: hex("#eef6ff"), lines: 44 });
  }],
  // the blast inside the moon: fire roaring out, his black arm through it, the Chidori at its heart
  [FIRE, PLANET, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box, ox = CX + 30, oy = CY - 6, S = 90 + 230 * ease.outCubic(u);
    p.shade(x0, y0, x1, y1, (x, y) => {
      const d = Math.hypot(x - ox, (y - oy) * 1.15) / S, a = Math.atan2(y - oy, x - ox), n = noise2(a * 5 + t, d * 6 - t * 5, 121) * 0.25;
      const e = d + n;
      if (e < 0.12) return mix(WHITE, LIT[3], e / 0.12);
      if (e < 0.32) return mix(hex("#fff4b0"), hex("#ffb040"), (e - 0.12) / 0.2);
      if (e < 0.6) return mix(hex("#ffa030"), hex("#e0400c"), (e - 0.32) / 0.28);
      if (e < 0.88) return mix(hex("#c0300a"), hex("#2a0e06"), (e - 0.6) / 0.28);
      return rand(Math.floor(x) * 9 + Math.floor(y) * 57, Math.floor(t * 15)) > 0.985 ? hex("#ff8030") : hex("#0e0606");
    });
    for (let i = 0; i < 40; i++) { const a = rand(i, 122) * TAU, r = (0.2 + ((u * 1.5 + rand(i, 123)) % 1)) * 300; p.line(ox + Math.cos(a) * r, oy + Math.sin(a) * r, ox + Math.cos(a) * (r + 18), oy + Math.sin(a) * (r + 18), hex("#ffd070"), 0.8); }
    for (let i = 0; i < 12; i++) { const a = rand(i, 124) * TAU, r = 40 + u * (180 + rand(i, 125) * 160); drawChunk(p, ox + Math.cos(a) * r, oy + Math.sin(a) * r, 4 + rand(i, 126) * 7, t * 4 + i, ["#060404", "#1a0a06", "#3a1608", "#6a2a10"].map(hex)); }
    // the arm, black against the fire, from the lower left to the heart
    const fx = ox - 8, fy = oy + 6;
    p.beam(x0 - 20, y1 + 30, fx - 12, fy + 10, 46, INK);
    p.beam(x0 - 10, y1 + 20, fx - 14, fy + 12, 40, hex("#14121c"));
    p.circle(fx, fy, 20, INK);
    p.line(x0 - 20, y1 - 10, fx - 20, fy - 10, hex("#ff8a30"));
    drawChidori(p, fx + 10, fy - 4, t, LIT, 2.6, 12);
  }],
  // the moon whole, from a distance: blue lightning veining it from inside, the light behind it rising
  [PLANET, BLUE, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box, R = 94 + 10 * u, glow = smooth(0.15, 0.85, u), veins = smooth(0.2, 1, u);
    p.shade(x0, y0, x1, y1, (x, y) => {
      const d = Math.hypot(x - CX, y - CY), n = noise2(x * 0.012 + t * 0.1, y * 0.02, 131);
      const base = mix(hex("#1c1626"), hex("#4a3a50"), clamp(0.5 + n));
      return mix(base, hex("#cfc6f4"), glow * clamp(1 - (d - R) / 200) * 0.9);
    });
    for (let i = 0; i < 18; i++) { const a = rand(i, 132) * TAU, r = R + 20 + rand(i, 133) * 120 + u * 30; drawChunk(p, CX + Math.cos(a) * r, CY + Math.sin(a) * r, 1.5 + rand(i, 134) * 3, t + i, ["#0a0606", "#2a1a1a", "#4a3030", "#6a4a40"].map(hex)); }
    const sh = S3("planet");
    if (sh) drawShot(p, box, frameAt(sh, u)); else ball(p, CX, CY, R, t, "lava", { sc: 6, seed: 8 });
    if (veins > 0) {
      p.glow(CX, CY, R * 0.7 * veins, LIT[2], 0.55 * veins);
      const f = Math.floor(t * 14), n = Math.ceil(veins * 9);
      for (let i = 0; i < n; i++) { const a = rand(f, i + 50) * TAU, L = R * (0.35 + 0.55 * veins * rand(f, i + 60)); bolt(p, CX, CY, CX + Math.cos(a) * L, CY + Math.sin(a) * L, f + i, LIT, { jag: 0.3, seed: i, glow: 0 }); }
    }
    if (u > 0.9) p.glow(CX, CY, R * 1.2, WHITE, (u - 0.9) * 8);
  }],
  // it bursts: a white core, waves of blue light blowing across the frame
  [BLUE, EARTH, (p, u, t, box) => {
    const B = ["#06205a", "#1468d8", "#5ac8ff", "#d6f6ff"].map(hex);
    p.shade(box[0], box[1], box[2], box[3], (x, y) => {
      const s = -(x - CX) * 0.9 + (y - CY) * 0.42, v = (x - CX) * 0.42 + (y - CY) * 0.9;
      const n = noise2(v * 0.012, s * 0.004 - t * 2.5, 141) + 0.4 * noise2(v * 0.04, s * 0.01 - t * 4, 142) + 0.15;
      if (n > 0.75) return WHITE;
      return n > 0.45 ? mix(B[2], B[3], (n - 0.45) / 0.3) : n > 0.1 ? mix(B[1], B[2], (n - 0.1) / 0.35) : mix(B[0], B[1], clamp(n + 0.5));
    });
    if (u < 0.35) { const k = 1 - u / 0.35; p.glow(CX + 40, CY - 30, 200 * k + 30, WHITE, 0.9 * k); p.circle(CX + 40, CY - 30, 90 * k, WHITE, k); }
    streaks(p, box, t, -0.9, 0.42, 34, WHITE, 0.7, 13, 5);
  }],
  // the planet from space: the foe driven down in a streak and a flash on its face; then white
  [EARTH, FALL, (p, u, t, box) => {
    const [x0, y0, x1, y1] = box, R = 420 + 26 * u, px = CX - 330 - 10 * u, py = CY + 200 + 4 * u, sh0 = S3("earth");
    p.shade(x0, y0, x1, y1, (x, y, out) => {
      const d = sh0 ? 1e9 : Math.hypot(x - px, y - py);
      if (d > R + 7) return rand(Math.floor(x) * 31 + Math.floor(y) * 997, 151) > 0.994 ? hex("#c8d0e0") : hex("#06070c");
      if (d > R) return mix(hex("#5ab4ff"), hex("#06070c"), (d - R) / 7);
      const lit = clamp((x - px) / R * 0.9 + 0.25), land = fbm(x * 0.009, y * 0.009, 152, 4), cl = fbm(x * 0.022 + 7, y * 0.04 - t * 0.05, 153, 4);
      let c = land > 0.2 ? mix(hex("#5a6a3a"), hex("#a09a6a"), clamp((land - 0.2) * 3)) : mix(hex("#12386e"), hex("#2e70c0"), clamp(0.6 + land));
      if (cl > 0.15) c = mix(c, hex("#f4f8ff"), clamp((cl - 0.15) * 2.5) * 0.85);
      c = mix(hex("#04060e"), c, 0.25 + 0.75 * lit);
      return d > R - 14 ? mix(c, hex("#8ad0ff"), (d - (R - 14)) / 14 * 0.8) : c;
    });
    const sh = S3("earth");
    if (sh) {
      const fr = frameAt(sh, u);
      drawShot(p, box, fr);
      // the atmosphere: a blue glow just off the limb
      p.shade(x0, y0, x1, y1, (x, y, out) => {
        const fy = Math.floor(y - y0), fx = Math.floor(x - x0), e = fr.right[fy];
        if (e < 0 || e >= fr.w - 1) return;
        const d = fx - e;
        if (d < -3 || d > 9) return;
        out.a = d < 0 ? 0.5 : 1 - d / 10;
        return d < 2 ? hex("#bfe8ff") : hex("#4aa0ff");
      });
    }
    const ix = CX - 80, iy = CY + 40, k = smooth(0.08, 0.3, u);
    if (k > 0) {
      p.glowLine(x1, y0 + 20, ix, iy, 6, LIT[3], 0.5 * (1 - smooth(0.4, 0.8, u)));
      p.line(x1 - (x1 - ix) * (1 - k), y0 + 20 + (iy - y0 - 20) * (1 - k), ix, iy, WHITE, 1 - smooth(0.4, 0.8, u));
      const r = 6 + 40 * smooth(0.3, 0.9, u);
      p.glow(ix, iy, 30 + r, WHITE, 0.8);
      p.ring(ix, iy, r, 1, LIT[3], 1 - smooth(0.5, 0.9, u));
      for (let i = 0; i < 10; i++) { const a = rand(i, 154) * TAU, rr = r * (0.6 + rand(i, 155) * 0.8); p.dot(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr * 0.6, WHITE); }
    }
    const w = smooth(0.8, 0.93, u);
    if (w > 0) p.rect(x0, y0, x1 - x0, y1 - y0, WHITE, w);
  }],
];

// ---- the camera between the inserts ----
export const camera = cineCam([
  ...insertKeys(INS),
  [0, { z: 1.0, x: 150, y: -96, r: 0 }],
  // the draw: close and low, a slow, steady move round him (no hand-held jolt)
  [DRAW0, { z: 3.0, x: 4, y: -34, r: -5 }, "cut"],
  [0.95, { z: 2.85, x: 1, y: -36, r: 0 }],
  [GRIP0 - 0.01, { z: 3.1, x: -1, y: -38, r: 3 }],
  // the hit: one hard jolt that dies at once
  [HIT1, { z: 3.2, x: MEET - 8, y: -24, r: -4, shake: 0.6 }, "cut"],
  [HIT1 + 0.1, { z: 3.15, x: MEET - 8, y: -25, r: -4, shake: 0 }],
  [WIDE - 0.01, { z: 3.0, x: MEET - 6, y: -28, r: -4 }],
  [WIDE, { z: 1.0, x: 140, y: -100, r: 1 }, "cut"],
  [RAISE - 0.01, { z: 1.05, x: 132, y: -110, r: 1 }],
  [RAISE, { z: 2.3, x: 44, y: -46, r: -3 }, "cut"],
  [EYES - 0.01, { z: 2.55, x: 42, y: -50, r: -4 }],
  // the Chidori: low and steady, a jolt only as it bursts
  [CHARGE, { z: 1.9, x: 58, y: -44, r: 2, shake: 0.4 }, "cut"],
  [CHARGE + 0.15, { z: 1.95, x: 57, y: -43, r: 2, shake: 0 }],
  [SUN - 0.01, { z: 2.2, x: 52, y: -38, r: -1 }],
  // the fall: the camera follows the foe down, smooth
  [FALL, { z: 1.25, x: TX - 10, y: -120, r: -3 }, "cut"],
  [CRASH - 0.01, { z: 1.3, x: TX - 8, y: -110, r: -2 }],
  [CRASH, { z: 1.4, x: TX - 20, y: -50, r: 0, shake: 0.8 }, "cut"],
  [CRASH + 0.25, { z: 1.35, x: TX - 22, y: -52, r: 0, shake: 0 }],
  [END, { z: 1.25, x: TX - 30, y: -60, r: 0 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const inIns = (t) => INS.some(([a, b]) => t >= a && t < b);
  return {
    update(t, dt) {
      if (t >= HIT1) once("hit1", () => { for (let i = 0; i < 20; i++) ps.spawn(P.SPARK, MEET, -26, R.range(-150, 150), R.range(-170, 30), R.range(0.2, 0.4), R.chance(0.5) ? LIT[3] : WHITE); });
      if (t >= CRASH) once("crash", () => { for (let i = 0; i < 26; i++) ps.spawn(P.SPARK, TX, -6, R.range(-170, 170), R.range(-200, -40), R.range(0.3, 0.7), R.chance(0.5) ? hex("#ffa030") : hex("#ffe080")); });
      ps.update(dt);
    },
    drawBack(p, t) {
      if (inIns(t)) return;
      const [x0, y0, x1] = BOX, S = sky(t);
      // the sky (with the far mesas) and the sandy ground
      p.shade(x0, y0, x1, 0, (x, y) => {
        const v = (y - y0) / -y0, n = noise2(x * 0.01 + t * 0.1, y * 0.03, 161), mesa = -12 - 26 * Math.max(0, noise2(x * 0.012, 5, 162) - 0.1) * 2.5;
        if (y > mesa) return mix(S[1], hex("#14121c"), 0.55);
        const c = v < 0.6 ? mix(S[0], S[1], v / 0.6) : mix(S[1], S[2], (v - 0.6) / 0.4);
        return n > 0.25 ? mix(c, S[0], clamp((n - 0.25) * 1.6)) : c;
      });
      p.shade(x0, 0, x1, BOX[3], (x, y) => (noise2(x * 0.08, y * 0.3, 163) > 0.4 ? hex("#4a3e30") : hex("#6a5a44")));
      rocks(p, t, false);
      // the charge: bolts reaching for the sky behind him
      if (t >= CHARGE && t < SUN) {
        const bh = SAS() ? sasHand(t) : bodyAt(act.poses, t).handN, f = Math.floor(t * 12);
        for (let i = 0; i < 4; i++) { const a = -0.4 - rand(f, i) * 2.4, L = 90 + 110 * rand(f, i + 4); bolt(p, bh[0], bh[1], bh[0] + Math.cos(a) * L, bh[1] + Math.sin(a) * L, f + i, LIT, { jag: 0.22, seed: i + 70, glow: 0.4 }); }
        p.glow(bh[0], 0, 90, LIT[3], 0.5);
      }
      if (t >= CRASH) blast(p, t - CRASH, { x: TX, y: 0, R: 46, C: DUSTC, seed: 5, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      if (!inIns(t)) {
        if (t < LEAP + 0.08) drawSasuke(p, t);
        rocks(p, t, true);
        // the cut: a white crescent where the sword went
        if (t > HIT1 - 0.12 && t < WIDE + 0.45) {
          const k = 1 - smooth(HIT1, WIDE + 0.45, t);
          const R0 = SAS() ? 46 : 34, cy0 = SAS() ? -34 : -24;
          p.arc(44, cy0, R0, 4 * k + 1, -2.3, 0.8, WHITE, k);
          p.arc(44, cy0, R0 - 4, 2, -2.1, 0.6, LIT[3], k);
        }
        // the hit: a four-point star of light on the foe
        if (t >= HIT1 && t < WIDE) {
          const k = 1 - (t - HIT1) / (WIDE - HIT1), cx = MEET, cy = -26;
          p.glow(cx, cy, 40, LIT[3], 0.8 * k);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.beam(cx, cy, cx + dx * 46 * k, cy + dy * 30 * k, 3 * k + 1, WHITE, k);
          p.line(cx - 30, cy + 20, cx + 30, cy - 20, WHITE, k);
        }
        // the foe streaking up: a trail
        if (t >= WIDE && t < RAISE) { const s = targetState(t), s0 = targetState(t - 0.08); p.glowLine(TX + s0.dx, -26 + s0.dy, TX + s.dx, -26 + s.dy, 5, LIT[3], 0.6); }
        if (t >= RAISE && t < EYES) { drawGlint(p, t, "rinnegan", RAISE + 0.1, EYES, SAS() ? sasPoint(t, 14, 12, false) : b.head); speedLines(p, BOX, t, 46, -40, smooth(RAISE + 0.3, EYES, t), WHITE); }
        // the Chidori: a knot of lightning in his hand, bolts everywhere, the ground flaring white
        if (t >= CHARGE && t < SUN) {
          const k = smooth(CHARGE, CHARGE + 0.25, t), [hx, hy] = SAS() ? sasHand(t) : b.handN, f = Math.floor(t * 16);
          drawChidori(p, hx, hy, t, LIT, 2.2 * k, 5);
          for (let i = 0; i < 6; i++) { const a = rand(f, i + 10) * TAU, L = (40 + 120 * rand(f, i + 16)) * k; bolt(p, hx, hy, hx + Math.cos(a) * L, Math.min(0, hy + Math.sin(a) * L * 0.6), f + i, LIT, { jag: 0.25, seed: i, glow: 0.25 }); }
          p.shade(hx - 90, -6, hx + 90, 6, (x, y, out) => { const d = Math.hypot((x - hx) / 90, y / 6); if (d > 1) return; out.a = k * (1 - d) * 0.9; return WHITE; });
          if (rand(f, 99) > 0.7) p.rect(BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1], LIT[3], 0.22 * k);
        }
        // the fall: lightning still crackling over the foe, rocks raining out of the storm
        if (t >= FALL && t < CRASH + 0.4) {
          const s = targetState(t), fy = -26 + (s.dy ?? 0), f = Math.floor(t * 18);
          if (t < CRASH) for (let i = 0; i < 3; i++) { const a = rand(f, i) * TAU, L = 14 + 20 * rand(f, i + 3); bolt(p, TX, fy, TX + Math.cos(a) * L, fy + Math.sin(a) * L, f + i, LIT, { jag: 0.35, seed: i + 80, glow: 0.2 }); }
          for (let i = 0; i < 14; i++) { const y = ((t * (140 + rand(i, 171) * 80) + rand(i, 172) * 320) % 340) - 320; if (y < 0) drawChunk(p, 120 + rand(i, 173) * 260, y, 2 + rand(i, 174) * 4, t * 3 + i, ROCK); }
        }
        if (t >= CRASH) blast(p, t - CRASH, { x: TX, y: 0, R: 46, C: DUSTC, seed: 5, layer: "front" });
        ps.draw(p, "front");
      }
      inserts(p, t, BOX, INS);
      cutFlash(p, BOX, t, [HIT1, PUNCH, BLUE, CRASH], 0.04, WHITE);
      if (t >= FALL && t < FALL + 0.12) p.rect(BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1], WHITE, 1 - (t - FALL) / 0.12);
    },
  };
});
