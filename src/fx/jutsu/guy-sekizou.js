// Sekizou (Evening Elephant, Might Guy with the seventh gate open). Narutopedia: with the Gate of Wonder open, Guy
// throws five punches, each one breaking the sound barrier and riding the speed of the one before; the air they
// compress becomes huge pillars of pressure shaped like an elephant's legs, which pound the target one after the
// other, each heavier than the last; the name: the five legs (the four, and the trunk) of the elephant. Here: the
// first seven gates open, the blue-green aura and the steam; he sinks into a deep stance, fists at his hips; five
// punches, faster and faster: each fires a pillar of compressed air (a thick column with a rounded foot and nails, a
// shock cone at the fist), each bigger and quicker, stamping into the target and driving it back; the last one blows
// it away with a sonic ring. One unique impact frame (a teal burst).
// New: the pressure pillars (foot, nails, rings of compressed air running down them), accelerating rhythm.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, drawGates, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { speedLines } from "./_taijutsu.js";

const GATE = 0.1, STANCE = 0.6, P0 = 1.1;
// five punches, each sooner than the last (each rides the last one's speed)
const PT = [P0, P0 + 0.34, P0 + 0.6, P0 + 0.8, P0 + 0.94];
const END = PT[4] + 1.6, TX = 170;
const AIR = ["#2a6a6a", "#5ae8d0", "#c8fff4", "#ffffff"].map(hex);

export const meta = {
  name: "Evening elephant",
  desc: "Might Guy, seventh gate open: five punches, each faster than the last, firing pillars of compressed air shaped like an elephant's legs that stamp into the target one after another, the last blowing it away.",
  tags: ["jutsu", "guy", "gates", "taijutsu", "air", "multi-hit", "one-shot"],
  size: [290, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a6a6a", "#5ae8d0", "#c8fff4", "#e0503a"], seed: 163 },
};

const HIPS = { ...READY, crouch: 9, lean: 6, fx: -2, fy: -18, bx: -4, by: -18, ffx: 15, fbx: -14 };
const PN = { ...HIPS, lean: 12, fx: 27, fy: -26, bx: -6, by: -18, twist: 3, ghost: true };
const PF = { ...HIPS, lean: 12, fx: -6, fy: -18, bx: 27, by: -26, twist: -3, ghost: true };
export const act = {
  target: { x: TX },
  ghost: "#5ae8d0",
  poses: [
    [-0.25, READY],
    [STANCE, HIPS, "out"],
    ...PT.flatMap((t, i) => [[t - Math.max(0.03, 0.12 - i * 0.02), HIPS, "out"], [t, i % 2 ? PF : PN, "snap"]]),
    [PT[4] + 0.6, PN],
    [END, HIPS],
  ],
  hits: [
    { t: GATE, stop: 0.08, shake: 0.8, amp: 2, target: false, sfx: "cast" },
    ...PT.map((t, i) => ({ t: t + 0.1 - i * 0.012, stop: 0.06 + i * 0.03, shake: 0.4 + i * 0.2, amp: 3 + i, push: 3 + i * 3, straw: 16 + i * 8, flash: i === 4 ? 0.1 : 0.03, sfx: i === 4 ? "explosion" : "heavy" })),
  ],
  dust: PT.map((t, i) => ({ t, x: 0, n: 4 + i * 2, dir: -1 })),
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const hitAt = (i) => PT[i] + 0.1 - i * 0.012;
  return {
    update(t, dt) {
      PT.forEach((p0, i) => { const h = hitAt(i); if (t >= h && !this["h" + i]) { this["h" + i] = 1; lights.add(TX - 10, -28, 70 + i * 20, AIR[2], 0.4 + i * 0.1, 0.2); for (let j = 0; j < 8 + i * 4; j++) ps.spawn(P.SPARK, TX - 8, -28 + R.range(-14, 14), R.range(30, 200), R.range(-80, 80), R.range(0.15, 0.3), AIR[R.int(1, 3)]); } void p0; });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      drawGates(p, t, b.q, 7, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.4, END, t)), "back");
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gate", t0: 0.04, t1: GATE + 0.2, label: "SEKIZOU", head: b.head });
      drawGates(p, t, b.q, 7, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.4, END, t)), "front");
      // the five pillars: each from his fist to the target, bigger and quicker each time
      PT.forEach((p0, i) => {
        const h = hitAt(i), age = t - p0;
        if (age < 0 || age > h - p0 + 0.35) return;
        const fist = bodyAt(act.poses, p0)[i % 2 ? "handF" : "handN"], R = 9 + i * 3, u = clamp(age / (h - p0)), x1 = fist[0] + (TX - 6 - fist[0]) * ease.outCubic(u), k = 1 - smooth(h - p0 + 0.1, h - p0 + 0.35, age);
        // the column: banded, rings of compressed air running down it
        p.shade(fist[0], fist[1] - R - 2, x1 + R * 0.7, fist[1] + R + 2, (X, Y, out) => {
          const v = (X - fist[0]) / Math.max(1, x1 - fist[0]), r = R * (0.55 + 0.45 * Math.min(1, v * 3)), dy = Math.abs(Y - fist[1]);
          // the rounded foot at the end
          const foot = X > x1 ? Math.hypot((X - x1) / (R * 0.7), dy / r) : 0;
          if (dy > r || foot > 1) return;
          out.a = k * (0.55 + 0.25 * (1 - dy / r));
          const ring = Math.sin(X * 0.5 - age * 60) > 0.6;
          return dy / r > 0.8 ? AIR[1] : ring ? AIR[3] : AIR[2];
        });
        // the toenails on the foot's face
        for (let n = -1; n <= 1; n++) p.ellipse(x1 + R * 0.55, fist[1] + n * R * 0.5, 2, R * 0.18, AIR[3], k);
        // the shock cone at the fist
        if (age < 0.06) { p.ring(fist[0] + 4, fist[1], 4 + age * 120, 1, WHITE, 1 - age / 0.06); p.ring(fist[0] + 4, fist[1], 2 + age * 70, 1, AIR[2], 1 - age / 0.06); }
        // the stamp: a ring of air bursting round the target
        if (t > h && t < h + 0.25) { const v = (t - h) / 0.25; p.ellipse(TX - 6, -28, 10 + 30 * v + i * 4, 18 + 40 * v + i * 6, (d) => (d > 0.85 ? AIR[3] : 0), 1 - v); }
      });
      if (t > PT[0] && t < PT[4] + 0.2) speedLines(p, b.chest[0] - 50, b.chest[1] - 12, b.chest[0] - 8, b.chest[1] + 12, t, 0.6, -1);
      // the last one: a sonic ring
      const H4 = hitAt(4);
      if (t > H4 && t < H4 + 0.5) { const v = (t - H4) / 0.5; p.ring(TX, -28, 10 + 120 * v, 2, WHITE, 1 - v); p.ring(TX, -28, 6 + 80 * v, 1, AIR[1], 1 - v); }
      void rand; void noise2;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
