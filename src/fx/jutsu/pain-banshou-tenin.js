// Banshou Ten'in (Universal Pull, Pain / Deva Path). Narutopedia: the Deva Path's attractive force pulls matter toward
// the user at will; it can be localised to one target without moving what it's attached to, and shares Shinra Tensei's
// five-second interval. Here: the Rinnegan, an open hand reaching for the target, and an invisible pull: the air between
// them bends into lines of force, dust and stones slide and fly toward him, the target is wrenched over and torn at,
// straw streaming off it into his grip, until he closes the hand.
// New: the lines of force (streaks converging on the hand), the dragged ground, the lens at the target (_lib warp).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, REACH = OPEN + 0.25, PULL = REACH + 0.1, GRIP = PULL + 1.1, TX = 150;
const RG = ["#2a2048", "#5a4a8a", "#9a86d0", "#d4c8f4", "#ffffff"].map(hex);

export const meta = {
  name: "Universal pull",
  desc: "Pain: the Rinnegan, an open hand reaching out, and the air bends into lines of force: dust and stones fly to him, the target is wrenched over with straw streaming off it into his grip, until he closes the hand.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "pull", "control", "one-shot"],
  size: [260, 150],
  origin: [50, 118],
  duration: GRIP + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2048", "#5a4a8a", "#9a86d0", "#d4c8f4", "#ffffff"], seed: 47 },
};

const OPENH = { ...READY, crouch: 3, lean: 2, fx: 19, fy: -27, bx: -2, by: -18, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 1, fx: 4, fy: -17, bx: -2, by: -17 }],
    [REACH, OPENH, "out"],
    [GRIP - 0.05, { ...OPENH, lean: -4, crouch: 5 }],
    [GRIP, { ...OPENH, lean: -6, fx: 14, fy: -25 }, "snap"],
    [meta.duration, { ...READY, crouch: 2 }],
  ],
  hits: [
    { t: PULL, stop: 0.08, flash: 0, push: -2.5, straw: 10, shiver: 0.4 },
    ...[0.3, 0.6, 0.9].map((d) => ({ t: PULL + d, stop: 0.02, flash: 0, push: -1.6, straw: 8, shiver: 0.4 })),
    { t: GRIP, stop: 0.1, shake: 0.2, amp: 2, push: -3, straw: 16 },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      if (t > PULL && t < GRIP) {
        const b = bodyAt(act.poses, t), [hx, hy] = b.handN;
        // straw and grit flying off the target and off the floor into his hand
        if (R.chance(70 * dt)) {
          const x = TX + R.range(-10, 10), y = -R.range(6, 46), T = R.range(0.3, 0.45);
          ps.spawn(P.SPARK, x, y, (hx - x) / T, (hy - y) / T - 20, T, hex(["#f0d98a", "#d2aa55", "#86643a"][R.int(0, 2)]));
        }
        if (R.chance(40 * dt)) {
          const x = R.range(30, TX + 40);
          ps.spawn(P.GRIT, x, -1, -R.range(80, 200), -R.range(10, 70), R.range(0.4, 0.8), hex(["#3a3048", "#5a4c66"][R.int(0, 1)]), R.chance(0.3) ? 2 : 1);
          ps.spawn(P.DUST, x, -2, -R.range(60, 140), -R.range(2, 12), R.range(0.4, 0.7), hex("#a08c7a"), R.range(2, 3), 0, 0);
        }
      }
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPEN, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", OPEN + 0.05, meta.duration - 0.4, b.head);
      if (t > PULL && t < GRIP + 0.15) {
        const k = smooth(PULL, PULL + 0.15, t) * (1 - smooth(GRIP, GRIP + 0.15, t));
        // the lens at the target: space dragged toward him
        warp(p, TX - 4, -26, 28, 0.4 * Math.sin(t * 20) * k, 0.18 * k);
        // lines of force: streaks racing from the target to his palm, along curves
        for (let i = 0; i < 7; i++) {
          const ph = ((t * 2.4 + i / 7) % 1), off = (i - 3) * 6;
          const x0 = TX - 4, y0 = -26 + off, u = ph, x = x0 + (hx - x0) * u, y = y0 + (hy - y0) * u + Math.sin(Math.PI * u) * off * 0.6;
          p.line(x, y, x + 10 * (1 - u), y, i % 2 ? RG[3] : RG[2], k * (1 - Math.abs(u - 0.5)));
        }
        p.glow(hx, hy, 14, RG[2], 0.7 * k);
        p.ring(hx, hy, 4 + 3 * Math.sin(t * 30), 1, RG[3], k);
      }
      ps.draw(p, "front");
    },
  };
});
