// Konoha Senpuu (Leaf Whirlwind, Rock Lee). Narutopedia: a series of high and low kicks too fast even for the
// Sharingan to follow; against Sasuke, Lee opens with a spinning high kick off his left foot whose turn carries straight
// into a low sweep with the right; the first is meant to be blocked, the second lands. Here: his salute and fighting
// stance, a dash, the spinning high kick whipping a ring of wind and leaves round him, the turn carried on into the low
// sweep that takes the target's legs, and a gust of leaves behind it.
// New: the spin (yaw on the rig), the wind arcs of each kick, the whirl of leaves. From the library: the hit spark.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const POSE = 0.1, DASH = 0.65, K1 = DASH + 0.22, K2 = K1 + 0.2, END = K2 + 1.2, TX = 150;
const LEAF = ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"].map(hex), WIND = ["#a4d8c2", "#d8f4e8", "#ffffff"].map(hex);

export const meta = {
  name: "Leaf whirlwind",
  desc: "Rock Lee: his stance, a dash, a spinning high kick whipping a ring of wind and leaves round him, the turn carried on into a low sweep that takes the target's legs, and a gust of leaves behind it.",
  tags: ["jutsu", "lee", "taijutsu", "melee", "combo", "one-shot"],
  size: [250, 140],
  origin: [50, 112],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"], seed: 52 },
};

const STANCE = { ...READY, crouch: 6, lean: 4, fx: 15, fy: -24, bx: -8, by: -20, ffx: 12, fbx: -10 };
const RUN = { ...STANCE, x: TX - 40, crouch: 8, lean: 14, ghost: true };
const HIGH = { ...READY, x: TX - 30, crouch: 1, lean: -10, yaw: -Math.PI * 1.1, fx: -6, fy: -30, bx: 8, by: -32, ffx: 20, ffy: -32, fbx: -4 };
const LOWK = { ...READY, x: TX - 28, crouch: 14, lean: 10, yaw: -Math.PI * 2, fx: 6, fy: -10, bx: -4, by: -12, ffx: 22, ffy: -2, fbx: -10 };
export const act = {
  target: { x: TX },
  ghost: "#6cb83a",
  poses: [
    [-0.25, READY],
    [POSE, { ...READY, crouch: 2, fx: 4, fy: -30, bx: -6, by: -20 }, "out"],
    [POSE + 0.35, STANCE, "out"],
    [DASH, { ...STANCE, crouch: 7 }],
    [K1 - 0.08, RUN, "in"],
    [K1, HIGH, "out"],
    [K2, LOWK, "out"],
    [K2 + 0.4, { ...LOWK, yaw: -Math.PI * 2, crouch: 10, ffx: 12, ffy: 0 }],
    [END - 0.3, { ...STANCE, x: TX - 30 }],
    [END, { ...STANCE, x: TX - 30 }],
  ],
  hits: [
    { t: K1, stop: 0.06, shake: 0.1, amp: 1, push: 1.2, straw: 8, flash: 0 },
    { t: K2, stop: 0.12, shake: 0.3, amp: 2, push: 4, straw: 26 },
  ],
  dust: [{ t: K1 - 0.08, x: TX - 40, n: 8, dir: -1 }, { t: K2, x: TX - 20, n: 10 }],
};

export const create = play([{ fx: spark, t: K1, x: TX - 10, height: 34, seed: 9 }, { fx: spark, t: K2, x: TX - 8, height: 8, aim: 0.2, seed: 10 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const leaves = Array.from({ length: 22 }, (_, i) => ({ a: rand(i, 1) * TAU, r: 14 + rand(i, 2) * 18, y: -6 - rand(i, 3) * 36, c: LEAF[1 + (i % 3)], sp: 8 + rand(i, 4) * 6 }));
  return {
    update(t, dt) {
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "youth", t0: 0.05, t1: DASH, label: "KONOHA", head: b.head });
      // the kicks' wind: a high ring for the first, a low arc skimming the floor for the second
      for (const [t0, y, r, a0, a1] of [[K1, -32, 24, -2.6, 0.6], [K2, -4, 26, -0.5, 2.6]]) {
        const a = t - t0 + 0.08;
        if (a < 0 || a > 0.35) continue;
        const u = a / 0.35, cx = TX - 28;
        p.arc(cx, y, r + 6 * u, 2, a0, a0 + (a1 - a0) * Math.min(1, u * 2), WIND[0], 1 - u);
        p.arc(cx, y, r + 2 + 6 * u, 1, a0, a0 + (a1 - a0) * Math.min(1, u * 2), WIND[2], 1 - u);
      }
      // the whirl of leaves round him from the first kick to the end, then thrown out past the target
      if (t > K1 - 0.1) {
        const k = 1 - smooth(K2 + 0.3, END - 0.2, t), out = smooth(K2, K2 + 0.6, t);
        for (const [i, q] of leaves.entries()) {
          const a = q.a + (t - K1) * q.sp, r = q.r * (1 + out * 2.5), x = TX - 28 + Math.cos(a) * r + out * 50, y = q.y + Math.sin(a) * 4 - out * 10;
          if (k <= 0) continue;
          p.rect(x, y, 2, 1, q.c, k);
          p.px(x + (Math.sin(a) > 0 ? 1 : 0), y - 1, LEAF[3]);
        }
      }
      ps.draw(p, "front");
    },
  };
});
