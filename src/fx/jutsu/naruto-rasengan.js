// Rasengan (Naruto). Narutopedia: a spinning ball of chakra, no hand seals, made by turning the chakra in several
// directions at once and holding it in a shell; Naruto, who can't do the shape and the spin alone, has a shadow clone
// stir it over his palm. Here: the clone seal, a clone poofs in beside him and churns the ball into being, bursts, and
// Naruto runs it into the target: it grinds into the chest and blows out in a spiral.
// New: the ball (_lib drawRasengan), the clone and his stirring hands (drawFigure, a posed second body), the grind and
// the spiral burst.
// Rework (2026-11-23): on contact the camera cuts in close as the ball grinds in, the target twisting with the spiral;
// the burst throws it away spinning, it crashes down, bounces and skids; a spiral scar is left burned into the ground. From the library: the crit hit, recolored, where the ball meets the target.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof, drawRasengan } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const SEALS = sealRun(0.05, ["juuji"], 0.12, { hold: 0.32 });
const POOF = SEALS.end + 0.02, FORM = POOF + 0.12, FORMED = FORM + 0.7, GONE = FORMED + 0.06, RUN = GONE + 0.12, HIT = RUN + 0.3, BURST = HIT + 0.42, TX = 136, CX = 33;
const RAS = ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"];

export const meta = {
  name: "Rasengan",
  desc: "Naruto: the clone seal, a shadow clone poofs in and stirs a ball of chakra over his palm, then he runs it into the target, where it grinds in and bursts in a spiral.",
  tags: ["jutsu", "naruto", "rasengan", "move", "melee", "one-shot"],
  size: [340, 170],
  origin: [56, 134],
  duration: BURST + 2.0,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: RAS, seed: 21 },
};

const HOLD = { ...READY, crouch: 4, lean: 2, fx: 14, fy: -20, bx: 10, by: -27, ffx: 7, fbx: -7 };
const DASH = { ...READY, x: TX - 30, crouch: 7, lean: 12, fx: 16, fy: -21, bx: -7, by: -20, ffx: 11, fbx: -11, ghost: true };
const PUSH = { ...READY, x: TX - 29, crouch: 6, lean: 10, fx: 18, fy: -23, bx: -9, by: -19, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [POOF + 0.1, HOLD],
    [FORMED, { ...HOLD, crouch: 5 }],
    [RUN, { ...HOLD, lean: 6, crouch: 6 }, "snap"],
    [HIT, DASH, "in"],
    [HIT + 0.02, PUSH, "snap"],
    [BURST, { ...PUSH, fx: 19, lean: 12 }],
    [BURST + 0.12, { ...PUSH, x: TX - 34, lean: -2, crouch: 4, fx: 12, fy: -24, bx: -6, by: -22 }, "out"],
    [BURST + 0.9, { ...READY, x: TX - 36 }],
    [meta.duration, { ...READY, x: TX - 36 }],
  ],
  hits: [
    { t: RUN, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.12, shake: 0.25, amp: 2, push: 0, straw: 12, sfx: "heavy" },
    { t: HIT + 0.14, stop: 0.03, flash: 0, push: 0, straw: 8 },
    { t: HIT + 0.28, stop: 0.03, flash: 0, push: 0, straw: 8 },
    { t: BURST, stop: 0.18, shake: 0.6, amp: 4, push: 0, straw: 40, skin: "shock", sfx: "explosion" },
    { t: BURST + (2 * 150) / 700, shake: 0.3, amp: 2, target: false, sfx: "heavy" },
    { t: BURST + (2 * 150) / 700 + (2 * 45) / 700, target: false, sfx: "land" },
    { t: BURST + 1.7, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RUN + 0.02, x: -2, n: 6, dir: -1 }, { t: HIT, x: TX - 30, n: 8 }],
};

// the target: driven back and twisted while the ball grinds in, then thrown away spinning, a bounce, a skid
const G = 700, V0 = [210, -150], T1 = (2 * -V0[1]) / G, X1 = V0[0] * T1, VB = -V0[1] * 0.3, T2 = (2 * VB) / G, VX2 = V0[0] * 0.4, SK = 0.3;
const flyAt = (a) => {
  if (a < T1) return { x: V0[0] * a, y: V0[1] * a + 0.5 * G * a * a, rot: -a * 16 };
  const b = a - T1;
  if (b < T2) return { x: X1 + VX2 * b, y: -VB * b + 0.5 * G * b * b, rot: -T1 * 16 - b * 6 };
  const c = Math.min(1, (b - T2) / SK);
  return { x: X1 + VX2 * T2 + VX2 * 0.5 * SK * (1 - (1 - c) * (1 - c)), y: 0, rot: -Math.PI / 2 };
};
export const targetState = (t) => {
  if (t < HIT) return null;
  if (t < BURST) { const u = smooth(HIT, BURST, t); return { dx: 7 * u, dy: 0, rot: 0.25 * u + Math.sin(t * 60) * 0.04 * u }; }
  const f = flyAt(t - BURST); return { dx: 7 + f.x, dy: f.y, rot: 0.25 + f.rot };
};
const LAND1 = BURST + T1, LAND2 = BURST + T1 + T2, REST = 7 + flyAt(9).x;
// the camera: on him and the clone; in on the ball as it forms; with him on the run; a hard cut in close on the
// grind; a cut wide as it bursts, after the flying target; held where it lies
export const camera = cineCam([
  [0, { z: 1.6, x: 14, y: -30 }],
  [FORM, { z: 1.9, x: 24, y: -30, r: -2 }],
  [FORMED, { z: 2.3, x: 26, y: -28, r: -3 }],
  [RUN, { z: 1.5, x: 40, y: -32, r: 0 }, "cut"],
  [HIT - 0.01, { z: 1.4, x: TX - 40, y: -32, r: 2 }],
  [HIT, { z: 2.5, x: TX - 14, y: -26, r: 5, shake: 0.5 }, "cut"],
  [BURST - 0.01, { z: 2.8, x: TX - 12, y: -26, r: 6, shake: 0.7 }],
  [BURST, { z: 1.15, x: TX + 40, y: -40, r: -2, shake: 1.1 }, "cut"],
  [LAND2 + 0.2, { z: 1.2, x: TX + REST - 30, y: -36, r: 0, shake: 0 }],
  [BURST + 2.0, { z: 1.05, x: TX + 20, y: -44 }],
]);

export const create = play([{ fx: crit, t: HIT, x: TX - 12, height: 23, aim: 0.05, palette: ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff", "#ffffff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let burst = false;
  const landed = {};
  // where the ball sits: just over the palm of the near hand
  const ball = (t) => {
    const b = bodyAt(act.poses, t);
    return [b.handN[0] + 2, b.handN[1] - 3];
  };
  return {
    update(t, dt) {
      const [bx, by] = ball(t);
      // while it forms: wisps of chakra drawn in from all round and spun into it
      if (t > FORM && t < FORMED && R.chance(60 * dt)) {
        const a = R.range(0, TAU), d = R.range(10, 22), T = R.range(0.12, 0.2), v = (d * 3) / (Math.exp(3 * T) - 1);
        ps.spawn(P.STREAK, bx + Math.cos(a) * d, by + Math.sin(a) * d, -Math.cos(a) * v + Math.sin(a) * 40, -Math.sin(a) * v - Math.cos(a) * 40, T, R.chance(0.5) ? hex(RAS[3]) : WHITE);
      }
      // the grind: sparks and torn chakra spraying off the contact
      if (t > HIT && t < BURST && R.chance(90 * dt)) {
        const a = R.range(-2.6, 2.6) + Math.PI, s = R.range(60, 170);
        ps.spawn(P.SPARK, bx + 3, by, Math.cos(a) * s, Math.sin(a) * s - 30, R.range(0.12, 0.3), R.chance(0.6) ? WHITE : hex(RAS[3]));
      }
      for (const [k, T] of [["l1", LAND1], ["l2", LAND2]]) if (t >= T && !landed[k]) {
        landed[k] = 1;
        const x = TX + 7 + flyAt(T - BURST + 0.001).x;
        for (let j = 0; j < (k === "l1" ? 22 : 12); j++) ps.spawn(P.DUST, x + R.range(-6, 6), -1, R.range(-50, 110), -R.range(10, 50), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
      }
      if (!burst && t >= BURST) {
        burst = true;
        lights.add(bx + 6, by, 90, hex(RAS[3]), 1, 0.25);
        for (let j = 0; j < 40; j++) {
          const a = R.range(0, TAU), s = R.range(80, 260);
          ps.spawn(P.SPARK, bx + 6, by, Math.cos(a) * s + 60, Math.sin(a) * s - 40, R.range(0.2, 0.55), j % 3 ? hex(RAS[3]) : WHITE);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the spiral scar burned into the ground under the burst
      if (t >= BURST) {
        const k = ease.outCubic(clamp((t - BURST) / 0.25)), cx = TX - 4;
        p.ellipse(cx, 1, 26 * k, 3 * k, hex("#0e1a2a"), 0.8);
        for (let i = 0; i < 3; i++) for (let a = 0; a < 4.5; a += 0.15) { const r = (4 + a * 5) * k, x = cx + Math.cos(a + i * 2.1) * r, y = 1 + Math.sin(a + i * 2.1) * r * 0.12; p.px(x, y, i ? hex(RAS[1]) : hex(RAS[2])); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      if (t > RUN && t < BURST + 0.3) p.text("RASENGAN!", TX - 40, -62, hex(RAS[4]), { font: "mini", align: "center", outline: hex(RAS[0]), a: smooth(RUN, RUN + 0.08, t) * (1 - smooth(BURST + 0.1, BURST + 0.3, t)) });
      // the run: speed lines streaming back off him
      if (t > RUN && t < HIT) { const bb = bodyAt(act.poses, t); for (let i = 0; i < 6; i++) { const y = -8 - i * 6, x = bb.chest[0] - 8; p.line(x, y, x - 18 - (i % 3) * 8, y, WHITE, 0.45); } }
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "uzumaki", t0: 0.05, t1: POOF + 0.1, label: "UZUMAKI", head: b.head });
      const [bx, by] = ball(t);
      // the shadow clone: poofs in facing him, churns the ball with both hands, poofs out once it holds
      if (t > POOF + 0.06 && t < GONE) {
        const w = (t - FORM) * 22, s = t > FORM ? 3.2 : 0;
        const lx = CX - bx, q = { ...READY, crouch: 5, lean: 6, armsFront: true, fx: lx + Math.cos(w) * s, fy: by + Math.sin(w) * s * 0.8, bx: lx - Math.cos(w) * s, by: by - Math.sin(w) * s * 0.8 - 2, ffx: 8, fbx: -6 };
        drawFigure(p, q, CX, 0, { face: -1 });
      }
      drawPoof(p, CX, -18, t - POOF, 1.1, 3);
      drawPoof(p, CX, -18, t - GONE, 1.1, 7);
      // the ball: grows under the clone's hands, rides the palm on the run, grinds and bursts
      const k = t < FORM ? 0 : t < FORMED ? ease.outCubic((t - FORM) / (FORMED - FORM)) : 1;
      if (t < BURST) {
        const grind = t > HIT ? 1 + 0.25 * smooth(HIT, BURST, t) : 1;
        drawRasengan(p, bx, by, 7 * grind, t, C, k);
        if (t > HIT) {
          // the spiral it drives into the target
          for (let i = 0; i < 4; i++) {
            const a0 = t * 24 + (i * TAU) / 4, r0 = 8 + i * 2.5;
            p.arc(bx + 2, by, r0, 1, a0, a0 + 1.4, i % 2 ? WHITE : C[3], 0.8);
          }
          p.glow(bx + 4, by, 30, C[3], 0.5);
        }
      } else {
        // the burst: a flash, spiral arms flung out, rings racing over the ground
        const a = t - BURST, u = clamp(a / 0.55);
        if (a < 0.06) p.circle(bx + 6, by, 18, WHITE);
        for (let i = 0; i < 5; i++) {
          const a0 = a * 9 + (i * TAU) / 5;
          for (let s = 0; s < 3; s++) {
            const r0 = 6 + 34 * ease.outCubic(u) + s * 5, a1 = a0 + s * 0.5;
            if (u < 0.8 - s * 0.15) p.arc(bx + 6, by, r0, 1, a1, a1 + 0.9, s ? C[3] : WHITE);
          }
        }
        if (u < 0.7) p.ring(bx + 6, by, 4 + 46 * ease.outCubic(u), u < 0.35 ? 2 : 1, u < 0.35 ? WHITE : C[4]);
        p.ellipse(bx + 6, 0, 10 + 50 * ease.outCubic(u), 2, C[3], 0.6 * (1 - u));
        p.glow(bx + 6, by, 60, C[3], 0.8 * (1 - u));
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
