// Katon: Housenka no Jutsu (Phoenix flower). Narutopedia: fire chakra is melted in the belly and breathed out of the
// mouth; the seals are Rat, Tiger, Dog, Ox, Hare, Tiger, the last one held; many football-sized fireballs instead of one
// stream. The reference clip adds the staging: the last Tiger is held right at the lips, he leaps, and from the top of
// the jump spits the balls down at the ground ahead, where each one goes up in a billow of smoke and fire.
// Built from: the fire kit's flame blades and puffs (fire/_lib) for the balls, the library's small explosion (shrunk)
// for every landing, and the toolkit's blazes for the fires left burning.
import { Particles, Blazes, Lights, P, PF, Rng, READY, fit, ease, TAU } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import { noiseFor, hotFirst, flameBlade, LAYERS } from "../fire/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

// the effect's clock starts with the first seal (anything before t = 0 is never drawn), so the whole jutsu is laid out after it
const SEALS = sealRun(0.05, ["ne", "tora", "inu", "ushi", "u", "tora"], 0.11, { hold: 0.42, kind: "fire", last: { fx: 8, fy: -30, bx: 9, by: -30, lean: 0 } });
const T0 = SEALS.end, CROUCH = T0 + 0.02, LEAP = T0 + 0.12, TOP = T0 + 0.34, H = 30, SPIT = T0 + 0.36, GAP = 0.065, FALL = T0 + 0.86, LAND = T0 + 1.02, TX = 150;
// the balls: where each lands on the floor and how long it flies; they fan out over the ground ahead
const BALLS = [
  [118, 0.38],
  [86, 0.3],
  [TX, 0.42],
  [104, 0.34],
  [176, 0.48],
  [134, 0.4],
];
const at = (i) => SPIT + i * GAP;
const land = (i) => at(i) + BALLS[i][1];
const HIT = land(2);
// the mouth at the top of the jump, leaning into the spit
const MX = 10, MY = -31 - H + 2;

export const meta = {
  name: "Phoenix flower",
  desc: "Katon: Rat, Tiger, Dog, Ox, Hare, Tiger held at the lips, a leap, and from the top of it six fireballs spat down over the ground, each bursting in smoke and fire.",
  tags: ["jutsu", "fire", "katon", "move", "projectile", "spread", "one-shot"],
  size: [320, 230],
  origin: [56, 196],
  duration: HIT + 5.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], seed: 3 },
};

const TIGER = SEALS.keys[SEALS.keys.length - 1][1];
const DUCK = { ...TIGER, crouch: 8, lean: 3 };
const RISE = { ...READY, y: -H, crouch: 1, lean: -2, fx: 8, fy: -30, bx: 9, by: -30, armsFront: true, ffx: 5, ffy: -5, fbx: -6, fby: -3 };
const BLOW = { ...RISE, lean: 8, crouch: 3, fx: 12, fy: -26, bx: -4, by: -28, ffx: 7, ffy: -7, fbx: -8, fby: -2 };
const DOWN = { ...READY, crouch: 9, lean: 4, fx: 13, fy: -12, bx: -3, by: -16, ffx: 10, fbx: -9 };

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [CROUCH, DUCK],
    [LEAP, DUCK],
    [TOP, RISE, "out"],
    [SPIT, BLOW, "snap"],
    ...BALLS.slice(1).map((b, i) => [at(i + 1), { ...BLOW, lean: 8 + ((i + 1) % 2) * 2, crouch: 3 + ((i + 1) % 2) }, "snap"]),
    [FALL, { ...BLOW, lean: 4 }],
    [LAND, DOWN, "in"],
    [LAND + 0.5, { ...DOWN, crouch: 5 }],
    [LAND + 1.1, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.14, shake: 0.3, amp: 2, push: 3, straw: 26, skin: "char" },
    { t: land(5), stop: 0.03, flash: 0, push: 1, straw: 8 },
    { t: LAND, stop: 0.04, flash: 0, shake: 0.12, amp: 1, target: false },
    { t: meta.duration - 0.6, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: LEAP, x: 0, n: 6 }, { t: LAND, x: 2, n: 8 }],
};

// a ball's flight: straight down at the ground with a little sag, from the mouth to its spot
function ballAt(i, t) {
  const u = (t - at(i)) / BALLS[i][1];
  if (u < 0 || u >= 1) return null;
  const [x1, T] = BALLS[i], y1 = i === 2 ? -18 : -1, e = ease.inQuad(u) * 0.35 + u * 0.65;
  const x = MX + (x1 - MX) * u, y = MY + (y1 - MY) * e, dy = ((y1 - MY) * (0.65 + 0.7 * u)) / T, dx = (x1 - MX) / T;
  return { x, y, ang: Math.atan2(dy, dx) };
}

export const create = play(
  BALLS.map(([x], i) => ({ fx: blast, t: land(i), x, size: i === 2 ? 0.4 : 0.3, light: 0.7, seed: 7 + i })),
  (o) => {
    const F = fit(o.palette, 9), H2 = hotFirst(F), R = new Rng(o.seed + 40), floor = () => 0, NL = noiseFor(0);
    const ps = new Particles({ rng: R, ground: floor }), blazes = new Blazes(ps), lights = new Lights();
    const lit = BALLS.map(() => false), spat = BALLS.map(() => false);
    return {
      update(t, dt) {
        // the held Tiger: heat drawn up into the chest, sparks gathering at the lips
        if (t > SEALS.end - 0.4 && t < SPIT && R.chance(55 * dt)) {
          const cx = t < LEAP ? 8 : MX, cy = t < LEAP ? -31 : MY - 1, a = R.range(0, TAU), d = R.range(8, 18), T = R.range(0.07, 0.12), v = (d * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, cx + Math.cos(a) * d, cy + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? F[6] : F[4]);
        }
        BALLS.forEach(([x], i) => {
          if (!spat[i] && t >= at(i)) {
            spat[i] = true;
            lights.add(MX + 3, MY + 2, 40, F[5], 0.7, 0.12);
            for (let j = 0; j < 6; j++) ps.spawn(P.FIRE, MX + 3, MY + 2, R.range(20, 90), R.range(10, 80), R.range(0.12, 0.24), 0, R.range(1.2, 2.2), 0, R.chance(0.4) ? PF.SMOKES : 0);
          }
          const b = ballAt(i, t);
          if (b) {
            // the tail: flame puffs left where the ball has been, cooling into smoke
            const n = Math.max(1, Math.round(140 * dt));
            for (let j = 0; j < n; j++)
              if (R.chance(0.85)) ps.spawn(P.FIRE, b.x + R.range(-1.5, 1.5), b.y + R.range(-1.5, 1.5), -Math.cos(b.ang) * R.range(5, 30), -Math.sin(b.ang) * R.range(5, 30) - 10, R.range(0.14, 0.32), 0, R.range(2, 3.4), 0, R.chance(0.3) ? PF.SMOKES : 0);
            if (R.chance(16 * dt)) ps.spawn(P.SPARK, b.x, b.y, -Math.cos(b.ang) * 60 + R.range(-30, 30), -Math.sin(b.ang) * 60 - R.range(0, 40), R.range(0.15, 0.35), F[R.int(5, 7)]);
          }
          if (!lit[i] && t >= land(i)) {
            lit[i] = true;
            blazes.add(x + R.range(-3, 3), 0, R.range(1.6, 2.6), R.range(0.8, 1.1));
          }
        });
        blazes.update(dt);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, F.slice(2));
        ps.draw(p, "front");
        // the balls: an orange ball of fire, yellow at heart, three tongues swept back off it
        const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
        BALLS.forEach((_, i) => {
          const b = ballAt(i, t);
          if (!b) return;
          const r = i === 2 ? 4.4 : 3.6 + (i % 3) * 0.3, ux = -Math.cos(b.ang), uy = -Math.sin(b.ang), nx = -uy, ny = ux;
          [[0, 10], [1, 7], [-1, 7]].forEach(([side, len], j) => {
            const n = i * 31 + j * 7;
            flameBlade(p, b.x + nx * side * r * 0.5, b.y + ny * side * r * 0.5, ux, uy, len * (r / 3.6) * (0.85 + 0.25 * N(6, n)), r * 0.9, side * 1.4 + N(5, n + 3), N, n, H2, LAYERS, 0.5, 0.9);
          });
          p.circle(b.x, b.y, r, H2[4]);
          p.circle(b.x - 0.4, b.y - 0.4, r * 0.7, H2[3]);
          p.circle(b.x - 0.6, b.y - 0.6, r * 0.4, H2[2]);
          p.px(b.x - 1, b.y - 1, H2[1]);
          p.glow(b.x, b.y, 20 + r * 3, H2[3], 0.45);
        });
        lights.draw(p);
      },
    };
  },
);
