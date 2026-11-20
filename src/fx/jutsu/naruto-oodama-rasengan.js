// Oodama Rasengan (Big Ball Rasengan, Naruto). Narutopedia: the same spinning chakra compressed in the palm, only far
// more of it, so it lets everything go the instant it touches. Here: the clone seal, a clone stirs a ball as big as a
// body between the two of them, Naruto runs, leaps and drives it down into the target, and it balloons into a dome.
// New: the held ball and the dome it swells into (both _lib drawRasengan, the dome at many times the size). From the
// library: the ground slam for the crater and its cracks.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, WHITE, TAU } from "../../core/index.js";
import * as slam from "../impacts/ground-slam.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof, drawRasengan } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["juuji"], 0.12, { hold: 0.3 });
const POOF = SEALS.end + 0.02, FORM = POOF + 0.1, FORMED = FORM + 0.95, GONE = FORMED + 0.05, RUN = GONE + 0.1, LEAP = RUN + 0.28, HIT = LEAP + 0.32, BURST = HIT + 0.3, TX = 150, CX = 48;
const RAS = ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"];

export const meta = {
  name: "Big ball Rasengan",
  desc: "Naruto: a clone stirs a Rasengan as big as a body between them, Naruto leaps and drives it down into the target, and it swells into a dome that grinds the ground into a crater.",
  tags: ["jutsu", "naruto", "rasengan", "move", "melee", "aoe", "one-shot"],
  size: [326, 224],
  origin: [56, 186],
  duration: BURST + 3.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: RAS, seed: 22 },
};

const HOLD = { ...READY, crouch: 6, lean: 4, armsFront: true, fx: 10, fy: -25, bx: 11, by: -29, ffx: 9, fbx: -8 };
const RUNP = { ...HOLD, x: TX - 92, crouch: 8, lean: 12, ffx: 11, fbx: -11, ghost: true };
const AIR = { ...HOLD, x: TX - 58, y: -34, crouch: 1, lean: 4, fx: 11, fy: -30, bx: 12, by: -33, ffx: 4, ffy: -8, fbx: -6, fby: -2 };
const SLAM = { ...HOLD, x: TX - 40, y: -10, crouch: 4, lean: 18, fx: 15, fy: -21, bx: 15, by: -24, ffx: -4, ffy: -6, fbx: -10, fby: -2 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [POOF + 0.12, HOLD],
    [FORMED, { ...HOLD, crouch: 8 }],
    [RUN, { ...HOLD, crouch: 9, lean: 8 }, "snap"],
    [LEAP, RUNP, "in"],
    [LEAP + 0.16, AIR, "out"],
    [HIT, SLAM, "in"],
    [BURST, { ...SLAM, y: -6 }],
    [BURST + 0.25, { ...READY, x: TX - 62, crouch: 8, lean: -6, fx: 6, fy: -26, bx: -6, by: -24 }, "out"],
    [BURST + 1.1, { ...READY, x: TX - 62 }],
    [meta.duration, { ...READY, x: TX - 62 }],
  ],
  hits: [
    { t: HIT, stop: 0.12, shake: 0.2, amp: 2, push: 1.2, straw: 12 },
    { t: HIT + 0.15, stop: 0.03, flash: 0, push: 0.8, straw: 8 },
    { t: BURST, stop: 0.2, shake: 0.5, amp: 4, push: 5, straw: 40 },
  ],
  dust: [{ t: RUN + 0.02, x: -2, n: 6, dir: -1 }, { t: LEAP, x: TX - 92, n: 8, dir: -1 }, { t: BURST + 0.25, x: TX - 62, n: 8, dir: -1 }],
};

// where the ball sits: in front of both hands, a body wide
const R0 = 12;
const ballAt = (t) => {
  const b = bodyAt(act.poses, t);
  return [b.handN[0] + R0 - 1, b.handN[1] - 3];
};

export const create = play([{ fx: slam, t: BURST, x: TX - 8, reach: 120, light: 0.8 }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let burst = false, bx0 = 0, by0 = 0;
  return {
    update(t, dt) {
      const [bx, by] = ballAt(t);
      if (t > FORM && t < FORMED && R.chance(90 * dt)) {
        const a = R.range(0, TAU), d = R.range(16, 30), T = R.range(0.14, 0.22), v = (d * 3) / (Math.exp(3 * T) - 1);
        ps.spawn(P.STREAK, bx + Math.cos(a) * d, by + Math.sin(a) * d, -Math.cos(a) * v + Math.sin(a) * 50, -Math.sin(a) * v - Math.cos(a) * 50, T, R.chance(0.5) ? hex(RAS[3]) : WHITE);
      }
      if (t > HIT && t < BURST && R.chance(120 * dt)) {
        const a = R.range(0, TAU), s = R.range(80, 200);
        ps.spawn(P.SPARK, bx, by + 6, Math.cos(a) * s, Math.sin(a) * s - 50, R.range(0.15, 0.35), R.chance(0.5) ? WHITE : hex(RAS[3]));
      }
      if (!burst && t >= BURST) {
        burst = true;
        [bx0, by0] = [bx, by];
        lights.add(bx, by, 100, hex(RAS[3]), 0.6, 0.3);
        // the ground it tears up: chunks of rock and soil thrown high
        for (let j = 0; j < 34; j++) ps.spawn(P.GRIT, bx + R.range(-30, 30), -1, R.range(-160, 160), -R.range(120, 320), R.range(0.8, 1.5), hex(["#3a3048", "#5a4c66", "#7a6a80"][j % 3]), R.chance(0.4) ? 2 : 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      // the crater it leaves, glowing for a moment
      if (t > BURST) {
        const k = 1 - smooth(0.6, 2, t - BURST);
        p.ellipse(bx0, 0.5, 44 * smooth(0, 0.3, t - BURST), 3, hex("#120c18"), 0.9 * k);
        p.ellipse(bx0, 0, 36 * smooth(0, 0.3, t - BURST), 1.4, C[3], 0.6 * k * (1 - smooth(0.2, 0.9, t - BURST)));
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "uzumaki", t0: 0.05, t1: POOF + 0.1, label: "UZUMAKI", head: b.head });
      const [bx, by] = ballAt(t);
      if (t > POOF + 0.06 && t < GONE) {
        const w = (t - FORM) * 15, s = t > FORM ? 4 : 0, lx = CX - (bx + R0 - 2);
        const q = { ...READY, crouch: 6, lean: 8, armsFront: true, fx: lx + Math.cos(w) * s, fy: by + Math.sin(w) * s, bx: lx - Math.cos(w) * s + 1, by: by - Math.sin(w) * s - 5, ffx: 9, fbx: -7 };
        drawFigure(p, q, CX, 0, { face: -1 });
      }
      drawPoof(p, CX, -18, t - POOF, 1.2, 4);
      drawPoof(p, CX, -18, t - GONE, 1.2, 8);
      const k = t < FORM ? 0 : t < FORMED ? ease.inOutCubic((t - FORM) / (FORMED - FORM)) : 1;
      if (t < BURST) drawRasengan(p, bx, by, R0 * (t > HIT ? 1 + 0.2 * smooth(HIT, BURST, t) : 1), t, C, k);
      else {
        // the dome: the ball let go at many times its size, then thinning into rings and a last flash of wind
        const a = t - BURST, u = clamp(a / 0.5), Rd = R0 + 48 * ease.outCubic(u);
        if (a < 0.04) p.circle(bx0, by0, Rd + 4, WHITE);
        else if (u < 1) drawRasengan(p, bx0, by0 - 6 * u, Rd, t, C, 1 - smooth(0.55, 1, u));
        if (a < 0.9) for (let i = 0; i < 3; i++) {
          const v = clamp((a - i * 0.12) / 0.6);
          if (v > 0 && v < 0.85) p.ring(bx0, by0, Rd + 6 + i * 9 + 20 * v, 1, i ? C[3] : WHITE);
        }
        p.glow(bx0, by0, 80, C[3], 0.35 * (1 - smooth(0.1, 0.9, a)));
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
