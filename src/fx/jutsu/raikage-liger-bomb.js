// Raiton: Liger Bomb (A, the Fourth Raikage). Narutopedia: with his Lightning Release Chakra Mode on, armour of lightning
// over his whole body, A is fast enough to outrun the eye; the Liger Bomb grabs the foe, lifts him overhead and drives
// him head-first into the ground with all his weight. Here: he cracks his neck, and the lightning armour flares over
// him, crackling white-blue, the floor sparking under his feet; he is gone, a streak and a trail of after-images, and
// already has the target by the middle; heaves it up overhead, upside down; leaps; at the top of the leap the lightning
// gathers; he comes down and drives it into the floor: a crater, a column of lightning, rocks and sparks thrown out,
// two frames of ink; he rises out of the dust, armour still crackling.
// New: the armour, the grab and lift (the target carried by targetState), the leap, the crater. From _lib: bolts,
// chunks, the impact frame; library: ground slam.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as slam from "../impacts/ground-slam.js";
import { play, bodyAt, bolt, drawChunk, drawFigure, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 160, ARMOUR = 0.45, DASH = 0.95, GRAB = 1.05, LIFT = 1.35, JUMP = 1.55, TOP = 1.85, SLAM = 2.02, RISE = 2.9, END = 3.9;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"].map(hex);
const ROCK = ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex);
const GX = TX - 14;

export const meta = {
  name: "Lightning release: liger bomb",
  desc: "The Fourth Raikage: lightning armour flares over him; a streak and he has the target by the middle, heaves it overhead upside down, leaps, and drives it head-first into the floor: a crater and a column of lightning.",
  tags: ["jutsu", "raikage", "lightning", "raiton", "grapple", "melee", "one-shot"],
  size: [300, 220],
  origin: [56, 188],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"], seed: 66 },
};

const FLEX = { ...READY, crouch: 6, lean: 2, fx: 10, fy: -18, bx: 8, by: -18, ffx: 10, fbx: -10 };
const RUSH = { ...READY, x: GX - 6, crouch: 9, lean: 18, fx: 14, fy: -20, bx: 10, by: -22, ffx: 13, fbx: -12, ghost: true, gait: false };
const HUG = { ...READY, x: GX, crouch: 7, lean: 8, armsFront: true, fx: 13, fy: -24, bx: 12, by: -22, ffx: 10, fbx: -10, gait: false };
const OVER = { ...READY, x: GX, crouch: 4, lean: -6, armsFront: true, fx: 4, fy: -44, bx: 6, by: -44, ffx: 9, fbx: -9, gait: false };
const AIR = { ...OVER, y: -70, crouch: 0, lean: 6, ffy: -12, fby: -10, fx: 10, fy: -40, bx: 12, by: -40 };
const DOWN = { ...READY, x: GX + 4, crouch: 15, lean: 18, armsFront: true, fx: 18, fy: -8, bx: 16, by: -8, ffx: 12, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#9adaff",
  poses: [
    [-0.25, READY],
    [ARMOUR - 0.1, { ...READY, hx: 2 }, "out"],
    [ARMOUR, FLEX, "snap"],
    [DASH - 0.05, { ...FLEX, crouch: 9, lean: 10 }],
    [GRAB - 0.03, RUSH, "line"],
    [GRAB, HUG, "snap"],
    [LIFT, OVER, "out"],
    [JUMP, { ...OVER, crouch: 9 }],
    [TOP, AIR, "out"],
    [SLAM, DOWN, "in"],
    [RISE, { ...DOWN, crouch: 12 }],
    [RISE + 0.35, { ...FLEX, x: GX + 4, gait: false }, "out"],
    [END, { ...FLEX, x: GX + 4, gait: false }],
  ],
  hits: [
    { t: ARMOUR, stop: 0.08, shake: 0.3, amp: 2, target: false, sfx: "thunder" },
    { t: GRAB, stop: 0.1, shake: 0.2, amp: 2, push: 0.5, straw: 8, sfx: "heavy" },
    { t: JUMP, target: false, sfx: "whoosh" },
    { t: SLAM, stop: 0.26, shake: 1.0, amp: 8, push: 0, straw: 70, skin: "shock", shiver: 0.8, sfx: "explosion" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: DASH, x: 0, n: 10, dir: -1 }, { t: JUMP, x: GX, n: 12 }, { t: SLAM, x: GX - 30, n: 20, dir: -1 }, { t: SLAM, x: GX + 40, n: 20, dir: 1 }],
};

// the target carried: from his grip it rides up over his head, turning upside down, up with the leap, and down head-first
export const targetState = (t) => {
  if (t < GRAB) return null;
  const b = bodyAt(act.poses, Math.min(t, SLAM)), hx = (b.handN[0] + b.handF[0]) / 2, hy = (b.handN[1] + b.handF[1]) / 2;
  if (t < SLAM) {
    const flip = smooth(GRAB + 0.05, LIFT, t);
    return { dx: hx - TX + 4 * (1 - flip), dy: hy + 26 - 18 * flip + 8 * (1 - flip), rot: Math.PI * flip };
  }
  // driven in head first, stuck a beat, then pulled out and back on its post
  const out = smooth(RISE, RISE + 0.5, t);
  return { dx: (hx - TX) * (1 - out), dy: (hy + 26 + 12) * (1 - out), rot: Math.PI * (1 - out), s: 1 - 0.1 * (1 - out) };
};

export const create = play([{ fx: slam, t: SLAM, x: GX + 12, reach: 120, palette: ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff", "#ffffff", "#ffffff"] }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), rocks = [];
  let slammed = false;
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the armour throws sparks off him and off the floor at his feet
      if (t > ARMOUR && R.chance(60 * dt)) ps.spawn(P.SPARK, b.chest[0] + R.range(-8, 8), b.chest[1] + R.range(-12, 20), R.range(-80, 80), -R.range(20, 100), R.range(0.08, 0.2), R.chance(0.5) ? WHITE : LT[3]);
      if (!slammed && t >= SLAM) {
        slammed = true;
        lights.add(GX + 12, -10, 240, LT[3], 1, 0.6);
        for (let i = 0; i < 18; i++) rocks.push({ x: GX + 12 + R.range(-10, 10), y: -2, vx: R.range(-170, 170), vy: -R.range(120, 300), a: R.range(0, TAU), va: R.range(-10, 10), s: R.range(2, 5), age: 0 });
        for (let i = 0; i < 30; i++) { const a = R.range(-Math.PI, 0); ps.spawn(P.STREAK, GX + 12, -4, Math.cos(a) * R.range(100, 320), Math.sin(a) * R.range(100, 320), R.range(0.1, 0.3), R.chance(0.5) ? WHITE : LT[3]); }
      }
      for (const r of rocks) { r.vy += 520 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt; r.age += dt; if (r.y > -1 && r.vy > 0) { r.y = -1; r.vy *= -0.25; r.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the crater: a dark bowl with a raised broken rim
      if (t > SLAM) {
        const g = ease.outCubic(clamp((t - SLAM) / 0.2)), cx = GX + 12;
        p.ellipse(cx, 1, 34 * g, 5 * g, hex("#0a0810"));
        for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, x = cx + Math.cos(a) * 34 * g; drawChunk(p, x, -2 + Math.sin(a) * 3, 3 + rand(i, 4) * 2, i, ROCK); }
        for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; p.line(cx, 0, cx + Math.cos(a) * 60 * g, Math.sin(a) * 4 * g, hex("#120c18"), 1 - smooth(SLAM + 1.5, END, t)); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "kumo", t0: 0.04, t1: ARMOUR, label: "RAIKAGE", head: b.head });
      // the armour: a crackling skin of lightning over his outline, bolts jumping off his shoulders and back
      if (t > ARMOUR) {
        const k = smooth(ARMOUR, ARMOUR + 0.1, t);
        p.glow(b.chest[0], b.chest[1], 26, LT[2], 0.45 * k);
        for (let i = 0; i < 4; i++) {
          const a = rand(f, i) * TAU, L = 8 + 10 * rand(f, i + 7), sx = b.chest[0] + (rand(f, i + 3) - 0.5) * 10, sy = b.chest[1] + (rand(f, i + 5) - 0.5) * 22;
          bolt(p, sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L, f + i, LT, { jag: 0.35, seed: i, glow: 0 });
        }
        if (t < ARMOUR + 0.12) p.ring(b.chest[0], b.chest[1], 8 + 120 * (t - ARMOUR), 2, WHITE, 1 - (t - ARMOUR) / 0.12);
      }
      // the dash: a streak and three after-images
      if (t > DASH - 0.02 && t < GRAB + 0.2) {
        const k = 1 - smooth(GRAB, GRAB + 0.2, t);
        p.glowLine(4, -20, GX - 6, -20, 8, LT[3], 0.6 * k);
        p.beam(4, -20, GX - 6, -20, 2, WHITE, k);
        for (let i = 1; i <= 3; i++) drawFigure(p, RUSH, 4 + (GX - 10) * (i / 4), 0, { tint: LT[3], k: 0.8, a: 0.35 * k });
      }
      // at the top of the leap the lightning gathers round them both
      if (t > TOP - 0.2 && t < SLAM) {
        const k = smooth(TOP - 0.2, TOP, t);
        for (let i = 0; i < 3; i++) { const a = rand(f, i + 20) * TAU; bolt(p, b.head[0], b.head[1] - 6, b.head[0] + Math.cos(a) * 30, b.head[1] - 6 + Math.sin(a) * 30, f + 30 + i, LT, { jag: 0.3, seed: i + 9, glow: 0.3 * k }); }
        // a fall streak behind them on the way down
        if (t > TOP) p.beam(b.head[0], b.head[1] - 40, b.head[0], b.head[1] - 8, 6, LT[3], 0.4);
      }
      // the slam: a column of lightning from the crater, sparks, two frames of ink
      if (t > SLAM && t < SLAM + 0.7) {
        const u = (t - SLAM) / 0.7, k = 1 - u;
        p.glow(GX + 12, -30, 70, LT[3], 0.8 * k);
        for (let i = 0; i < 5; i++) bolt(p, GX + 12 + (rand(f, i) - 0.5) * 30, 0, GX + 12 + (rand(f, i + 9) - 0.5) * 40, -120 - rand(f, i + 3) * 60, f + i, LT, { jag: 0.22, seed: i, glow: 0.4 * k });
      }
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK, 1 - smooth(1.0, 1.6, r.age));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
