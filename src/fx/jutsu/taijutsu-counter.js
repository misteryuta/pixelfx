// Taijutsu: the counter (after the reference: a flurry of strikes turned aside one by one, then the opening). The rival
// comes on with five fast strikes; the hero gives ground a step at a time, turning each aside with a hand, a forearm,
// the other hand; the sixth, a big swing, he catches by the wrist and holds a beat; a knee to the gut folds the rival
// over, the hero draws back his fist and puts it through the rival's face: two impact frames, and the rival is thrown
// tumbling away.
// New: the exchange, the catch, the fold, the finishing blow (from _taijutsu.js: rival, sparks, smears).
import { READY, smooth, hex, WHITE } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { shots } from "./_taijutsu.js";
import { GUARD, JAB, CROSS, BLOCK, PARRY, PARRY2, WIND, HAYMAKER, KNEE, GUT, FLY, LAND, rival, drawRival, jointOf, smear, hitSpark, blockSpark } from "./_taijutsu.js";

const BX = 112, STRIKES = [0.5, 0.66, 0.82, 0.98, 1.14], BIG = 1.42, KNEET = 1.72, PULL = 1.98, PUNCH = 2.14, LANDT = 2.85, END = 3.7;
const DEF = [PARRY, PARRY2, BLOCK, PARRY, PARRY2];

export const meta = {
  name: "Taijutsu: counter",
  desc: "A flurry of five strikes turned aside one by one, a big swing caught by the wrist, a knee to the gut, and a punch through the rival's face that sends him tumbling away.",
  tags: ["taijutsu", "melee", "duel", "counter", "one-shot"],
  size: [270, 140],
  origin: [50, 112],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 82 },
};

const CATCH = { crouch: 5, lean: 2, fx: 8, fy: -26, bx: 20, by: -29, ffx: 9, fbx: -9 };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.2, { ...GUARD, x: 30 }, "out"],
    ...STRIKES.map((t, i) => [t, { ...DEF[i], x: 30 - i * 2 }, "snap"]),
    [BIG - 0.08, { ...GUARD, x: 20 }],
    [BIG, { ...CATCH, x: 22 }, "snap"],
    [KNEET - 0.06, { ...CATCH, x: 24 }],
    [KNEET, { ...KNEE, x: 28 }, "snap"],
    [PULL, { ...WIND, x: 26 }, "out"],
    [PUNCH, { ...HAYMAKER, x: 32 }, "snap"],
    [PUNCH + 0.35, { ...HAYMAKER, x: 32, lean: 10 }],
    [LANDT + 0.3, { ...GUARD, x: 28 }],
    [END, { ...GUARD, x: 28 }],
  ],
  hits: [
    ...STRIKES.map((t, i) => ({ t, stop: 0.03, shake: 0.08, amp: 1, target: false, sfx: i === 2 ? "block" : "parry" })),
    { t: BIG - 0.06, target: false, sfx: "whoosh" },
    { t: BIG, stop: 0.18, shake: 0.12, amp: 1, target: false, sfx: "block" },
    { t: KNEET, stop: 0.1, shake: 0.25, amp: 2, target: false, sfx: "kick" },
    { t: PUNCH - 0.05, target: false, sfx: "whoosh" },
    { t: PUNCH, stop: 0.26, shake: 0.55, amp: 5, target: false, sfx: "heavy" },
    { t: LANDT, shake: 0.15, amp: 2, target: false, sfx: "land" },
  ],
  dust: [{ t: PUNCH, x: 34, n: 8, dir: -1 }],
};

// the camera: tight on the flurry, swaying with each block, a cut in close on the catch, the knee from low, and the
// finishing punch dead on the face before it pulls out with the flying rival
export const camera = shots([
  [0, { z: 1.4, x: 52, y: -26, r: 0 }],
  [STRIKES[0], { z: 1.9, x: 52, y: -28, r: 1 }],
  [STRIKES[1], { z: 2.0, x: 50, y: -28, r: -1 }],
  [STRIKES[2], { z: 2.05, x: 50, y: -28, r: 1 }],
  [STRIKES[3], { z: 2.1, x: 48, y: -28, r: -1 }],
  [STRIKES[4], { z: 2.15, x: 48, y: -28, r: 1 }],
  [BIG, { z: 2.6, x: 44, y: -28, r: 0 }, "cut"],
  [KNEET, { z: 2.3, x: 48, y: -18, r: 2 }, "cut"],
  [PULL, { z: 2.0, x: 46, y: -28, r: 0 }],
  [PUNCH, { z: 2.9, x: 58, y: -28, r: -4 }, "cut"],
  [PUNCH + 0.24, { z: 2.6, x: 60, y: -28, r: -3 }],
  [PUNCH + 0.3, { z: 1.3, x: 74, y: -28, r: 0 }, "cut"],
  [LANDT, { z: 1.25, x: 74, y: -24 }],
  [END, { z: 1.15, x: 66, y: -24 }],
]);

const B = rival([
  [-0.25, READY],
  [0.2, { ...GUARD, x: 40 }, "out"],
  ...STRIKES.flatMap((t, i) => [[t - 0.08, { ...GUARD, x: 40 + i * 2, lean: 5 }], [t, { ...(i % 2 ? CROSS : JAB), x: 44 + i * 2 }, "snap"]]),
  [BIG - 0.12, { ...WIND, x: 50 }, "out"],
  [BIG, { ...HAYMAKER, x: 54, fx: 22 }, "snap"],
  [KNEET - 0.02, { ...HAYMAKER, x: 54, fx: 22 }],
  [KNEET, { ...GUT, x: 52 }, "snap"],
  [PUNCH - 0.02, { ...GUT, x: 52, crouch: 9 }],
  [PUNCH, { ...FLY, x: 48, y: -4 }, "snap"],
  [PUNCH + 0.3, { ...FLY, x: 10, y: -18, lean: -24 }],
  [LANDT, { ...LAND, x: -16, y: 0 }, "in"],
  [LANDT + 0.3, { ...LAND, x: -24 }, "out"],
  [END - 0.2, { ...GUARD, x: -24 }],
], BX);
const rJ = (name) => (t) => {
  const s = B(t);
  return jointOf(s.q, name, s.x, s.y, -1);
};

export const create = play([], () => ({
  drawBack(p, t) {
    drawRival(p, B, t);
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    STRIKES.forEach((s, i) => {
      if (t > s - 0.07 && t < s + 0.03) smear(p, rJ(i % 2 ? "handF" : "handN"), t, { w: 3 });
      if (t > s) blockSpark(p, ...rJ(i % 2 ? "handF" : "handN")(s), t - s, { dir: -1, c: i === 2 ? hex("#8fd6ff") : hex("#ffe8a0") });
    });
    if (t > BIG - 0.1 && t < BIG + 0.03) smear(p, rJ("handN"), t, { w: 5, n: 8 });
    // the catch: a grip flash round the wrist
    if (t > BIG && t < BIG + 0.3) {
      const [x, y] = bodyAt(act.poses, t).handF, k = 1 - (t - BIG) / 0.3;
      p.ring(x, y, 4 + (1 - k) * 6, 1, 0xffffffff, k);
    }
    if (t > KNEET) hitSpark(p, ...bodyAt(act.poses, KNEET).footN.map((v, i) => v + (i ? -2 : 3)), t - KNEET);
    if (t > PUNCH - 0.1 && t < PUNCH + 0.03) smear(p, at("handN"), t, { w: 6, n: 8 });
    const hit = bodyAt(act.poses, PUNCH).handN;
    if (t >= PUNCH && t < PUNCH + 0.05) p.circle(hit[0] + 3, hit[1], 10, WHITE);
    if (t > PUNCH + 0.1) hitSpark(p, hit[0] + 3, hit[1], t - PUNCH - 0.1, { big: true });
  },
}));
