// Nanatou: Acrobat (Killer B, the Eight-Tails' jinchuuriki). Narutopedia: his Seven Swords Dance: he carries seven
// swords at once (in his hands, under his arms, in the crook of his elbows, in his mouth) and fights with them all in an
// unpredictable, acrobatic style. Here: he rolls his shoulders, and the swords come out one after another with a ring
// of steel each, flipping up to land in his hands, his armpits, his elbows, one clamped in his teeth; then the Acrobat:
// he throws himself into a cartwheel and comes at the target spinning, a wheel of seven blades; slash after slash as
// the wheel passes through, sparks and straw; he lands past it in a crouch, swords out, and the target's cuts flash.
// New: the seven swords (each tied to a joint), the cartwheel (the whole figure turned, from _lib), the wheel of blades.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigureTurned } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { skeleton } from "../../core/index.js";

const TX = 150, DRAWS = [0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1.02], ROLL = 1.3, PASS = 1.95, LANDT = 2.1, FLASH = 2.6, END = 3.5;
const STEEL = ["#4a5468", "#a4afc6", "#e8edf6", "#ffffff"].map(hex), HILT = hex("#2a2230");
const START = 4, STOP = TX + 40;

export const meta = {
  name: "Seven swords dance: acrobat",
  desc: "Killer B: seven swords out one after another, into his hands, under his arms, in the crook of his elbows, one in his teeth; then he cartwheels through the target as a spinning wheel of blades and lands past it, the cuts flashing.",
  tags: ["jutsu", "killer-bee", "kumo", "kenjutsu", "sword", "melee", "one-shot"],
  size: [290, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a5468", "#a4afc6", "#e8edf6", "#ffffff"], seed: 88 },
};

const STANCE = { ...READY, crouch: 6, lean: 4, fx: 14, fy: -24, bx: -10, by: -22, ffx: 11, fbx: -11 };
const SPREAD = { ...READY, crouch: 3, lean: 0, fx: 16, fy: -32, bx: -14, by: -30, ffx: 14, fbx: -14, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#e8edf6",
  poses: [
    [-0.25, READY],
    [DRAWS[0] - 0.1, STANCE, "out"],
    [DRAWS[6] + 0.1, { ...STANCE, crouch: 8 }],
    [ROLL, { ...SPREAD, x: START }, "out"],
    [PASS, { ...SPREAD, x: TX + 30 }, "line"],
    [LANDT, { ...STANCE, x: STOP, crouch: 12, lean: 10, fx: 20, fy: -16, bx: -16, by: -24, gait: false }, "out"],
    [FLASH + 0.3, { ...STANCE, x: STOP, crouch: 9, gait: false }],
    [END, { ...READY, x: STOP, gait: false }],
  ],
  hits: [
    ...DRAWS.map((t) => ({ t, target: false, sfx: "parry" })),
    { t: ROLL, target: false, sfx: "whoosh" },
    ...[1.6, 1.68, 1.76, 1.84].map((t) => ({ t, stop: 0.03, shake: 0.1, amp: 1, push: 1, straw: 8, flash: 0.03, sfx: "punch" })),
    { t: LANDT, target: false, sfx: "land" },
    { t: FLASH, stop: 0.14, shake: 0.4, amp: 3, push: -5, straw: 40, skin: "red", sfx: "heavy" },
    { t: FLASH + 0.35, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: ROLL, x: START, n: 8, dir: -1 }, { t: LANDT, x: STOP, n: 10, dir: 1 }],
};
// rolling: the figure is drawn turned (below) instead of standing
export const actorAlpha = (t) => (t > ROLL && t < PASS ? 0 : 1);
const spin = (t) => smooth(ROLL, PASS, t) * TAU * 2.5;

// where the seven swords sit: [joint, angle of the blade relative to the facing, length]
const SWORDS = [["handN", -0.5, 18], ["handF", 3.6, 18], ["shoulderN", 2.6, 14], ["shoulderF", 0.6, 14], ["elbowN", -1.6, 14], ["elbowF", 1.9, 14], ["head", 0.1, 12]];
function sword(p, x, y, a, L, k = 1) {
  const c = Math.cos(a), s = Math.sin(a);
  p.beam(x - c * 3, y - s * 3, x, y, 2, HILT, k);
  p.beam(x - s * 2, y + c * 2, x + s * 2, y - c * 2, 1.2, STEEL[0], k);
  for (let i = 0; i < L; i += 0.6) {
    const w = i > L - 3 ? (L - i) / 3 : 1;
    p.px(x + c * i, y + s * i, STEEL[2], k);
    if (w > 0.5) p.px(x + c * i - s, y + s * i + c, STEEL[1], k);
  }
  p.px(x + c * L * 0.4, y + s * L * 0.4, STEEL[3], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const cuts = [];
  return {
    update(t, dt) {
      // sparks and straw off each pass of the wheel through the target
      if (t > 1.55 && t < 1.9 && R.chance(80 * dt)) {
        ps.spawn(P.SPARK, TX + R.range(-6, 10), -R.range(10, 44), R.range(-120, 160), -R.range(30, 150), R.range(0.1, 0.25), R.chance(0.5) ? WHITE : STEEL[2]);
        if (cuts.length < 6 && R.chance(0.3)) cuts.push({ y: -R.range(14, 44), a: R.range(-0.8, 0.8) });
      }
      if (t > 1.58 && t < 1.6) lights.add(TX, -26, 70, STEEL[3], 0.6, 0.2);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), q = b.q, x0 = q.x ?? 0;
      drawBadge(p, t, { kind: "kumo", t0: 0.04, t1: DRAWS[0], label: "HACHIBI", head: b.head });
      const J = skeleton(q).joints, jp = (n) => [x0 + J[n][0], J[n][1]];
      // the swords out one after another: each flips up off his back and lands in its place with a glint
      const rolling = t > ROLL && t < PASS;
      if (!rolling) SWORDS.forEach(([n, a, L], i) => {
        if (t < DRAWS[i]) return;
        const u = clamp((t - DRAWS[i]) / 0.12), [jx, jy] = jp(n), sx = b.chest[0] - 4, sy = b.chest[1] - 10;
        const x = sx + (jx - sx) * ease.outCubic(u), y = sy + (jy - sy) * ease.outCubic(u) - Math.sin(Math.PI * u) * 10;
        sword(p, x, y, a + (1 - u) * 6, L);
        if (u < 1) p.ring(x, y, 3 + 8 * u, 1, WHITE, 1 - u);
        else if (t - DRAWS[i] < 0.25) p.px(x + 2, y - 2, WHITE);
      });
      // the cartwheel: the figure turned about its middle with every sword in place, a wheel of blades
      if (rolling) {
        const a = spin(t), cx = x0 + 2, cy = -20;
        // the motion: a blurred disc of steel round him
        for (let i = 0; i < 3; i++) p.ring(cx, cy, 22 + i * 3, 1, STEEL[i + 1], 0.25 + 0.15 * i);
        drawFigureTurned(p, q, x0, 0, cx, cy, a);
        const c = Math.cos(a), s = Math.sin(a);
        SWORDS.forEach(([n, sa, L]) => {
          const [jx, jy] = jp(n), dx = jx - cx, dy = jy - cy;
          sword(p, cx + dx * c - dy * s, cy + dx * s + dy * c, sa + a, L);
        });
        // the tips' trail
        for (let i = 0; i < 8; i++) { const aa = a - i * 0.18; p.arc(cx, cy, 30, 1, aa - 0.15, aa, i < 2 ? WHITE : STEEL[2], 1 - i / 8); }
      }
      // the cuts on the target: thin while he passes, flashing open on the beat after he lands
      for (const c of cuts) {
        const open = t > FLASH ? 1 - smooth(FLASH, FLASH + 0.5, t) : 0.5 * (1 - smooth(PASS, PASS + 0.3, t));
        if (open <= 0) continue;
        p.beam(TX - 14, c.y - Math.sin(c.a) * 14, TX + 14, c.y + Math.sin(c.a) * 14, t > FLASH ? 2.5 : 1, WHITE, open);
      }
      void rand;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
