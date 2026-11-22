// Raiton: Giro Chin Doroppu (Lightning Release: Guillotine Drop, A, the Fourth Raikage). Narutopedia: wrapped in his
// Lightning Release Chakra Mode (lightning crackling over his skin, his hair standing up), A leaps high and brings his
// heel (or the back of his leg) down onto the target's neck like a guillotine blade, with enough force to crater the
// ground. Here: the lightning armour bursts over him, his hair spikes up; one stamp and he is gone upward in a flash;
// high above the target he flips over, the leg raised; he drops like a blade, a streak of lightning, the heel
// slamming into the target: lightning bursts out across the floor, the ground cracks; he stands up out of the crater.
// New: the lightning armour (bolts crawling over the figure's outline), the vertical flash leap, the heel drop.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawOutline, drawFigureTurned } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const ARMOR = 0.3, STAMP = 0.8, UP = 0.95, APEX = 1.3, DROP = 1.55, HIT = 1.68, RISE = 2.4, END = 3.3, TX = 150;
const LT = ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Guillotine drop",
  desc: "The Fourth Raikage: lightning armour bursts over him and he vanishes upward in a flash; high above the target he flips, leg raised, and drops like a blade, his heel slamming down in a burst of lightning that cracks the ground.",
  tags: ["jutsu", "raikage", "kumo", "lightning", "raiton", "taijutsu", "melee", "one-shot"],
  size: [230, 230],
  origin: [56, 200],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff"], seed: 189 },
};

const ARMORP = { ...READY, crouch: 6, lean: 2, fx: 10, fy: -18, bx: -8, by: -18, ffx: 11, fbx: -11 };
const STAMPP = { ...ARMORP, crouch: 12, lean: 8 };
const FLIP = { ...READY, x: TX - 6, y: -150, crouch: 4, lean: -6, fx: -6, fy: -26, bx: 8, by: -26, ffx: 4, ffy: -30, fbx: -6, gait: false };
const LANDP = { ...READY, x: TX - 10, crouch: 12, lean: 8, fx: 10, fy: -8, bx: -8, by: -10, ffx: 10, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [ARMOR, ARMORP, "out"],
    [STAMP, STAMPP, "in"],
    [UP, { ...ARMORP, x: TX - 30, y: -120, gait: false }, "snap"],
    [APEX, FLIP, "out"],
    [DROP, { ...FLIP, y: -140, ffy: -40 }],
    [HIT, { ...FLIP, y: -20, ffx: 12, ffy: -2, lean: 6 }, "in"],
    [HIT + 0.02, LANDP, "snap"],
    [RISE, LANDP],
    [END, { ...ARMORP, x: TX - 10, gait: false }],
  ],
  hits: [
    { t: ARMOR, stop: 0.08, shake: 0.4, amp: 2, target: false, sfx: "thunder" },
    { t: STAMP, stop: 0.04, shake: 0.4, amp: 2, target: false, sfx: "step" },
    { t: UP, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.3, shake: 1.2, amp: 8, push: 0, straw: 60, flash: 0.08, skin: "shock", sfx: "explosion" },
    { t: HIT + 0.9, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: STAMP, x: 0, n: 14 }, { t: HIT, x: TX - 30, n: 24, dir: -1 }, { t: HIT, x: TX + 30, n: 24, dir: 1 }],
};
export const targetState = (t) => (t > HIT && t < RISE + 0.4 ? { dy: 6 * (1 - smooth(HIT + 0.3, RISE + 0.4, t)), s: 1 - 0.15 * (1 - smooth(HIT + 0.3, RISE + 0.4, t)) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -10, 160, LT[3], 0.9, 0.4); for (let i = 0; i < 30; i++) ps.spawn(P.SPARK, TX, -4, R.range(-260, 260), -R.range(20, 160), R.range(0.15, 0.35), LT[R.int(2, 4)]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 30);
      if (t > ARMOR) { const k = smooth(ARMOR, ARMOR + 0.1, t); drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, LT[3], { w: 1, a: k, flick: t * 30 }); drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, LT[2], { w: 2, a: 0.5 * k, flick: t * 20 }); }
      // the ground cracked with lightning in it after the drop
      if (t > HIT) { const v = ease.outCubic(clamp((t - HIT) / 0.25)), k = 1 - smooth(END - 0.4, END, t); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI, L = 40 + rand(i, 1) * 50; p.line(TX, 0, TX + Math.cos(a) * L * v, 1 + Math.sin(a) * 2, LT[1], k); } p.ellipse(TX, 1, 30 * v, 3, hex("#060810"), k); }
      void f;
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 30), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kumo", t0: 0.04, t1: ARMOR, label: "GIRO CHIN", head: b.head });
      // the lightning crawling over him, his hair standing up
      if (t > ARMOR) {
        for (let i = 0; i < 3; i++) p.line(hx - 2 + i * 2, hy - 4, hx - 3 + i * 3, hy - 9 - (i % 2) * 2, hex("#f0f0f0"));
        if (f % 2) { bolt(p, b.chest[0] - 6, b.chest[1] - 6, b.handN[0], b.handN[1], f, LT, { jag: 0.4, seed: f, glow: 0 }); bolt(p, b.chest[0] + 4, b.chest[1] + 10, b.footN[0], b.footN[1], f + 1, LT, { jag: 0.4, seed: f + 1, glow: 0 }); }
      }
      // the flash leap: a vertical streak from the floor to him
      if (t > UP - 0.02 && t < UP + 0.15) { const k = 1 - (t - UP) / 0.17; p.beam(TX - 30, 0, TX - 30, -120, 6 * k, LT[3], k); p.beam(TX - 30, 0, TX - 30, -120, 2, WHITE, k); }
      // the drop: a streak of lightning behind the falling heel
      if (t > DROP && t < HIT + 0.05) { const [fx, fy] = b.footN; p.glowLine(fx, fy - 60, fx, fy, 14, LT[2], 0.6); p.beam(fx, fy - 60, fx, fy, 3, LT[3]); bolt(p, fx, fy - 80, fx, fy, f + 9, LT, { jag: 0.3, seed: f, glow: 0.3 }); }
      if (t > HIT && t < HIT + 0.3) { const v = (t - HIT) / 0.3; p.ellipse(TX, -2, 10 + 70 * v, 4 + 10 * v, (d) => (d > 0.85 ? LT[4] : 0), 1 - v); }
      void noise2; void TAU; void drawFigureTurned;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
