// Tessenka no Mai: Hana (Dance of the Clematis: Flower, Kimimaro Kaguya). Narutopedia: with the Shikotsumyaku (bone
// pulse) and his cursed seal at its second level, Kimimaro wraps his left arm in a huge drill-shaped lance of
// hardened bone (Tessenka: Tsuru is the vine whip of spine; Hana the flower, the drill) and drives it forward; it
// pierced through Gaara's sand armour. Here: the cursed seal's dark marks crawl over his face and he coughs; bone erupts
// from his left arm, layer over layer, spiralling into a long tapering drill like a closed flower bud; he charges
// low and thrusts, the drill spinning, bone fragments spraying, through the target; the bone crumbles back into him.
// New: the bone drill (spiral layered plates, white with grey shading), the thrust; cursed seal marks.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { speedLines } from "./_taijutsu.js";

const SEAL = 0.3, GROW = 0.7, GROWN = 1.4, CHARGE = 1.6, HIT = 1.95, RETRACT = 2.7, END = 3.5, TX = 160;
const BONE = ["#6a6458", "#a8a294", "#d8d2c4", "#f8f4ec"].map(hex), CURSE = hex("#2a1a1a");

export const meta = {
  name: "Dance of the clematis: flower",
  desc: "Kimimaro: the cursed seal's marks crawl over his face; bone erupts from his left arm, layer over layer, into a long spiralling drill; he charges low and thrusts it, spinning, through the target in a spray of bone.",
  tags: ["jutsu", "kimimaro", "kaguya-clan", "bone", "shikotsumyaku", "melee", "pierce", "one-shot"],
  size: [240, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#6a6458", "#a8a294", "#d8d2c4", "#f8f4ec"], seed: 194 },
};

const ARMUP = { ...READY, crouch: 5, lean: -2, fx: 14, fy: -26, bx: -6, by: -18, ffx: 9, fbx: -9 };
const LUNGE = { ...READY, crouch: 11, lean: 18, fx: 26, fy: -22, bx: -10, by: -16, ffx: 16, fbx: -14, ghost: true };
export const act = {
  target: { x: TX },
  ghost: "#d8d2c4",
  poses: [
    [-0.25, READY],
    [SEAL, { ...READY, crouch: 4, lean: 6, fx: 6, fy: -20 }, "out"],
    [GROW, ARMUP, "out"],
    [CHARGE, { ...ARMUP, crouch: 9 }],
    [HIT, { ...LUNGE, x: TX - 50 }, "in"],
    [RETRACT, { ...LUNGE, x: TX - 50, lean: 10 }],
    [END, { ...ARMUP, x: TX - 50, gait: false }],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: GROW, shake: 0.3, amp: 1, target: false, sfx: "block" },
    { t: CHARGE, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.26, shake: 0.8, amp: 5, push: 6, straw: 50, flash: 0.05, sfx: "heavy" },
    ...[0.1, 0.2, 0.3].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 1, straw: 6, shiver: 0.5 })),
  ],
  dust: [{ t: CHARGE, x: 0, n: 10, dir: -1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t > HIT && t < HIT + 0.4 && R.chance(60 * dt)) ps.spawn(P.SPARK, TX + R.range(-6, 6), -28 + R.range(-6, 6), R.range(20, 160), R.range(-80, 40), R.range(0.2, 0.4), BONE[R.int(1, 3)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kimimaro", t0: 0.04, t1: SEAL, label: "TESSENKA: HANA", head: b.head });
      // the cursed seal's marks crawling over his face; the red dots on his brow
      p.px(hx - 1, hy - 4, hex("#c01a24")); p.px(hx + 1, hy - 4, hex("#c01a24"));
      if (t > SEAL) { const k = smooth(SEAL, SEAL + 0.3, t); for (let i = 0; i < 4; i++) p.line(hx - 2, hy - 2 + i * 2, hx + 2 + (i % 2), hy - 1 + i * 2, CURSE, k); }
      // the drill: from the forearm forward, layered spiral plates tapering to a point, spinning when thrust
      if (t > GROW) {
        const g = ease.outBack(smooth(GROW, GROWN, t), 1.3) * (1 - ease.inCubic(smooth(RETRACT, END - 0.2, t))), [ex, ey] = b.handN, L = 40 * g, R0 = 8 * g, spin = t > CHARGE ? t * 30 : t * 3;
        if (L > 1) {
          for (let i = 0; i < 10; i++) {
            const u0 = i / 10, u1 = (i + 1) / 10, r0 = R0 * (1 - u0 * 0.85), r1 = R0 * (1 - u1 * 0.85), x0 = ex - 6 + L * u0, x1 = ex - 6 + L * u1, tw = Math.sin(spin + i * 1.3);
            p.poly([[x0, ey - r0], [x1, ey - r1 + tw], [x1, ey + r1 + tw], [x0, ey + r0]], i % 2 ? BONE[2] : BONE[1]);
            p.line(x0, ey - r0, x1, ey + r1 * 0.6 + tw, BONE[0]);
            p.line(x0, ey - r0, x1, ey - r1 + tw, BONE[3]);
          }
          p.tri(ex - 6 + L, ey - 1.5, ex - 6 + L + 6 * g, ey, ex - 6 + L, ey + 1.5, BONE[3]);
        }
      }
      if (t > CHARGE && t < HIT) speedLines(p, b.chest[0] - 50, b.chest[1] - 12, b.chest[0] - 6, b.chest[1] + 12, t, 0.8, -1);
      if (t > HIT && t < HIT + 0.2) { const v = (t - HIT) / 0.2; p.ring(TX, -28, 4 + 20 * v, 1, BONE[3], 1 - v); }
      void rand; void noise2; void TAU; void WHITE; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
