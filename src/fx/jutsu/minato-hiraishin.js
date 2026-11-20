// Hiraishin no Jutsu (Flying Thunder God, Minato). Narutopedia: a space-time ninjutsu; the user marks a target with a
// technique formula (Minato's three-pronged kunai carry it) and can teleport to any formula instantly, no seals. Here:
// the kunai thrown past the target sticks in the floor behind it, a yellow flash and he's gone, he lands at the kunai
// facing the other way with a Rasengan already in his hand, drives it into the target's back, and flashes home.
// New: the kunai with its formula tag, the yellow flash (silhouettes in light at both ends and a streak between), the
// body taken away for the jump (actorAlpha). From _lib: the Rasengan. From the library: the crit hit at the strike.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, bodyAt, drawFigure, drawRasengan } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const THROW = 0.55, FLIGHT = 0.26, STUCK = THROW + FLIGHT, JUMP = STUCK + 0.35, STRIKE = JUMP + 0.2, HOME = STRIKE + 0.8, TX = 140, KX = TX + 34;
const YEL = ["#5a3a06", "#c89010", "#ffd030", "#fff090", "#ffffff"];
const RAS = ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"];

export const meta = {
  name: "Flying thunder god",
  desc: "Minato: a three-pronged kunai with its formula thrown past the target, a yellow flash, and he's behind it with a Rasengan in hand, drives it into its back and flashes home.",
  tags: ["jutsu", "minato", "space-time", "teleport", "move", "melee", "one-shot"],
  size: [270, 140],
  origin: [50, 112],
  duration: HOME + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: YEL, seed: 28 },
};

// he's gone for two frames each way: the jump itself
export const actorAlpha = (t) => ((t >= JUMP && t < JUMP + 0.07) || (t >= HOME && t < HOME + 0.07) ? 0 : 1);

const WIND = { ...READY, crouch: 4, lean: -6, fx: -6, fy: -30, bx: 10, by: -22, ffx: 8, fbx: -8 };
const THROWN = { ...READY, crouch: 5, lean: 10, fx: 19, fy: -26, bx: -6, by: -20, ffx: 11, fbx: -9 };
const BEHIND = { ...READY, x: KX, yaw: Math.PI, crouch: 6, lean: 6, fx: 12, fy: -22, bx: 8, by: -26, ffx: 9, fbx: -9 };
const STAB = { ...BEHIND, x: KX - 4, crouch: 6, lean: 12, fx: 20, fy: -24, bx: -6, by: -20 };
export const act = {
  target: { x: TX },
  ghost: "#ffd030",
  poses: [
    [-0.25, READY],
    [THROW - 0.15, WIND, "out"],
    [THROW, THROWN, "snap"],
    [JUMP - 0.1, { ...READY, crouch: 3, fx: 10, fy: -24 }],
    [JUMP + 0.07, BEHIND, "snap"],
    [STRIKE - 0.04, { ...BEHIND, x: KX + 2, lean: 2 }],
    [STRIKE, STAB, "snap"],
    [HOME - 0.1, { ...STAB, x: KX + 2, lean: -2, fx: 12, fy: -24 }],
    [HOME + 0.07, READY, "snap"],
    [meta.duration, READY],
  ],
  hits: [
    { t: STRIKE, stop: 0.14, shake: 0.3, amp: 2, push: -4, straw: 26 },
    { t: STRIKE + 0.2, stop: 0.03, flash: 0, push: -1, straw: 8 },
  ],
  dust: [{ t: JUMP + 0.07, x: KX, n: 8 }, { t: HOME + 0.07, x: 0, n: 6 }],
};

// the kunai: three prongs, a ring on the pommel and the paper tag of the formula wound round the grip
function kunai(p, x, y, ang, tag) {
  const c = Math.cos(ang), s = Math.sin(ang), T = (a, b) => [x + c * a - s * b, y + s * a + c * b];
  const S = hex("#e8edf6"), D = hex("#68748f"), G = hex("#2a2230");
  p.poly([T(9, 0), T(3, 1.6), T(3, -1.6)], S);
  p.poly([T(4, 1), T(1, 4.5), T(2.5, 1)], D);
  p.poly([T(4, -1), T(1, -4.5), T(2.5, -1)], D);
  p.line(...T(2, 0), ...T(-4, 0), G);
  p.circle(...T(-5.5, 0), 1.2, D);
  if (tag) {
    p.line(...T(-1, 1), ...T(-3, 3.5), hex("#fff3c8"));
    p.px(...T(-2, 2.5), hex("#c3202a"));
  }
}

export const create = play([{ fx: crit, t: STRIKE, x: TX + 12, flip: true, height: 24, aim: 0.05, palette: ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff", "#ffffff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), RC = RAS.map(hex);
  let j1 = false, j2 = false;
  const flash = (p, t, t0, x, face, q) => {
    const a = t - t0;
    if (a < 0 || a > 0.3) return;
    const k = 1 - a / 0.3;
    drawFigure(p, q, x, 0, { face, solid: a < 0.07 ? WHITE : hex(YEL[2]), a: k });
    p.glow(x, -20, 40, hex(YEL[2]), 0.8 * k);
  };
  return {
    update(t, dt) {
      if (!j1 && t >= JUMP) {
        j1 = true;
        lights.add(KX, -20, 70, hex(YEL[2]), 1, 0.2);
        for (let i = 0; i < 20; i++) ps.spawn(P.SPARK, KX + R.range(-6, 6), -R.range(4, 36), R.range(-90, 90), -R.range(10, 90), R.range(0.15, 0.35), R.chance(0.5) ? WHITE : hex(YEL[2]));
      }
      if (!j2 && t >= HOME) {
        j2 = true;
        lights.add(0, -20, 60, hex(YEL[2]), 0.8, 0.2);
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "hiraishin", t0: 0.05, t1: THROW - 0.1, label: "HIRAISHIN", head: b.head });
      // the kunai: thrown in a flat arc, spinning once, and stuck slanting in the floor behind the target
      if (t >= THROW && t < HOME + 0.6) {
        const u = clamp((t - THROW) / FLIGHT), x = 18 + (KX + 6 - 18) * u, y = -26 + (-3 + 26) * ease.inQuad(u) - Math.sin(Math.PI * u) * 10;
        kunai(p, x, y, u < 1 ? 0.3 + u * 0.6 : 0.95, true);
        if (u < 1) p.line(x - 10, y - 1, x - 22, y - 3, hex(YEL[3]), 0.6);
        // the formula, written round where it stuck
        if (u >= 1) {
          const k = clamp((t - STUCK) / 0.15);
          p.ellipse(KX + 6, 0, 8 * k, 1.5 * k, hex(YEL[1]), 0.6);
        }
      }
      // the jump: a flash of him in light where he was and where he lands, and a streak of it between
      flash(p, t, JUMP, 0, 1, { ...READY, crouch: 3, fx: 10, fy: -24 });
      flash(p, t, JUMP, KX, -1, BEHIND);
      flash(p, t, HOME, KX + 2, -1, { ...STAB, lean: -2, fx: 12, fy: -24 });
      flash(p, t, HOME, 0, 1, READY);
      for (const [t0, a, z] of [[JUMP, 0, KX], [HOME, KX, 0]]) {
        const d = t - t0;
        if (d >= 0 && d < 0.12) {
          const k = 1 - d / 0.12;
          p.beam(a, -18, z, -18, 3 * k + 1, hex(YEL[3]), k);
          p.glowLine(a, -18, z, -18, 14, hex(YEL[2]), 0.6 * k);
        }
      }
      // the Rasengan he lands with, in the hand that strikes
      if (t >= JUMP + 0.07 && t < STRIKE + 0.35) {
        const g = t > STRIKE ? 1 + 0.4 * smooth(STRIKE, STRIKE + 0.35, t) : 1;
        drawRasengan(p, b.handN[0] - 2, b.handN[1] - 2, 6 * g, t, RC, t > STRIKE + 0.25 ? 1 - smooth(STRIKE + 0.25, STRIKE + 0.35, t) : 1);
      }
      if (t > STRIKE && t < STRIKE + 0.45) {
        const a = t - STRIKE, u = a / 0.45;
        for (let i = 0; i < 4; i++) {
          const a0 = a * 10 + (i * TAU) / 4;
          if (u < 0.8) p.arc(TX + 8, -24, 6 + 30 * ease.outCubic(u), 1, a0, a0 + 1.1, i % 2 ? RC[3] : WHITE);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
