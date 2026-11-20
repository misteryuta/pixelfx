// Bakuton: C1 (Explosion Release, Deidara). Narutopedia: Deidara's explosive clay; the mouths on his palms chew clay
// kneaded with his chakra, he shapes it into small creatures like birds that fly to their target on their own, and with
// a one-handed seal and "Katsu!" they blow up; for him art is the moment something is destroyed. Here: the mouth in his
// palm chewing, little white clay birds spat out and taking wing, swooping in on the target, his one-handed seal, KATSU,
// and they burst one after another.
// New: the clay birds (shaped and flapping, white clay), the palm's chewing mouth. From the library: the small
// explosion for each bird.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import { play, bodyAt, arcPath } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const MOUTH = 0.05, CHEW = 0.55, SPIT = CHEW + 0.4, BIRDS = 5, BG = 0.1, FLY = 0.7, SEAL = SPIT + BIRDS * BG + FLY - 0.05, KATSU = SEAL + 0.15, BOOMG = 0.09, END = KATSU + BIRDS * BOOMG + 5.3, TX = 150;
const CLAY = ["#8a8478", "#c8c2b0", "#f0ece0", "#ffffff"].map(hex);
// each bird: where it ends up on the target
const SPOT = [[-8, -40], [6, -24], [-4, -12], [8, -46], [-10, -28]];

export const meta = {
  name: "C1 clay birds",
  desc: "Deidara: the mouth in his palm chews clay, spits out little white clay birds that take wing and swoop onto the target, and with his one-handed seal and KATSU they burst one after another.",
  tags: ["jutsu", "deidara", "akatsuki", "explosion", "projectile", "one-shot"],
  size: [290, 200],
  origin: [50, 166],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#8a8478", "#c8c2b0", "#f0ece0", "#ffffff"], seed: 58 },
};

const PALMUP = { ...READY, crouch: 3, lean: 1, fx: 14, fy: -26, bx: -4, by: -18, ffx: 8, fbx: -8 };
const SEALP = { ...READY, crouch: 4, lean: 2, fx: 6, fy: -32, bx: -2, by: -20, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHEW, PALMUP, "out"],
    ...Array.from({ length: BIRDS }, (_, i) => [SPIT + i * BG, { ...PALMUP, fx: 16 + (i % 2), fy: -27 + (i % 2) }, "snap"]),
    [SEAL, SEALP, "snap"],
    [END, SEALP],
  ],
  hits: [
    ...Array.from({ length: BIRDS }, (_, i) => ({ t: KATSU + i * BOOMG, stop: i === BIRDS - 1 ? 0.14 : 0.04, shake: 0.2 + i * 0.05, amp: 2, push: 1.4, straw: 12, skin: i ? undefined : "char", flash: i === BIRDS - 1 ? 0.05 : 0 })),
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

const birdPath = (i) => arcPath(18, -30, TX + SPOT[i][0], SPOT[i][1], 22 + i * 8);
const birdAt = (i, t) => {
  const t0 = SPIT + i * BG, u = clamp((t - t0) / FLY);
  if (t < t0) return null;
  return { ...birdPath(i)(u), u };
};

export const create = play(SPOT.map(([x, y], i) => ({ fx: blast, t: KATSU + i * BOOMG, x: TX + x, y: y + 10, size: 0.32, seed: 70 + i })), (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "deidara", t0: MOUTH, t1: CHEW, label: "BAKUTON", head: b.head });
      // the palm's mouth, chewing (a dark slit opening and closing on the near hand)
      if (t > CHEW - 0.2 && t < SEAL) {
        const [hx, hy] = b.handN, o2 = Math.abs(Math.sin(t * 16));
        p.line(hx - 1, hy - 1, hx + 1, hy - 1, hex("#5a1420"));
        if (o2 > 0.5) p.px(hx, hy, hex("#e86a8a"));
      }
      // the birds: spat out one at a time, wings beating, swooping in and clinging to the target until KATSU
      for (let i = 0; i < BIRDS; i++) {
        const q = birdAt(i, t);
        if (!q || t >= KATSU + i * BOOMG) continue;
        const { x, y } = q, flap = q.u < 1 ? Math.sin(t * 30 + i * 2) * 3 : 0.5, s = q.u < 0.08 ? q.u / 0.08 : 1;
        p.ellipse(x, y, 3 * s, 1.6 * s, CLAY[2]);
        p.circle(x + 2.6 * s, y - 1, 1.3 * s, CLAY[2]);
        p.px(x + 4 * s, y - 1, CLAY[0]);
        p.tri(x - 1, y - 0.5, x - 4 * s, y - flap * s, x + 1, y - 0.5, CLAY[3]);
        p.line(x - 3 * s, y + 0.5, x - 5 * s, y + 1, CLAY[1]);
        if (t > SEAL && q.u >= 1) p.px(x, y, (Math.floor(t * 20) & 1) ? hex("#ff8a2a") : CLAY[2]);
      }
      // KATSU!
      const a = t - KATSU;
      if (a > -0.08 && a < 0.8) p.text("KATSU!", 6, -70, a < 0.05 ? WHITE : hex("#ffc23d"), { font: "big", align: "center", outline: hex("#120c18") });
      ps.draw(p, "front");
    },
  };
});
