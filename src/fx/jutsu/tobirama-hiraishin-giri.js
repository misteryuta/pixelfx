// Hiraishin Giri (Flying Thunder God Slash, Tobirama, the Second Hokage). Narutopedia: he marks a foe by touch, moves
// to the mark and cuts in the same instant, faster than the eye; he invented the Flying Thunder God. Here: he flicks
// one marked kunai high over the target; it hangs at the top of its arc; a blue-white flash, he is up there with it,
// catches it and comes down across the target in one stroke; a second flash, he is behind it, low, the blade already
// through. A beat of silence, blade flicked clean, and only then both cuts open at once: a white X across the target,
// a blast of air off it, the floor split along the line of the second stroke.
// New: the hanging kunai, the double flash, the delayed X cut. From the library: crit hit.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, bodyAt, arcPath } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 150, THROW = 0.4, APEX = 0.85, F1 = 0.95, CUT1 = 1.04, F2 = 1.2, CUT2 = 1.26, STILL = 1.3, OPEN = 2.0, END = 3.4;
const BLUE = ["#08142a", "#1a3c70", "#3a78c8", "#9ad0ff", "#eef8ff"];
const AIR = [TX - 6, -78];

export const meta = {
  name: "Flying thunder god slash",
  desc: "Tobirama: one marked kunai flicked high over the target; a flash and he is up with it, comes down across the target, a second flash and he is behind it low, blade through. A beat of silence, then both cuts open at once in a white X.",
  tags: ["jutsu", "tobirama", "hiraishin", "teleport", "slash", "melee", "one-shot"],
  size: [300, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: BLUE, seed: 23 },
};

const FLICK = { ...READY, crouch: 3, lean: 2, fx: 14, fy: -40, bx: -4, by: -22, ffx: 8, fbx: -8 };
const DOWN = { ...READY, x: AIR[0] - 2, y: -44, crouch: 0, lean: 18, fx: 22, fy: -18, bx: -10, by: -30, ffx: 6, ffy: -10, fbx: -8, fby: -14, gait: false };
const LOW = { ...READY, x: TX + 34, face: -1, crouch: 12, lean: 14, fx: 26, fy: -14, bx: -12, by: -24, ffx: 14, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#9ad0ff",
  poses: [
    [-0.25, READY],
    [THROW - 0.12, { ...READY, crouch: 5, fx: -6, fy: -20, bx: 8, by: -24 }, "out"],
    [THROW, FLICK, "snap"],
    [F1 - 0.02, { ...READY, crouch: 6, lean: 4, fx: 4, fy: -24, bx: 6, by: -24 }],
    [F1 + 0.04, { ...DOWN, lean: 4, fx: -6, fy: -40, y: -60 }, "snap"],
    [CUT1, DOWN, "snap"],
    [F2 - 0.01, { ...DOWN, y: -20 }],
    [CUT2, LOW, "snap"],
    [OPEN - 0.25, { ...LOW, crouch: 10 }],
    [OPEN - 0.1, { ...LOW, crouch: 6, lean: 4, fx: 20, fy: -10, bx: 6, by: -22 }, "out"],
    [END, { ...READY, x: TX + 34, face: -1, gait: false }],
  ],
  hits: [
    { t: THROW, target: false, sfx: "whoosh" },
    { t: F1, stop: 0.04, target: false, sfx: "whoosh" },
    { t: CUT1, stop: 0.05, shake: 0.1, amp: 1, push: 0.5, straw: 4, flash: 0.02 },
    { t: CUT2, stop: 0.08, shake: 0.12, amp: 1, push: 0.5, straw: 4, flash: 0.02, sfx: "whoosh" },
    { t: OPEN, stop: 0.22, shake: 0.6, amp: 5, push: -7, straw: 60, flash: 0.12, skin: "red", shiver: 0.6, sfx: "heavy" },
    { t: OPEN + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: CUT2, x: TX + 34, n: 10, dir: 1 }, { t: OPEN, x: TX, n: 20, dir: -1 }],
};
// gone between each flash and where he lands
export const actorAlpha = (t) => ((t >= F1 - 0.02 && t < F1 + 0.04) || (t >= F2 - 0.01 && t < CUT2) ? 0 : 1);
// the cut opens: the top half of the target lurches one way, the bottom the other, then it settles back together
export const targetState = (t) => {
  if (t < OPEN) return null;
  const u = clamp((t - OPEN) / 0.7), k = Math.sin(Math.PI * u) * (1 - u * 0.5);
  return { dx: -10 * k, dy: -4 * k, rot: -0.35 * k };
};

function kunai(p, x, y, a, k = 1) {
  const c = Math.cos(a), s = Math.sin(a), at = (i, j) => [x + c * i - s * j, y + s * i + c * j];
  p.poly([at(6, 0), at(1.5, -1.5), at(1.5, 1.5)], hex("#e8edf6"), k);
  p.beam(...at(1, 0), ...at(-3.5, 0), 1.3, hex("#2a2230"), k);
  p.ring(...at(-4.6, 0), 1, 1, hex("#e8edf6"), k);
  p.line(...at(-1, 0.6), ...at(-2.5, 4), hex("#f3ecd2"), k);
}

export const create = play([{ fx: crit, t: OPEN, x: TX - 2, height: 26, aim: 0, palette: ["#08142a", "#1a3c70", "#3a78c8", "#9ad0ff", "#eef8ff", "#ffffff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const up = arcPath(14, -38, AIR[0], AIR[1], 14);
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  return {
    update(t, dt) {
      if (t >= F1) once("f1", () => lights.add(AIR[0], AIR[1], 100, C[3], 1, 0.2));
      if (t >= CUT2) once("f2", () => lights.add(TX + 34, -20, 100, C[3], 1, 0.2));
      if (t >= OPEN) once("o", () => {
        lights.add(TX, -26, 220, C[4], 1, 0.5);
        for (let i = 0; i < 30; i++) {
          const a = R.range(0, TAU), s = R.range(80, 300);
          ps.spawn(P.STREAK, TX, -26, Math.cos(a) * s, Math.sin(a) * s * 0.6, R.range(0.1, 0.3), R.chance(0.6) ? WHITE : C[3]);
        }
        for (let i = 0; i < 14; i++) ps.spawn(P.GRIT, TX + R.range(-30, 40), -1, R.range(-60, 60), -R.range(60, 180), R.range(0.4, 0.8), hex(["#3a3048", "#5a4c66"][R.int(0, 1)]));
      });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the floor split along the second stroke, glowing once the cut opens
      if (t > CUT2) {
        const k = 1 - smooth(OPEN + 0.6, END, t), o = t > OPEN ? 1 : 0.35;
        p.line(TX - 40, 0, TX + 34, 0, hex("#0c0810"), k);
        if (t > OPEN) p.line(TX - 40, -1, TX + 34, -1, C[3], k * (1 - smooth(OPEN, OPEN + 0.6, t)));
        void o;
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "hiraishin", t0: 0.04, t1: THROW - 0.04, label: "NIDAIME", head: b.head });
      // the kunai: flicked up, hanging at the top of its arc turning slowly, caught
      if (t > THROW && t < F1 + 0.04) {
        const u = clamp((t - THROW) / (APEX - THROW)), q = up(ease.outCubic(u));
        kunai(p, q.x, q.y, t < APEX ? t * 22 : APEX * 22 + (t - APEX) * 3);
        if (t > APEX) p.glow(q.x, q.y, 12, C[3], 0.6 + 0.3 * Math.sin(t * 40));
      }
      if (t > F1 + 0.04 && t < OPEN) kunai(p, b.handN[0], b.handN[1], t < CUT2 ? 1.0 : Math.PI - 0.4);
      // the flashes: blue-white, a vertical slit of light and a ring
      const flash = (x, y, age) => {
        if (age < 0 || age > 0.3) return;
        const u = age / 0.3;
        p.glow(x, y, 34 * (1 - u) + 8, C[3], 0.8 * (1 - u));
        if (u < 0.3) p.ellipse(x, y, 3, 20 * (1 - u), WHITE);
        p.ring(x, y, 3 + 22 * ease.outCubic(u), 1, u < 0.3 ? WHITE : C[3], 1 - u);
      };
      flash(10, -22, t - (F1 - 0.02));
      flash(AIR[0], AIR[1] + 10, t - F1);
      flash(AIR[0], -40, t - (F2 - 0.01));
      flash(TX + 34, -18, t - CUT2 + 0.02);
      // the strokes as they happen: thin, almost invisible, already gone; the silence after
      const stroke = (x0, y0, x1, y1, at) => {
        const age = t - at;
        if (age < 0 || age > 0.12) return;
        p.line(x0, y0, x1, y1, WHITE, 1 - age / 0.12);
      };
      stroke(TX - 18, -46, TX + 16, -6, CUT1);
      stroke(TX - 40, -16, TX + 34, -32, CUT2);
      // the X opening: two white cuts across the target, widening, with a blast of air off each
      if (t > OPEN && t < OPEN + 0.9) {
        const u = (t - OPEN) / 0.9, w = 3 * (1 - u) + 0.5, L = 1 + 0.5 * ease.outCubic(Math.min(1, u * 3));
        for (const [x0, y0, x1, y1] of [[TX - 18, -46, TX + 16, -6], [TX - 40, -16, TX + 34, -32]]) {
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = ((x1 - x0) / 2) * L, hy = ((y1 - y0) / 2) * L;
          p.glowLine(cx - hx, cy - hy, cx + hx, cy + hy, 10, C[3], 0.7 * (1 - u));
          p.beam(cx - hx, cy - hy, cx + hx, cy + hy, w + 1, C[3], 1 - u);
          p.beam(cx - hx, cy - hy, cx + hx, cy + hy, w, WHITE, 1 - u);
        }
        p.ellipse(TX, -26, 8 + 60 * ease.outCubic(u), 4 + 26 * ease.outCubic(u), (d) => (d > 0.86 ? WHITE : 0), 1 - u);
      }
      // the blade flicked clean in the silence
      if (t > OPEN - 0.25 && t < OPEN - 0.05) p.arc(b.handN[0], b.handN[1], 8, 1, -2.4, -0.6, WHITE, 0.6);
      void f;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
