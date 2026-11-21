// Kamui Raikiri (Kakashi, with both Mangekyou Sharingan, in the Fourth War's last battle). Narutopedia: with Obito's
// chakra giving him both eyes for a moment, Kakashi's Raikiri turned purple and carried Kamui in it: whatever it cut was
// warped away into the other dimension. Here: both eyes open (the double badge), his whole body flickers with purple
// chakra; lightning gathers in his hand, not blue but violet and black, screaming; he runs, no furrow this time, the
// lightning flaring in long tongues; he swings it in a rising arc through the target, and along the arc space twists:
// the target is pulled into a spiral at the cut, wrung and swallowed into a point; a purple thunderclap; then the target
// is put back, swaying.
// New: the violet Chidori, the warping arc (the Kamui spiral pulling the target in, targetState), the double eye.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawChidori, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const TX = 170, EYES = 0.05, GATHER = 0.6, RUN = 1.2, HIT = 1.5, SUCK = 1.6, GONE = 2.2, BACKT = 3.0, END = 3.8;
const PU = ["#0c0418", "#3a1068", "#7a3ac8", "#c89aff", "#f4e8ff"];
const PUC = PU.map(hex);

export const meta = {
  name: "Kamui raikiri",
  desc: "Kakashi with both Mangekyou: violet lightning screaming in his hand; he runs and cuts upward through the target, and along the cut space twists: the target is wrung into a spiral and swallowed into a point, then put back.",
  tags: ["jutsu", "kakashi", "lightning", "kamui", "mangekyou", "melee", "one-shot"],
  size: [300, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: PU, seed: 91 },
};

const LOW = { ...READY, crouch: 9, lean: 8, fx: 14, fy: -10, bx: 0, by: -22, ffx: 10, fbx: -9 };
const RUNP = { ...LOW, x: TX - 36, crouch: 9, lean: 16, fx: 18, fy: -12, bx: -8, by: -20, ffx: 12, fbx: -12 };
const UPCUT = { ...READY, x: TX - 30, crouch: 3, lean: 2, fx: 16, fy: -44, bx: -8, by: -20, ffx: 12, fbx: -10, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#c89aff",
  poses: [
    [-0.25, READY],
    [GATHER, LOW, "out"],
    [RUN, { ...LOW, crouch: 10 }],
    [HIT - 0.06, RUNP],
    [HIT, UPCUT, "snap"],
    [GONE, { ...UPCUT, crouch: 5, lean: 4 }],
    [BACKT + 0.3, { ...READY, x: TX - 30, gait: false }, "out"],
    [END, { ...READY, x: TX - 30, gait: false }],
  ],
  hits: [
    { t: EYES, target: false, sfx: "cast" },
    { t: GATHER, stop: 0.05, shake: 0.15, amp: 1, target: false, sfx: "thunder" },
    { t: HIT, stop: 0.18, shake: 0.5, amp: 4, push: 3, straw: 30, skin: "shadow", sfx: "heavy" },
    { t: GONE - 0.05, stop: 0.1, shake: 0.4, amp: 3, target: false, sfx: "thunder" },
    { t: BACKT, flash: 0.05, push: 1, straw: 0, skin: null, sfx: "whoosh" },
  ],
  dust: [{ t: RUN, x: 4, n: 8, dir: -1 }],
};
// the target wrung into a spiral and swallowed at the cut, put back later
export const targetState = (t) => {
  if (t < SUCK) return null;
  if (t < BACKT) { const u = ease.inCubic(smooth(SUCK, GONE, t)); return { rot: 10 * u, s: 1 - 0.95 * u, dy: -10 * u, a: 1 - smooth(GONE - 0.1, GONE, t), tint: [PUC[2], 0.6 * u] }; }
  return { a: smooth(BACKT, BACKT + 0.2, t) };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      if (t > GATHER && t < HIT && R.chance(60 * dt)) ps.spawn(P.SPARK, b.handN[0], b.handN[1], R.range(-60, 60), R.range(-60, 30), R.range(0.06, 0.16), R.chance(0.5) ? WHITE : PUC[3]);
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -30, 140, PUC[3], 1, 0.3); }
      if (t >= GONE - 0.05 && !this.g) { this.g = 1; lights.add(TX, -30, 220, PUC[3], 1, 0.4); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "kakashi", t0: EYES, t1: GATHER - 0.05, label: "", head: b.head, dx: -12 });
      drawBadge(p, t, { kind: "obito", t0: EYES + 0.1, t1: GATHER - 0.05, label: "SUSANOO NO KAMUI", head: b.head, dx: 10 });
      drawGlint(p, t, "kamui", GATHER, END - 0.3, b.head);
      // the violet Chidori: long tongues flaring off it, black at their cores
      const k = smooth(GATHER, GATHER + 0.2, t) * (1 - smooth(HIT + 0.3, HIT + 0.6, t));
      if (k > 0) {
        drawChidori(p, hx, hy, t, PUC, k * 1.3, 3);
        for (let i = 0; i < 3; i++) { const a = rand(f, i + 30) * TAU, L = 14 + 20 * rand(f, i + 33); bolt(p, hx, hy, hx + Math.cos(a) * L, hy + Math.sin(a) * L, f + 40 + i, PUC, { jag: 0.3, seed: i + 5, glow: 0.2, core: PUC[0] }); }
      }
      // the rising cut: a violet arc through the target
      if (t > HIT - 0.04 && t < HIT + 0.3) {
        const u = clamp((t - HIT + 0.04) / 0.1), kk = 1 - smooth(HIT + 0.1, HIT + 0.3, t);
        p.arc(TX - 22, -10, 34, 3, Math.PI * 1.1, Math.PI * (1.1 + 0.8 * u), PUC[3], kk);
        p.arc(TX - 22, -10, 34, 1, Math.PI * 1.1, Math.PI * (1.1 + 0.8 * u), WHITE, kk);
      }
      // space twisting at the cut: a spiral pulling in, warping what's behind it
      if (t > SUCK - 0.05 && t < GONE + 0.15) {
        const u = smooth(SUCK - 0.05, GONE, t), kk = 1 - smooth(GONE, GONE + 0.15, t), R0 = 30 * (1 - 0.6 * u) + 6;
        warp(p, TX, -28, R0 + 10, 2.2 * u * kk, 0.4 * kk);
        for (let i = 0; i < 4; i++) { const a0 = -t * 9 + (i * TAU) / 4; p.arc(TX, -28, R0 * (0.5 + 0.15 * i), 1, a0, a0 + 1.8, i % 2 ? PUC[3] : PUC[2], kk); }
        p.circle(TX, -28, 2 + 3 * u, PUC[0], kk);
      }
      // the clap as it closes: a violet flash and lightning out of the point
      if (t > GONE - 0.05 && t < GONE + 0.3) {
        const kk = 1 - smooth(GONE, GONE + 0.3, t);
        p.glow(TX, -28, 60, PUC[3], 0.8 * kk);
        for (let i = 0; i < 5; i++) bolt(p, TX, -28, TX + (rand(f, i) - 0.5) * 120, -28 + (rand(f, i + 7) - 0.5) * 80, f + i, PUC, { jag: 0.25, seed: i, glow: 0.3 * kk });
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
