// Shinranshin no Jutsu (Mind Body Disturbance Technique, Ino Yamanaka). Narutopedia: Ino sends her chakra into the
// target's nervous system (using the clan's mind-transfer pathways) and takes over its movements without leaving her own
// body, making it act against its will, even strike itself or its allies. Here: the clan seal (the Yamanaka diamond
// of fingers); a thin violet wave of chakra flows from her hands along the ground, climbs into the target and lights
// its outline; its arms jerk up like a puppet's (strings of light from her fingers to its limbs); she curls her
// fingers and makes it punch itself, once, twice, then fold over; she lets go and the strings snap.
// New: the control wave, the puppet strings, the target moved against itself (targetState jerks).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEAL = 0.3, WAVE = 0.6, HOOK = 1.15, PULL = 1.5, P1 = 1.85, P2 = 2.25, FOLD = 2.6, LET = 3.2, END = 3.9, TX = 150;
const VI = ["#2a1a4a", "#7a5ad0", "#c8b0ff", "#f4ecff"].map(hex);

export const meta = {
  name: "Mind body disturbance",
  desc: "Ino: the clan seal; a thin violet wave of chakra runs along the ground into the target and lights its outline; strings of light from her fingers jerk its arms up like a puppet's and she makes it punch itself, twice, then fold over.",
  tags: ["jutsu", "ino", "yamanaka", "mind", "control", "one-shot"],
  size: [240, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a4a", "#7a5ad0", "#c8b0ff", "#f4ecff"], seed: 181 },
};

const SEALP = { ...READY, crouch: 3, armsFront: true, fx: 9, fy: -28, bx: 10, by: -28, ffx: 8, fbx: -8 };
const PUP = { ...READY, crouch: 4, lean: -2, fx: 16, fy: -36, bx: 14, by: -32, ffx: 9, fbx: -9 };
const CURL = { ...PUP, fx: 10, fy: -30, bx: 8, by: -28, lean: 4 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEAL, SEALP, "out"],
    [HOOK, SEALP],
    [PULL, PUP, "out"],
    [P1 - 0.05, PUP], [P1, CURL, "snap"], [P1 + 0.2, PUP, "out"],
    [P2 - 0.05, PUP], [P2, CURL, "snap"], [P2 + 0.2, PUP, "out"],
    [FOLD, { ...CURL, lean: 8, crouch: 6 }, "snap"],
    [LET, { ...CURL, lean: 8, crouch: 6 }],
    [END, READY],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: HOOK, stop: 0.06, flash: 0, push: 0, straw: 4, shiver: 0.6, sfx: "block" },
    { t: P1, stop: 0.08, shake: 0.3, amp: 2, push: -2, straw: 14, sfx: "punch" },
    { t: P2, stop: 0.08, shake: 0.3, amp: 2, push: -2, straw: 16, sfx: "punch" },
    { t: FOLD, stop: 0.12, shake: 0.4, amp: 3, push: 0, straw: 20, sfx: "heavy" },
    { t: LET, flash: 0, push: 0, straw: 0, sfx: "whoosh" },
  ],
};
// the puppet: jerked upright, recoiling from its own punches, folding over at the end
const jerk = (t, at) => Math.exp(-Math.pow((t - at - 0.04) / 0.06, 2));
export const targetState = (t) => (t > HOOK && t < LET + 0.3 ? { dy: -3 * smooth(HOOK, PULL, t) + 4 * smooth(FOLD, FOLD + 0.2, t), rot: -0.25 * (jerk(t, P1) + jerk(t, P2)) + 0.35 * smooth(FOLD, FOLD + 0.2, t) * (1 - smooth(LET, LET + 0.3, t)), tint: [VI[2], 0.2 * smooth(HOOK, HOOK + 0.2, t) * (1 - smooth(LET, LET + 0.2, t))] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t > LET && t < LET + 0.1 && !this.l) { this.l = 1; for (let i = 0; i < 10; i++) ps.spawn(P.SPARK, TX + R.range(-10, 10), -R.range(10, 40), R.range(-60, 60), R.range(-60, 20), R.range(0.2, 0.4), VI[2]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the wave along the ground: a thin violet line racing out, rippling
      if (t > WAVE && t < HOOK + 0.2) {
        const u = ease.outQuad(clamp((t - WAVE) / (HOOK - WAVE))), x1 = 10 + (TX - 10) * u, k = 1 - smooth(HOOK, HOOK + 0.2, t);
        for (let x = 10; x < x1; x += 2) p.px(x, -1 - Math.abs(Math.sin(x * 0.3 - t * 20)) * 2, VI[2], k);
        p.glow(x1, -2, 8, VI[2], 0.5 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "yamanaka", t0: 0.04, t1: SEAL, label: "SHINRANSHIN", head: b.head });
      // the strings: from her fingertips to the target's arms and head, taut and trembling
      if (t > HOOK && t < LET + 0.1) {
        const k = smooth(HOOK, HOOK + 0.15, t) * (1 - smooth(LET, LET + 0.1, t)), j = jerk(t, P1) + jerk(t, P2);
        const ends = [[TX - 8, -30 + 6 * j], [TX + 8, -30], [TX, -40]];
        for (const [i, e] of ends.entries()) {
          const h = i === 1 ? b.handF : b.handN, mx = (h[0] + e[0]) / 2, my = (h[1] + e[1]) / 2 - 8 + Math.sin(t * 30 + i) * 0.8;
          p.line(h[0], h[1], mx, my, VI[2], k); p.line(mx, my, e[0], e[1], VI[2], k);
          p.px(e[0], e[1], VI[3], k);
        }
      }
      // the self-inflicted punches: a flash at the target's own face
      for (const h of [P1, P2]) if (t > h && t < h + 0.15) { const v = (t - h) / 0.15; p.ring(TX + 2, -36, 3 + 8 * v, 1, WHITE, 1 - v); }
      void noise2; void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
