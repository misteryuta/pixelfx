// Wind release: three blades of compressed air breathed out one after another. The blades use the slash smear's
// recipe from melee/sword-slash (a crescent white at its leading rim, cooling down the ramp inward and towards its
// tips, with echoes a beat behind), but set free: each one is a flying crescent that swells as it leaves the mouth.
// Each lands with the library's hit spark recolored to wind, and leaves a cut drawn across the target.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, mix, hex, WHITE, TAU, sparkle } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

// Fuuton: Shinkuuha (Narutopedia): seals Rat, Snake, Horse, Dog; air is drawn into the lungs and blown out of the
// mouth as a blast that cuts like blades.
const SEALS = sealRun(0.05, ["ne", "mi", "uma", "inu"], 0.12, { hold: 0.1 });
const BREATH = SEALS.end, FIRE = BREATH + 0.5, GAP = 0.11, SPEED = 340, TX = 136;
// [height they travel at, tilt, full radius]
const BLADES = [
  { y: -27, rot: -0.22, R: 11 },
  { y: -21, rot: 0.18, R: 12 },
  { y: -25, rot: -0.05, R: 14 },
];
const at = (i) => FIRE + i * GAP;
const FLY = (TX - 8 - MOUTH[0]) / SPEED;
const hit = (i) => at(i) + FLY;
const WIND = ["#0e2a22", "#1c6a4a", "#2fae7a", "#5fe0a8", "#b0f5d6", "#e8fff4", "#ffffff"];

export const meta = {
  name: "Vacuum blades",
  desc: "Wind release: seals, a long breath in, then three crescents of cutting air breathed out one after another that swell as they fly and slash across the target.",
  tags: ["jutsu", "wind", "move", "projectile", "slash", "one-shot"],
  size: [270, 110],
  origin: [44, 92],
  duration: hit(2) + 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WIND, seed: 5 },
};

const BREATHE = { ...READY, crouch: 2, lean: -6, fx: 7, fy: -25, bx: 9, by: -27, armsFront: true, ffx: 8, fbx: -8 };
const BLOW = { ...READY, crouch: 5, lean: 7, fx: 12, fy: -22, bx: 3, by: -21, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BREATH + 0.08, BREATHE],
    [FIRE - 0.04, { ...BREATHE, lean: -8, crouch: 1 }],
    ...BLADES.flatMap((b, i) => [[at(i), { ...BLOW, lean: 6 + i * 2, crouch: 5 + (i & 1) }, "snap"], [at(i) + 0.06, { ...BLOW, lean: 4, crouch: 4 }]]),
    [at(2) + 0.5, { ...BLOW, lean: 2, crouch: 3 }],
    [at(2) + 1, READY],
    [meta.duration, READY],
  ],
  hits: BLADES.map((b, i) => ({ t: hit(i), stop: 0.05 + i * 0.04, shake: 0.1 + i * 0.06, amp: 1 + (i >> 1), push: 1.6 + i * 0.8, straw: 10 + i * 8, y: b.y + 4 })),
  dust: [{ t: FIRE, x: 12, n: 5, dir: 1 }],
};

// where blade i is at t, how far it has grown, and how far it has flown (0..1)
function bladeAt(i, t) {
  const a = t - at(i);
  if (a < 0 || t >= hit(i)) return null;
  const b = BLADES[i], g = ease.outCubic(clamp(a / 0.14));
  return { x: MOUTH[0] + 4 + a * SPEED, y: MOUTH[1] + (b.y - MOUTH[1]) * ease.outQuad(clamp(a / FLY)), R: 3 + (b.R - 3) * g, rot: b.rot * g, u: a / FLY };
}

// a flying crescent: convex forward, thickest in the middle, a white leading rim cooling inward and to the tips
function crescent(p, C, x, y, R, rot, alpha, W = R * 0.55) {
  // a moon: inside the outer oval, outside an inner one pushed back by W, so it is fat in the middle and sharp at the tips
  const n = C.length, c = Math.cos(rot), s = Math.sin(rot), B = R + 2, SX = 1.35;
  p.shade(x - B, y - B, x + B, y + B, (px, py, out) => {
    const dx = px - x, dy = py - y, lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const ro = Math.hypot(lx * SX, ly), ri = Math.hypot((lx + W) * SX, ly);
    if (ro > R || ri < R || lx < -R * 0.55) return;
    // depth from the leading rim, and how near a tip
    const d = R - ro, v = Math.abs(ly) / R;
    const ci = d < 1 ? 0 : d < 2.2 ? 1 : 2 + Math.round((d - 2.2) * 0.6);
    out.c = C[n - 1 - clamp(ci + Math.round(v * v * 2.5), 0, n - 2)];
    out.a = alpha * (v > 0.8 ? 0.65 : 1);
  });
}

export const create = play(
  BLADES.map((b, i) => ({ fx: spark, t: hit(i), x: TX - 10, height: -b.y - 2, aim: 0.05 + b.rot, palette: [WIND[1], WIND[2], WIND[3], WIND[4], WIND[5], WIND[6], "#ffffff"], seed: 4 + i })),
  (o) => {
    const C = fit(o.palette, 7), R = new Rng(o.seed + 3), floor = () => 0, DUST = hex("#7a7486");
    const ps = new Particles({ rng: R, ground: floor }), lights = new Lights();
    const streaks = [], cuts = [], cut = BLADES.map(() => false), out = BLADES.map(() => false);
    const [mx, my] = MOUTH;
    return {
      update(t, dt) {
        // the breath in: wisps pulled towards the mouth
        if (t > BREATH && t < FIRE && R.chance(40 * dt)) {
          const a = R.range(-1.2, 1.2), d = R.range(10, 22), T = R.range(0.1, 0.16), v = (d * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, mx + 4 + Math.cos(a) * d, my + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? C[5] : C[3]);
        }
        BLADES.forEach((bl, i) => {
          if (!out[i] && t >= at(i)) {
            out[i] = true;
            lights.add(mx + 5, my, 26, C[4], 0.5, 0.1);
            for (let j = 0; j < 5; j++) ps.spawn(P.VAPOUR, mx + 5, my + R.range(-2, 2), R.range(30, 80), R.range(-12, 12), R.range(0.25, 0.45), C[5], R.range(1.5, 2.5));
          }
          const b = bladeAt(i, t);
          if (b) {
            // the air it tears: streaks peel off above and below it and hang behind
            if (R.chance(55 * dt)) streaks.push({ x: b.x - b.R * 0.4, y: b.y + R.sign() * R.range(b.R * 0.4, b.R * 1.1), len: R.range(6, 16), life: R.range(0.14, 0.28), max: 0, c: R.chance(0.5) ? C[5] : C[3] });
            // and the floor under it gives up a skein of dust
            if (R.chance(20 * dt)) ps.spawn(P.DUST, b.x + R.range(-4, 4), -1, R.range(40, 120), -R.range(4, 14), R.range(0.35, 0.6), DUST, R.range(1.4, 2.4));
          }
          if (!cut[i] && t >= hit(i)) {
            cut[i] = true;
            const x = TX - 6, y = bl.y + 4;
            lights.add(x, y, 40, C[4], 0.7, 0.12);
            // the cut: a line across the target along the blade's tilt, white, cooling, opening a gap of light
            cuts.push({ x, y, rot: bl.rot + Math.PI / 2 + (i - 1) * 0.35, L: 9 + i * 2, age: 0 });
            for (let j = 0; j < 10; j++) {
              const a = R.range(-0.9, 0.9), sp = R.range(80, 220);
              ps.spawn(P.MOTE, x + 2, y + R.range(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.2, 0.45), C[R.int(4, 6)], 0.6);
            }
            for (let j = 0; j < 4; j++) ps.spawn(P.VAPOUR, x + 6, y + R.range(-5, 5), R.range(30, 90), R.range(-15, 10), R.range(0.3, 0.6), C[5], R.range(2, 3.5));
          }
        });
        for (let j = streaks.length - 1; j >= 0; j--) if ((streaks[j].max += dt) >= streaks[j].life) streaks.splice(j, 1);
        for (const c of cuts) c.age += dt;
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(1));
        for (const s of streaks) {
          const k = 1 - s.max / s.life;
          p.line(s.x - s.len * (0.6 + 0.4 * (1 - k)), s.y, s.x - s.len * 0.2 * (1 - k), s.y, s.c, k);
        }
        BLADES.forEach((bl, i) => {
          const b = bladeAt(i, t);
          if (!b) return;
          // echoes a beat behind it, then the blade itself
          crescent(p, C.slice(0, 5), b.x - 8, b.y, b.R * 0.9, b.rot, 0.4, b.R * 0.3);
          crescent(p, C, b.x, b.y, b.R, b.rot, 1);
          p.glow(b.x - b.R * 0.3, b.y, 16 + b.R, C[3], 0.35);
          if (b.u < 0.12) sparkle(p, b.x, b.y, Math.round(8 * (1 - b.u / 0.12)), C[6], C[4], 0.5);
        });
        for (const c of cuts) {
          const k = 1 - smooth(0.05, 0.5, c.age);
          if (k <= 0) continue;
          const dx = Math.cos(c.rot) * c.L, dy = Math.sin(c.rot) * c.L, L = c.L * Math.min(1, c.age / 0.04);
          const ex = Math.cos(c.rot) * L, ey = Math.sin(c.rot) * L;
          p.line(c.x - ex, c.y - ey, c.x + ex, c.y + ey, c.age < 0.08 ? WHITE : C[5], k);
          if (c.age < 0.25) p.line(c.x - dx * 0.7 + 1, c.y - dy * 0.7, c.x + dx * 0.7 + 1, c.y + dy * 0.7, C[3], k * 0.7);
          p.glowLine(c.x - ex, c.y - ey, c.x + ex, c.y + ey, 8, C[4], 0.4 * k);
        }
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);
