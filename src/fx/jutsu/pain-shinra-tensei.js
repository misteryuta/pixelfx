// Shinra Tensei (Almighty Push, Pain / Deva Path). Narutopedia: the pinnacle of the Deva Path; the user creates a
// repulsive force, usually all round them, that pushes everything away; it can be aimed or narrowed, and there is an
// interval of about five seconds before it can be used again. Here: the Rinnegan, a hand raised, a beat of stillness
// while the air bends round him, then the push: a sphere of force bursts outward, bending what's behind it as it passes,
// scouring the floor, and throws the target away.
// New: the bending air (_lib warp pushing outward, a lens riding the front), the sphere's edge, the scoured ground.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, RAISE = OPEN + 0.1, HUSH = RAISE + 0.35, PUSH = HUSH + 0.05, OUT = 0.5, TX = 92, RMAX = 120;
const RG = ["#2a2048", "#5a4a8a", "#9a86d0", "#d4c8f4", "#ffffff"].map(hex);

export const meta = {
  name: "Almighty push",
  desc: "Pain: the Rinnegan, a hand raised, the air bending round him in a beat of stillness, then a sphere of force bursts outward, bending what's behind it, scouring the floor and throwing the target away.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "aoe", "knockback", "one-shot"],
  size: [300, 218],
  origin: [130, 150],
  duration: PUSH + OUT + 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2048", "#5a4a8a", "#9a86d0", "#d4c8f4", "#ffffff"], seed: 46 },
};

const LIFT = { ...READY, crouch: 1, lean: -2, fx: 16, fy: -26, bx: -2, by: -18, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 1, fx: 4, fy: -17, bx: -2, by: -17 }],
    [RAISE + 0.2, LIFT, "out"],
    [PUSH, { ...LIFT, lean: 2, fx: 18 }, "snap"],
    [meta.duration, LIFT],
  ],
  hits: [
    { t: PUSH, stop: 0.04, shake: 0.4, amp: 3, target: false },
    { t: PUSH + (TX / RMAX) * OUT * 0.6, stop: 0.16, shake: 0.3, amp: 3, push: 7, straw: 40 },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let pushed = false;
  const radius = (t) => RMAX * ease.outCubic(clamp((t - PUSH) / OUT));
  return {
    update(t, dt) {
      if (!pushed && t >= PUSH) {
        pushed = true;
        // the floor scoured: dust and grit thrown outward from under him
        for (let i = 0; i < 40; i++) {
          const s = (R.chance(0.5) ? 1 : -1) * R.range(80, 260);
          ps.spawn(P.DUST, R.range(-8, 8), -1, s, -R.range(4, 30), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
          if (i % 2) ps.spawn(P.GRIT, R.range(-6, 6), -1, s * 1.2, -R.range(20, 90), R.range(0.5, 0.9), hex("#5a4c66"));
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      // the floor under the push: a ring scoured clean
      if (t > PUSH) {
        const r = radius(t), k = 1 - smooth(PUSH + OUT, PUSH + OUT + 1, t);
        p.ellipse(0, 0.5, r * 0.9, 2.5, hex("#120c18"), 0.6 * k);
      }
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPEN, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", OPEN + 0.05, meta.duration - 0.4, b.head);
      // the hush before it: the air round him bends, pulled in tight
      if (t > RAISE && t < PUSH) {
        const u = smooth(RAISE, PUSH, t);
        warp(p, 0, -22, 30, 0, 0.25 * u);
        p.ring(0, -22, 30 - 6 * u, 1, RG[2], 0.3 + 0.5 * u);
      }
      // the push: a lens riding the front of the sphere, bending everything behind it outward
      if (t >= PUSH && t < PUSH + OUT + 0.15) {
        const r = radius(t), k = 1 - smooth(PUSH + OUT - 0.1, PUSH + OUT + 0.15, t);
        if (t < PUSH + 0.05) p.circle(0, -22, 16, WHITE);
        if (r > 8) {
          warp(p, 0, -22, Math.min(r, 90), 0, -0.12 * k);
          p.ring(0, -22, r, 2, RG[3], k);
          p.ring(0, -22, r - 3, 1, RG[2], 0.6 * k);
          p.ring(0, -22, r + 2, 1, WHITE, 0.5 * k);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU + rand(i, 3);
            p.line(Math.cos(a) * (r - 10), -22 + Math.sin(a) * (r - 10), Math.cos(a) * (r + 4), -22 + Math.sin(a) * (r + 4), RG[4], 0.7 * k);
          }
        }
      }
      ps.draw(p, "front");
    },
  };
});
