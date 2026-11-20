// Mokuton Hijutsu: Jukai Kotan (Wood Release Secret Technique: Nativity of a World of Trees, Hashirama). Narutopedia:
// seals Tiger, Snake (or Ram, Snake); Hashirama makes a dense forest grow and steers its growth with his chakra; the
// trees split the earth as they sprout, pierce whatever is in their way, and grow fast enough to catch a target before
// it can run. Here: Wood Release, the two seals, his palms pressed to the floor, the ground splitting in a line to the
// target and great trunks bursting up out of it, curling over and closing round the target like a cage, branching and
// leafing out.
// New: the trunks (thick curving trunks of shaded bark grown along curves, tapering, with branches and leaves). From the
// library: the root snare at the target.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["tora", "mi"], 0.14, { hold: 0.25, kind: "earth" });
const PRESS = SEALS.end, SPLIT = PRESS + 0.15, GROW = SPLIT + 0.25, GROWN = GROW + 0.7, LEAVES = GROWN, END = GROWN + 1.6, TX = 160;
const BARK = ["#2a1a0e", "#4a2e18", "#6e4626", "#946038", "#b88250"].map(hex), LEAF = ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"].map(hex);
// the trunks: where each bursts out of the floor, where it reaches over the target, how thick, when
const TRUNKS = [
  { x: TX - 34, ex: TX + 6, ey: -60, w: 7, d: 0.05 },
  { x: TX + 30, ex: TX - 4, ey: -66, w: 7, d: 0.1 },
  { x: TX - 20, ex: TX + 14, ey: -40, w: 5, d: 0.0 },
  { x: TX + 18, ex: TX - 12, ey: -44, w: 5, d: 0.08 },
  { x: TX - 60, ex: TX - 44, ey: -50, w: 6, d: 0.15 },
  { x: TX + 56, ex: TX + 44, ey: -46, w: 6, d: 0.2 },
  { x: 60, ex: 66, ey: -28, w: 4, d: 0.0 },
  { x: 92, ex: 98, ey: -36, w: 5, d: 0.05 },
];

export const meta = {
  name: "Nativity of a world of trees",
  desc: "Hashirama: Tiger, Snake, palms to the floor, the ground splitting to the target and great trunks bursting up out of it, curling over and closing round the target like a cage, branching and leafing out.",
  tags: ["jutsu", "hashirama", "wood", "mokuton", "control", "aoe", "one-shot"],
  size: [300, 180],
  origin: [50, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a0e", "#4a2e18", "#6e4626", "#946038", "#b88250"], seed: 72 },
};

const PALMS = { ...READY, crouch: 15, lean: 20, fx: 14, fy: 0, bx: 8, by: 0, ffx: 6, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [PRESS, PALMS, "in"],
    [END - 0.5, { ...PALMS, crouch: 12 }],
    [END, READY],
  ],
  hits: [
    { t: PRESS, stop: 0.06, shake: 0.2, amp: 1, target: false },
    { t: GROW + 0.25, stop: 0.12, shake: 0.4, amp: 3, push: 2, straw: 30 },
    { t: GROWN, stop: 0.04, flash: 0, push: 0, straw: 8, shiver: 1 },
  ],
};

// a trunk's spine: out of the floor, up and curling over toward (ex, ey); grown g (0..1)
const spineAt = (q, s) => {
  const x = q.x + (q.ex - q.x) * s * s, y = -s * (-q.ey) * (1 - 0.25 * s * s);
  return [x, y];
};
function trunk(p, q, g, t) {
  if (g <= 0) return;
  const n = 18;
  for (let i = 0; i < n * g; i++) {
    const s0 = i / n, s1 = Math.min(g, (i + 1) / n), [x0, y0] = spineAt(q, s0), [x1, y1] = spineAt(q, s1), w = q.w * 1.7 * (1 - s0 * 0.65);
    // the bark: dark edge, shaded flank, a lit ridge, rings of grain
    p.beam(x0, y0, x1, y1, w + 1, BARK[0]);
    p.beam(x0, y0, x1, y1, w, BARK[2]);
    p.beam(x0 - w * 0.3, y0, x1 - w * 0.3, y1, w * 0.35, BARK[4]);
    if (i % 3 === 1) p.line(x0 - w / 2, y0, x0 + w / 2, y0 + 1, BARK[1]);
  }
  // a branch or two off the side once it has grown
  if (g > 0.7) for (const s of [0.55, 0.8]) {
    const [bx, by] = spineAt(q, s), dir = q.x < TX ? -1 : 1, L = 8 * smooth(0.7, 1, g);
    p.line(bx, by, bx + dir * L, by - L * 0.7, BARK[2]);
    p.line(bx, by + 1, bx + dir * L, by - L * 0.7 + 1, BARK[1]);
  }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const grown = TRUNKS.map(() => false);
  const g = (q, t) => ease.outCubic(clamp((t - GROW - q.d) / 0.55));
  return {
    update(t, dt) {
      TRUNKS.forEach((q, i) => {
        if (!grown[i] && t >= GROW + q.d) {
          grown[i] = true;
          for (let j = 0; j < 10; j++) ps.spawn(P.GRIT, q.x + R.range(-4, 4), -1, R.range(-80, 80), -R.range(60, 180), R.range(0.5, 0.9), hex(["#3a3048", "#5a4c66", "#4a2e18"][j % 3]), R.chance(0.4) ? 2 : 1);
        }
      });
      ps.update(dt);
    },
    drawBack(p, t) {
      const pf = p.fade;
      p.fade = pf * (1 - smooth(END - 0.7, END - 0.1, t));
      // the split in the floor, racing from his palms to the target
      if (t > SPLIT) {
        const u = clamp((t - SPLIT) / 0.25), x1 = 14 + (TX + 60 - 14) * u;
        p.line(14, 0.5, x1, 0.5, BARK[0]);
        p.line(14, 1.5, x1, 1.5, hex("#120c18"));
      }
      // the far trunks, behind the target
      TRUNKS.forEach((q, i) => i % 2 && trunk(p, q, g(q, t), t));
      p.fade = pf;
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, BARK.slice(1).concat([LEAF[3]]));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "wood", t0: 0.05, t1: SEALS.end, label: "MOKUTON", head: b.head });
      const pf = p.fade;
      p.fade = pf * (1 - smooth(END - 0.7, END - 0.1, t));
      TRUNKS.forEach((q, i) => i % 2 || trunk(p, q, g(q, t), t));
      // the leaves bursting out along the grown trunks
      if (t > LEAVES) {
        const k = ease.outBack(clamp((t - LEAVES) / 0.3), 2);
        TRUNKS.forEach((q, i) => {
          for (let j = 0; j < 5; j++) {
            const [lx, ly] = spineAt(q, 0.6 + j * 0.09), x = lx + (rand(i * 7 + j, 1) - 0.5) * 10, y = ly + (rand(i * 7 + j, 2) - 0.5) * 8;
            p.circle(x, y, 3 * k, LEAF[1]);
            p.circle(x - 0.5, y - 0.5, 2 * k, LEAF[2]);
            p.px(x - 1, y - 1, LEAF[3]);
          }
        });
      }
      p.fade = pf;
      ps.draw(p, "front");
    },
  };
});
