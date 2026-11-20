// Fuuton: Shinkuu Gyoku (vacuum sphere). Narutopedia: seal Dog (manga); Danzou draws air into his lungs and spits small
// balls of wind from his mouth that fly at the enemy and cut it. The wiki picture: the ground behind the target pocked
// with the craters they left. Here: a breath, then a rapid burst of bullets of compressed air.
// Built from: a new air bullet (a spinning ring of bent light round a pale core, a wake of thin streaks), the library's
// hit spark recolored to wind on each hit, and the toolkit's dust and grit for the pits blown in the floor behind.
import { Particles, Lights, P, PF, Rng, READY, fit, clamp, smooth, hex, WHITE, TAU } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["inu"], 0.12, { hold: 0.28 });
const BREATH = SEALS.end, FIRE = BREATH + 0.4, GAP = 0.085, SPEED = 380, TX = 136;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
// each bullet: aim height at the target (or past it into the floor), and a little sideways wobble
const SHOTS = [
  { y: -24, miss: false },
  { y: -18, miss: false },
  { y: -2, miss: true, x: TX + 18 },
  { y: -28, miss: false },
  { y: -2, miss: true, x: TX - 16 },
  { y: -20, miss: false },
  { y: -2, miss: true, x: TX + 34 },
];
const at = (i) => FIRE + i * GAP;
const endX = (s) => (s.miss ? s.x : TX - 8);
const flight = (s) => Math.hypot(endX(s) - MX, s.y - MY) / SPEED;
const land = (i) => at(i) + flight(SHOTS[i]);
const WIND = ["#16302a", "#2f5e4e", "#5f9e86", "#a4d8c2", "#d8f4e8", "#ffffff"];
const DUST = ["#5e5048", "#7d6c60", "#a08c7a"].map(hex);

export const meta = {
  name: "Vacuum bullets",
  desc: "Fuuton: the Dog seal, a breath drawn deep, then a rapid burst of small balls of compressed air spat from the mouth that pelt the target and blow pits in the ground behind it.",
  tags: ["jutsu", "wind", "fuuton", "projectile", "move", "one-shot"],
  size: [260, 110],
  origin: [40, 96],
  duration: land(SHOTS.length - 1) + 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WIND, seed: 14 },
};

const INHALE = { ...READY, crouch: 2, lean: -7, fx: 7, fy: -25, bx: 9, by: -26, armsFront: true, ffx: 8, fbx: -8 };
const SPIT = { ...READY, crouch: 5, lean: 7, fx: 11, fy: -24, bx: -4, by: -21, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BREATH + 0.08, INHALE],
    [FIRE - 0.03, { ...INHALE, lean: -9 }],
    ...SHOTS.map((s, i) => [at(i), { ...SPIT, lean: 6 + (i % 2) * 2, crouch: 5 + (i % 2) }, "snap"]),
    [land(SHOTS.length - 1) + 0.4, { ...SPIT, lean: 3 }],
    [land(SHOTS.length - 1) + 0.9, READY],
    [meta.duration, READY],
  ],
  hits: SHOTS.map((s, i) => (s.miss ? null : { t: land(i), stop: 0.04, shake: 0.1, amp: 1, push: 1.4, straw: 8, y: s.y })).filter(Boolean),
  dust: [{ t: FIRE, x: 10, n: 4, dir: 1 }],
};

function shotAt(i, t) {
  const s = SHOTS[i], u = (t - at(i)) / flight(s);
  if (u < 0 || u >= 1) return null;
  return { x: MX + (endX(s) - MX) * u, y: MY + (s.y - MY) * u, u };
}

export const create = play(
  SHOTS.map((s, i) => (s.miss ? null : { fx: spark, t: land(i), x: TX - 12, height: -s.y, aim: 0.05, palette: [WIND[1], WIND[2], WIND[3], WIND[4], WIND[5], WIND[5], "#ffffff"], seed: 3 + i })).filter(Boolean),
  (o) => {
    const C = fit(o.palette, 6), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
    const ps = new Particles({ rng: R, ground: floor }), pits = [], done = SHOTS.map(() => false), out = SHOTS.map(() => false);
    return {
      update(t, dt) {
        if (t > BREATH && t < FIRE && R.chance(45 * dt)) {
          const a = R.range(-1.3, 1.3), d = R.range(9, 20), T = R.range(0.1, 0.15), v = (d * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, MX + 4 + Math.cos(a) * d, MY + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, C[4]);
        }
        SHOTS.forEach((s, i) => {
          if (!out[i] && t >= at(i)) {
            out[i] = true;
            for (let j = 0; j < 3; j++) ps.spawn(P.VAPOUR, MX + 4, MY, R.range(30, 70), R.range(-10, 10), R.range(0.2, 0.35), C[4], R.range(1.5, 2.5));
          }
          if (!done[i] && t >= land(i)) {
            done[i] = true;
            if (s.miss) {
              // it bores into the floor: a burst of dirt and a pit left behind
              pits.push({ x: s.x, age: 0 });
              for (let j = 0; j < 14; j++) ps.spawn(P.GRIT, s.x + R.range(-3, 3), -1, R.range(-60, 90), -R.range(60, 180), R.range(0.6, 1.1), DUST[R.int(0, 2)], R.chance(0.4) ? 2 : 1);
              for (let j = 0; j < 4; j++) ps.spawn(P.DUST, s.x, -2, R.range(-30, 50), -R.range(10, 30), R.range(0.5, 0.9), DUST[2], R.range(2, 4), 0, PF.BIG);
            }
            lights.add(endX(s), s.y, 30, C[4], 0.4, 0.08);
          }
        });
        for (const p of pits) p.age += dt;
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        // the pits: a dark scoop with a lip of dirt, settling dust
        for (const q of pits) {
          const k = 1 - smooth(1, 1.6, q.age);
          if (k <= 0) continue;
          p.ellipse(q.x, 0.5, 5, 1.4, hex("#141016"), 0.9 * k);
          p.ellipse(q.x, -0.5, 6, 1, DUST[1], 0.6 * k);
        }
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(1));
        SHOTS.forEach((s, i) => {
          const b = shotAt(i, t);
          if (!b) return;
          const ang = Math.atan2(s.y - MY, endX(s) - MX), ca = Math.cos(ang), sa = Math.sin(ang);
          // the wake: thin streaks peeling off behind it
          for (let k = 1; k <= 3; k++) p.line(b.x - ca * (4 + k * 5), b.y - sa * (4 + k * 5) + (k - 2) * 1.5, b.x - ca * (k * 5), b.y - sa * (k * 5) + (k - 2) * 1.5, C[k === 1 ? 4 : 3], 1 - k * 0.25);
          // the bullet: a ring of bent air turning round a pale core, white catch-light on the leading side
          const spin = t * 30 + i;
          p.ring(b.x, b.y, 4, 1, (v, a) => (Math.sin(a * 2 + spin) > 0.2 ? C[4] : C[2]));
          p.circle(b.x, b.y, 2, C[3]);
          p.px(b.x + ca, b.y + sa - 1, WHITE);
          p.glow(b.x, b.y, 10, C[3], 0.35);
        });
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);
