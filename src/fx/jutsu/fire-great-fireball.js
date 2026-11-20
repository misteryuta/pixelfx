// Katon: Goukakyuu no Jutsu (great fireball). Narutopedia: seals Snake, Ram, Monkey, Boar, Horse, Tiger; after the
// seals a huge fireball is blown at the enemy; the Uchiha's rite of passage. Staged as in the anime: the hand comes up
// to the lips as a ring, the chest fills, and a roaring stream of fire swells at the mouth into a ball wider than the
// shinobi, which rolls forward and swallows the target.
// Built from: a tongue of toolkit flame at the lips, the fire kit's noise for the ball's churning skin
// (fire/_lib), the toolkit's fire and smoke particles, and the small explosion (enlarged) where it lands.
import { Particles, Lights, P, PF, Rng, READY, fit, clamp, smooth, ease, mix, hex, WHITE, TAU } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import { pnoise, hotFirst } from "../fire/_lib.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["mi", "hitsuji", "saru", "i", "uma", "tora"], 0.11, { hold: 0.12 });
const RING = SEALS.end, BLOW = RING + 0.36, GROW = 0.42, ROLL = BLOW + GROW, SPEED = 95, TX = 150;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
const RMAX = 23;
const HIT = ROLL + (TX - 8 - (MX + RMAX)) / SPEED;

export const meta = {
  name: "Great fireball",
  desc: "Katon: Snake, Ram, Monkey, Boar, Horse, Tiger, a hand at the lips, and a roaring stream of fire swells into a ball wider than the shinobi that rolls on and swallows the target.",
  tags: ["jutsu", "fire", "katon", "move", "one-shot"],
  size: [306, 240],
  origin: [56, 204],
  duration: HIT + 5.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], seed: 2 },
};

// the hand at the lips, curled into a ring to blow through; the chest filling; then the long blow
const TO_LIPS = { ...READY, crouch: 3, lean: -3, fx: 9, fy: -31, bx: 4, by: -22, ffx: 8, fbx: -8 };
const BLOWING = { ...TO_LIPS, crouch: 5, lean: 5, fx: 10, fy: -30, bx: -3, by: -20, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [RING + 0.08, TO_LIPS],
    [BLOW - 0.03, { ...TO_LIPS, lean: -6, crouch: 2 }],
    [BLOW, BLOWING, "snap"],
    [ROLL, { ...BLOWING, lean: 7, crouch: 6 }],
    [ROLL + 0.5, { ...BLOWING, lean: 3 }],
    [HIT + 0.6, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.18, shake: 0.4, amp: 3, push: 3.6, straw: 40, skin: "char" },
    { t: meta.duration - 0.6, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: BLOW, x: 12, n: 6, dir: 1 }],
};

// the ball: its radius and centre at time t
function ball(t) {
  if (t < BLOW || t > HIT + 0.05) return null;
  const g = ease.outCubic(clamp((t - BLOW) / GROW)), r = 3 + (RMAX - 3) * g;
  const x = MX + r * 0.9 + Math.max(0, t - ROLL) * SPEED, y = Math.min(MY + 2 + (RMAX - 3) * g * 0.35, -r - 1);
  return { x, y, r };
}

export const create = play(
  [
    { fx: blast, t: HIT, x: TX, size: 0.85, light: 0.8 },
  ],
  (o) => {
    const F = fit(o.palette, 9), H = hotFirst(F), R = new Rng(o.seed + 3), floor = () => 0, lights = new Lights();
    const ps = new Particles({ rng: R, ground: floor });
    return {
      update(t, dt) {
        // the chest fills: heat drawn in at the lips
        if (t > RING && t < BLOW && R.chance(50 * dt)) {
          const a = R.range(0, TAU), d = R.range(8, 18), T = R.range(0.07, 0.12), v = (d * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, MX + Math.cos(a) * d, MY + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? F[6] : F[4]);
        }
        // the first gust of the blow: a short tongue of flame off the lips that the ball swells out of
        if (t > BLOW && t < BLOW + 0.2)
          for (let j = 0; j < Math.max(1, Math.round(90 * dt)); j++) ps.spawn(P.FIRE, MX + 2, MY + R.range(-1.5, 1.5), R.range(60, 140), R.range(-25, 15), R.range(0.12, 0.25), 0, R.range(1.5, 3), 0, R.chance(0.3) ? PF.SMOKES : 0);
        const b = ball(t);
        if (b) {
          // flame licked off the ball's skin and thrown back, cooling into smoke
          for (let j = 0; j < Math.max(1, Math.round(120 * dt)); j++) {
            const a = R.range(-2.6, 2.6) + Math.PI, x = b.x + Math.cos(a) * b.r * 0.9, y = b.y + Math.sin(a) * b.r * 0.9;
            ps.spawn(P.FIRE, x, y, Math.cos(a) * R.range(10, 40) - 20, Math.sin(a) * R.range(10, 40) - 12, R.range(0.2, 0.45), 0, R.range(2, 4) * (b.r / RMAX + 0.4), 0, R.chance(0.35) ? PF.SMOKES | PF.BIG : 0);
          }
          if (R.chance(14 * dt)) ps.spawn(P.EMBER, b.x + R.range(-b.r, b.r), b.y - b.r * 0.5, R.range(-20, 20), -R.range(20, 50), R.range(0.6, 1.2), F[6]);
          // it scorches the floor it rolls over
          if (b.y + b.r > -3 && R.chance(20 * dt)) ps.spawn(P.FIRE, b.x + R.range(-b.r * 0.6, b.r * 0.3), -1, R.range(-10, 10), -R.range(10, 30), R.range(0.3, 0.6), 0, R.range(1.5, 2.6), 0, PF.SMOKES);
          if (R.chance(8 * dt)) lights.add(b.x, b.y, 50 + b.r * 2, F[5], 0.3, 0.2);
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, F.slice(2));
        ps.draw(p, "front");
        const b = ball(t);
        if (b) {
          // a churning sphere of fire: hot white-yellow heart, an orange body, a ragged red rim that boils
          const S = o.seed, ph = t * 1.3;
          p.shade(b.x - b.r - 4, b.y - b.r - 4, b.x + b.r + 4, b.y + b.r + 4, (x, y, out) => {
            const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) / TAU;
            const rim = b.r * (1 + 0.12 * pnoise(a * 12 + ph * 6, 12, S) + 0.07 * pnoise(a * 23 - ph * 9, 23, S + 1));
            if (d > rim) return;
            const swirl = pnoise(a * 7 - ph * 5 + d * 0.18, 7, S + 2), h = 1 - d / rim + 0.22 * swirl - 0.12 * (dy / b.r);
            out.c = h > 0.78 ? H[0] : h > 0.62 ? H[1] : h > 0.47 ? H[2] : h > 0.32 ? H[3] : h > 0.18 ? H[4] : h > 0.08 ? H[5] : H[6];
          });
          p.glow(b.x, b.y, b.r * 3.2, H[3], 0.5);
          p.glow(b.x, b.y, b.r * 1.2, H[1], 0.35);
          p.ellipse(b.x, 0.5, b.r * 1.4, 2.2, H[4], 0.25 * clamp(1 - (-b.y - b.r) / 20));
        }
        lights.draw(p);
      },
    };
  },
);
