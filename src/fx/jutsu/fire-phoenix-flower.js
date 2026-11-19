// Fire release: a burst of small fireballs spat in a fan. The balls are the library fireball's recipe made small:
// its swept-back flame blades and white-hot head (fire/_lib), but the tail is left in the world as real flame puffs,
// so it bends along each arc instead of trailing straight behind. The ball that finds the target gets the library's
// small explosion (shrunk) and hit spark; the ones on the floor pop and leave the toolkit's blazes burning.
import { Particles, Blazes, Lights, P, PF, Rng, READY, fit, clamp, smooth, mix, hex, WHITE, TAU } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import * as spark from "../impacts/hit-spark.js";
import { noiseFor, hotFirst, flameBlade, LAYERS } from "../fire/_lib.js";
import { play, seals, arcPath, MOUTH } from "./_lib.js";

const SPIT = 0.38, GAP = 0.075, TX = 132;
// the volley: where each ball lands [x, y (0 is the floor), flight time, arc height, radius]; the third finds the target
const BALLS = [
  [92, 0, 0.42, 20, 2.6],
  [168, 0, 0.6, 34, 2.2],
  [TX - 2, -20, 0.46, 18, 3.2],
  [112, 0, 0.5, 30, 2.4],
  [190, 0, 0.66, 38, 2.2],
];
const at = (i) => SPIT + i * GAP;
const land = (i) => at(i) + BALLS[i][2];
const HIT = land(2);

export const meta = {
  name: "Phoenix flower",
  desc: "Fire release: seals, a breath drawn through a cupped hand, then five small fireballs spat in a fan that arc down over the floor, one into the target, leaving little fires.",
  tags: ["jutsu", "fire", "move", "projectile", "spread", "one-shot"],
  size: [300, 212],
  origin: [56, 188],
  duration: HIT + 5.45,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], seed: 3 },
};

// breathing in: the near hand rolled into a tube at the mouth, the chest filling and leaning back
const DRAW = { ...READY, crouch: 2, lean: -4, fx: 9, fy: -30, bx: 9, by: -22, armsFront: true, ffx: 8, fbx: -8 };
const SPAT = { ...READY, crouch: 5, lean: 6, fx: 12, fy: -30, bx: 2, by: -20, ffx: 11, fbx: -10, toeB: true };

export const act = {
  target: { x: TX },
  poses: [
    [-0.8, READY],
    ...seals(-0.62, 4, 0.12),
    [0, DRAW],
    [SPIT - 0.04, { ...DRAW, lean: -6, crouch: 1 }],
    [SPIT, SPAT, "snap"],
    [at(2), { ...SPAT, lean: 4, crouch: 4 }, "snap"],
    [at(4), { ...SPAT, lean: 5 }, "snap"],
    [at(4) + 0.5, { ...SPAT, lean: 2, crouch: 3 }],
    [at(4) + 1.2, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.14, shake: 0.3, amp: 2, push: 3, straw: 26, skin: "char" },
    { t: land(3), stop: 0.03, push: 0.8, straw: 6 },
    { t: meta.duration - 0.6, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: SPIT, x: 12, n: 5, dir: 1 }],
};

const paths = BALLS.map(([x, y, , h]) => arcPath(MOUTH[0] + 3, MOUTH[1], x, y - 2, h));
const ballAt = (i, t) => {
  const u = (t - at(i)) / BALLS[i][2];
  return u < 0 || u >= 1 ? null : paths[i](u);
};

export const create = play(
  [
    { fx: spark, t: HIT, x: BALLS[2][0] - 6, height: 20, aim: 0.15 },
    { fx: blast, t: HIT, x: BALLS[2][0], size: 0.34, light: 0.7 },
  ],
  (o) => {
    const F = fit(o.palette, 9), H = hotFirst(F), R = new Rng(o.seed + 40), floor = () => 0, NL = noiseFor(0);
    const ps = new Particles({ rng: R, ground: floor }), blazes = new Blazes(ps), lights = new Lights();
    const lit = BALLS.map(() => false), spat = BALLS.map(() => false);
    const [mx, my] = MOUTH;
    return {
      update(t, dt) {
        // the breath: sparks and flecks of flame drawn in to the cupped hand
        if (t > 0 && t < SPIT && R.chance(60 * dt)) {
          const a = R.range(0, TAU), d = R.range(9, 20), T = R.range(0.08, 0.14), v = (d * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, mx + 2 + Math.cos(a) * d, my + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? F[6] : F[4]);
        }
        if (t > SPIT - 0.2 && t < SPIT && R.chance(30 * dt)) ps.spawn(P.FIRE, mx + 3, my, R.range(5, 20), R.range(-20, -5), R.range(0.1, 0.2), 0, R.range(0.8, 1.4));
        BALLS.forEach(([x, y, , , r], i) => {
          // each spit: a puff of flame off the lips and a flash of light
          if (!spat[i] && t >= at(i)) {
            spat[i] = true;
            lights.add(mx + 4, my, 34, F[5], 0.6, 0.12);
            for (let j = 0; j < 5; j++) ps.spawn(P.FIRE, mx + 4, my, R.range(40, 110), R.range(-40, 10), R.range(0.12, 0.24), 0, R.range(1, 2), 0, R.chance(0.4) ? PF.SMOKES : 0);
          }
          // in flight: the ball sheds flame puffs where it has been, so its tail follows the arc
          const b = ballAt(i, t);
          if (b) {
            const n = Math.max(1, Math.round(110 * dt));
            for (let j = 0; j < n; j++)
              if (R.chance(0.8)) ps.spawn(P.FIRE, b.x + R.range(-1, 1), b.y + R.range(-1, 1), -Math.cos(b.ang) * R.range(5, 25), -Math.sin(b.ang) * R.range(5, 25) - 8, R.range(0.12, 0.3), 0, r * R.range(0.5, 0.85), 0, R.chance(0.2) ? PF.SMOKES : 0);
            if (R.chance(14 * dt)) ps.spawn(P.SPARK, b.x, b.y, -Math.cos(b.ang) * 60 + R.range(-30, 30), -Math.sin(b.ang) * 60 - R.range(0, 40), R.range(0.15, 0.35), F[R.int(5, 7)]);
          }
          // each landing on the floor: a white blink, a splash of flame thrown low and forward, sparks, a fire that stays
          if (!lit[i] && t >= land(i)) {
            lit[i] = true;
            if (y === 0) {
              lights.add(x, -3, 30, F[5], 0.7, 0.14);
              lights.add(x, -2, 10, WHITE, 0.6, 0.05);
              for (let j = 0; j < 9; j++) {
                const a = -Math.PI / 2 + R.range(-1.2, 1.3), sp = R.range(30, 90);
                ps.spawn(P.FIRE, x, -1, Math.cos(a) * sp + 15, Math.sin(a) * sp * 0.7, R.range(0.2, 0.42), 0, R.range(1.4, 2.6), 0, R.chance(0.35) ? PF.SMOKES : 0);
              }
              for (let j = 0; j < 7; j++) {
                const a = -Math.PI / 2 + R.range(-1.3, 1.3), sp = R.range(80, 220);
                ps.spawn(P.SPARK, x, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.15, 0.4), F[R.int(5, 7)]);
              }
              for (let j = 0; j < 3; j++) ps.spawn(P.DUST, x + R.range(-3, 3), -1, R.sign() * R.range(15, 40), -R.range(3, 10), R.range(0.4, 0.7), hex("#6a5a5e"), R.range(1.5, 2.5));
              blazes.add(x + R.range(-2, 2), 0, R.range(1.4, 2.2), R.range(0.7, 1));
            } else for (let j = 0; j < 2; j++) blazes.add(x + R.range(-6, 4), 0, R.range(1, 1.5), 0.6);
          }
        });
        blazes.update(dt);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        ps.draw(p, "back");
        // scorch marks where the balls came down, cooling from ember red to soot
        BALLS.forEach(([x, y], i) => {
          const a = t - land(i);
          if (a < 0 || y !== 0) return;
          const k = 1 - smooth(1.6, 2.4, a), hot = 1 - smooth(0.1, 1.2, a);
          p.ellipse(x, 0.5, 7, 1.6, mix(hex("#140c10"), F[2], hot * 0.8), 0.7 * k);
          if (hot > 0.05) p.glow(x, -1, 14, F[4], 0.35 * hot);
        });
      },
      draw(p, t) {
        // a coal of fire glowing in the hand while the breath is drawn
        const g = t > 0 && t < SPIT ? smooth(0, SPIT, t) : 0;
        if (g > 0) {
          p.circle(mx + 3, my, 1 + 1.5 * g, F[6]);
          p.circle(mx + 3, my, 0.8 * g, WHITE);
          p.glow(mx + 3, my, 16, F[5], 0.5 * g);
        }
        ps.draw(p, "front");
        // the balls: three short flame blades swept back off a white-hot head, a warm light round each
        const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
        BALLS.forEach(([, , , , r], i) => {
          const b = ballAt(i, t);
          if (!b) return;
          const ux = -Math.cos(b.ang), uy = -Math.sin(b.ang), nx = -uy, ny = ux;
          [[0, 7.5], [1, 5.5], [-1, 5.5]].forEach(([side, len], j) => {
            const n = i * 31 + j * 7;
            flameBlade(p, b.x + nx * side * r * 0.45, b.y + ny * side * r * 0.45, ux, uy, len * (r / 2.6) * (0.85 + 0.25 * N(6, n)), r * 0.85, side * 1.2 + N(5, n + 3), N, n, H, LAYERS, 0.4, 0.8);
          });
          p.circle(b.x, b.y, r, H[2]);
          p.circle(b.x - 0.3, b.y - 0.3, r * 0.62, H[1]);
          p.circle(b.x - 0.4, b.y - 0.4, r * 0.3, WHITE);
          p.glow(b.x, b.y, 18 + r * 3, H[3], 0.4);
        });
        lights.draw(p);
      },
    };
  },
);
