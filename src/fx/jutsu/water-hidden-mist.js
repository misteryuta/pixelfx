// Kirigakure no Jutsu (hidden mist). Narutopedia: a D-rank Suiton jutsu loved in Kirigakure; it raises the moisture in
// the air into a thick mist the enemy is lost in, while the user still sees every movement. Shown with the seal of
// confrontation held in one hand (the sign used for chakra control, Shunshin and the like); the wiki lists no seals.
// Built from: the water kit's mist puffs and ripples (water/_lib) for the fog that boils up out of the ground and rolls
// out over everything, with slow banks of fog drawn across the scene in layers, a cold light, and the caster
// dissolving into it until only a glint of the eyes is left.
import { Lights, Rng, READY, fit, clamp, smooth, mix, hex, noise, WHITE } from "../../core/index.js";
import { WATER, Ripples, Mist } from "../water/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const SEALS = sealRun(0.05, ["tairitsu"], 0.12, { hold: 0.7 });
const RISE = SEALS.end - 0.45, THICK = RISE + 1.4, HOLD = THICK + 1.6, THIN = HOLD + 1.6, TX = 130;
const FOG = ["#9fb6bc", "#b9ccd0", "#d4e2e4", "#eef6f6"].map(hex);

export const meta = {
  name: "Hidden mist",
  desc: "Suiton: the seal of confrontation held before the face while a thick mist boils up off the ground and rolls out over the whole scene, swallowing caster and target, then thins away.",
  tags: ["jutsu", "water", "suiton", "mist", "support", "one-shot"],
  size: [280, 142],
  origin: [60, 112],
  duration: THIN + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WATER, seed: 9 },
};

const HELD = SEALS.keys[0][1];
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [THICK, { ...HELD, crouch: 5 }],
    [HOLD, { ...HELD, crouch: 5 }],
    [HOLD + 0.4, READY],
    [meta.duration, READY],
  ],
  hits: [],
};

// how thick the mist is over the scene at time t, and how far out it has rolled from the caster
const density = (t) => smooth(RISE, THICK, t) * (1 - smooth(HOLD, THIN, t));
const reach = (t) => 20 + 200 * smooth(RISE, THICK, t);

export const create = play([], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed), lights = new Lights(), ripples = new Ripples({ sy: 0.25 }), mist = new Mist();
  return {
    update(t, dt) {
      const k = density(t);
      // the moisture gathers: puffs boil up off the ground round the caster and roll outward
      if (t > RISE && t < HOLD) {
        const n = Math.max(1, Math.round(40 * dt));
        for (let j = 0; j < n; j++) {
          const x = R.range(-20, Math.min(reach(t), 180)), y = -R.range(0, 30);
          mist.add(x, y, R.range(-10, 25), -R.range(2, 10), R.range(5, 9), R.range(16, 30), R.range(1.4, 2.4), FOG[R.int(0, 2)], 0.1 + 0.1 * k);
        }
      }
      // the ground goes wet under the caster's feet: rings spread, as if standing on water
      if (t > RISE && t < THIN && R.chance(3 * dt)) ripples.add(R.range(-4, 4), 0, 1, R.range(10, 20), 1, { n: 2, gap: 3, k: 0.6 });
      if (t > RISE && R.chance(1.5 * dt)) lights.add(R.range(0, 160), -R.range(10, 40), 70, FOG[3], 0.15, 0.6);
      mist.update(dt);
      ripples.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ripples.draw(p, C, -1);
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(2));
      const k = density(t);
      ripples.draw(p, C, 1);
      // chakra gathering at the raised fingers while the seal is held
      if (t > RISE && t < THICK) p.glow(9, -30, 10, C[5], 0.4 * (1 - smooth(THICK - 0.4, THICK, t)));
      // banks of fog in three layers drifting at their own speeds, thick near the ground, torn at the top
      // (soft translucent discs, never a dithered screen: fog has no hard pixels)
      if (k > 0.01)
        for (let layer = 0; layer < 3; layer++)
          for (let i = 0; i < 10; i++) {
            const sp = 6 + layer * 5, span = 230;
            const x = ((i * 23 + layer * 11 + t * sp) % span) - 30, y = -4 - layer * 13 + 3 * noise(i * 1.7 + t * 0.4, layer);
            const edge = clamp((reach(t) + 10 - x) / 40);
            if (edge <= 0) continue;
            const r = 16 + ((i * 7 + layer * 3) % 5) * 4 - layer * 2;
            // falls off to nothing at the rim, so the banks melt into each other instead of showing circles
            const a0 = (0.26 - layer * 0.06) * k * edge;
            p.disc(x, y, r, (d) => (d < 0.4 ? FOG[2 - Math.min(layer, 1)] : FOG[1]), (d) => a0 * (1 - d * d) * (1 - d * d));
          }
      mist.draw(p, FOG[2]);
      // inside the mist the user sees everything: a cold glint where the eyes are
      if (k > 0.6) {
        const g = 0.5 + 0.5 * Math.sin(t * 5);
        p.px(8, -33, C[6]);
        p.glow(8, -33, 5, C[5], 0.4 * g * k);
      }
      lights.draw(p);
    },
  };
});
