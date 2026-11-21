// Kusanagi no Tsurugi: Long Sword (Orochimaru). Narutopedia: Orochimaru keeps the Kusanagi inside his body and draws it
// from a snake that comes out of his mouth; the blade can stretch to great lengths in an instant. Here: his head tips
// back, the throat working; a snake's head pushes out of his open mouth, its own jaws opening; out of those jaws comes a
// blade's point, and it lengthens, impossibly fast, straight across the floor through the target, ringing; it hangs
// there a beat, run through; then it pulls back into the snake, the snake back into his mouth with a wet slurp, and he
// wipes his lip with a long tongue.
// New: the snake from the mouth, the extending blade (a thin line with a ridge, the shine racing along it), the tongue.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, MOUTH } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 190, TILT = 0.3, SNAKE = 0.75, BLADE = 1.05, HIT = 1.18, HOLD = 1.7, RETRACT = 1.95, IN = 2.3, LICK = 2.5, END = 3.4;
const SN = ["#2a1a36", "#4a3060", "#7a5a90", "#b89ac8"].map(hex), STEEL = ["#4a5468", "#a4afc6", "#e8edf6", "#ffffff"].map(hex), TONGUE = hex("#c84a6a");

export const meta = {
  name: "Kusanagi: long sword",
  desc: "Orochimaru: a snake pushes out of his open mouth, and from its jaws the Kusanagi's point lengthens impossibly fast straight through the target, hangs there, then pulls back into the snake and the snake into his mouth.",
  tags: ["jutsu", "orochimaru", "snake", "sword", "projectile", "one-shot"],
  size: [300, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a36", "#4a3060", "#7a5a90", "#b89ac8"], seed: 15 },
};

const BACK = { ...READY, crouch: 3, lean: -10, fx: 2, fy: -18, bx: -6, by: -18, ffx: 8, fbx: -8, hy: -2 };
const THRUST = { ...READY, crouch: 6, lean: 10, fx: 4, fy: -16, bx: -8, by: -18, ffx: 11, fbx: -10, hy: 0 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [TILT, BACK, "out"],
    [SNAKE, { ...BACK, lean: -6 }],
    [BLADE, THRUST, "out"],
    [RETRACT, THRUST],
    [IN, { ...READY, crouch: 3, lean: 2 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SNAKE, target: false, sfx: "cast" },
    { t: BLADE, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.2, shake: 0.4, amp: 3, push: 2, straw: 30, skin: "red", sfx: "heavy" },
    { t: RETRACT, target: false, sfx: "whoosh" },
    { t: IN, stop: 0.04, target: false, sfx: "step" },
    { t: IN + 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -24, 90, STEEL[3], 0.8, 0.2); for (let i = 0; i < 14; i++) ps.spawn(P.SPARK, TX, -24, R.range(0, 160), R.range(-80, 80), R.range(0.08, 0.2), R.chance(0.5) ? WHITE : STEEL[2]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0] - 2, b.head[1] + 4];
      drawBadge(p, t, { kind: "snake", t0: 0.04, t1: TILT, label: "KUSANAGI", head: b.head });
      // the snake out of his mouth: a neck of scales arching forward, its head, its jaws opening
      const out = smooth(SNAKE, BLADE, t) * (1 - smooth(RETRACT + 0.1, IN, t));
      if (out > 0) {
        const L = 16 * out, ex = m[0] + L, ey = m[1] - 2 * Math.sin(out * Math.PI);
        for (let i = 0; i <= 8; i++) { const u = i / 8; p.circle(m[0] + (ex - m[0]) * u, m[1] + (ey - m[1]) * u - Math.sin(u * Math.PI) * 3, 2.2, i % 2 ? SN[1] : SN[2]); }
        p.ellipse(ex + 2, ey, 4, 2.6, SN[2]);
        p.px(ex + 2, ey - 2, hex("#ffd040"));
        const jaw = smooth(BLADE - 0.15, BLADE, t) * (1 - smooth(RETRACT, RETRACT + 0.1, t));
        if (jaw > 0) p.tri(ex + 4, ey, ex + 8, ey - 2 * jaw - 0.5, ex + 8, ey + 2 * jaw + 0.5, hex("#3a1020"));
      }
      // the blade: from the snake's jaws straight out across the floor, the point racing ahead, then drawn back
      const tipX = (() => {
        const sx = m[0] + 22;
        if (t < BLADE) return sx;
        if (t < HIT) return sx + (TX + 18 - sx) * ease.outCubic((t - BLADE) / (HIT - BLADE));
        if (t < RETRACT) return TX + 18;
        return sx + (TX + 18 - sx) * (1 - ease.inCubic(smooth(RETRACT, IN - 0.05, t)));
      })();
      if (t > BLADE && t < IN) {
        const sx = m[0] + 22, y = m[1];
        p.beam(sx, y, tipX, y, 2.4, STEEL[0]);
        p.line(sx, y - 1, tipX, y - 1, STEEL[2]);
        p.px(tipX + 1, y, STEEL[3]);
        // the shine running along it
        const sh = sx + ((t * 400) % Math.max(1, tipX - sx));
        p.beam(sh - 4, y - 1, sh + 4, y - 1, 1, WHITE);
        if (t < HIT + 0.08) p.glowLine(sx, y, tipX, y, 6, STEEL[2], 0.4);
        // the ring of it as it goes through
        if (t > HIT && t < HIT + 0.3) for (let i = 0; i < 3; i++) p.arc(TX, y, 6 + i * 5 + (t - HIT) * 30, 1, -0.6, 0.6, WHITE, 1 - (t - HIT) / 0.3);
      }
      // the lick: a long tongue out and along his lip
      if (t > LICK && t < LICK + 0.45) { const u = Math.sin(((t - LICK) / 0.45) * Math.PI); p.beam(m[0], m[1] + 1, m[0] + 10 * u, m[1] + 1 - 2 * u, 1.4, TONGUE); p.px(m[0] + 10 * u + 1, m[1] - 1 - 2 * u, TONGUE); }
      void rand; void TAU; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
