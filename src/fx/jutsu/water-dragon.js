// Suiton: Suiryuudan no Jutsu (water dragon bullet). Narutopedia: the user shapes a great mass of water into a dragon
// that attacks the enemy; famously 44 seals (Ox, Monkey, Hare, Rat, Boar, Bird, Ox, Horse, Bird, Rat, Tiger, Dog, Tiger,
// Snake, Ox, Ram, Snake, Boar, Ram, Rat, Monkey, Bird, Dragon, Bird, Ox, Horse, Ram, Tiger, Snake, Boar, Rat, Monkey,
// Hare, Boar, Dragon, Ram, Rat, Ox, Monkey, Bird, Boar, Rat, Snake, Bird). All 44 are flashed through here, fast.
// Built from: the library geyser (the water bursting up out of the ground the dragon is drawn from), a new serpent
// body that follows a curve (water shading, foam spine, scales, a jawed head), the water kit's beads and ripples, and
// the library splash where it crashes onto the target.
import { Lights, Rng, READY, fit, clamp, smooth, ease, mix, WHITE, TAU } from "../../core/index.js";
import * as geyser from "../water/geyser.js";
import * as splash from "../water/splash.js";
import { WATER, bead, Ripples, Mist } from "../water/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const NAMES = ["ushi", "saru", "u", "ne", "i", "tori", "ushi", "uma", "tori", "ne", "tora", "inu", "tora", "mi", "ushi", "hitsuji", "mi", "i", "hitsuji", "ne", "saru", "tori", "tatsu", "tori", "ushi", "uma", "hitsuji", "tora", "mi", "i", "ne", "saru", "u", "i", "tatsu", "hitsuji", "ne", "ushi", "saru", "tori", "i", "ne", "mi", "tori"];
const SEALS = sealRun(0.05, NAMES, 0.042, { hold: 0.2 });
const SRC = 34, RISE = SEALS.end + 0.15, FLY = 1.15, TX = 150;
const HIT = RISE + FLY;
// the dragon's path: up out of the water, a coil high overhead, then down onto the target
const PATH = [[SRC, 4], [SRC + 4, -30], [SRC + 18, -70], [SRC + 52, -92], [SRC + 86, -78], [TX - 10, -40], [TX - 6, -16]];

export const meta = {
  name: "Water dragon",
  desc: "Suiton: all 44 seals flashed through, water bursts up out of the ground and coils into a dragon that rears overhead and crashes down on the target.",
  tags: ["jutsu", "water", "suiton", "dragon", "move", "one-shot"],
  size: [314, 200],
  origin: [50, 170],
  duration: HIT + 3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WATER, seed: 8 },
};

// a point on the path (Catmull-Rom through PATH) and its heading
function along(s) {
  const n = PATH.length - 1, u = clamp(s) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
  const p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(n, i + 2)];
  const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
}

const DIRECT = { ...READY, crouch: 6, lean: -2, fx: 16, fy: -30, bx: -2, by: -24, ffx: 11, fbx: -10 };
const POINT = { ...DIRECT, x: 4, crouch: 4, lean: 5, fx: 15, fy: -23, bx: -6, by: -22 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [RISE, DIRECT, "snap"],
    [RISE + FLY * 0.6, { ...DIRECT, fy: -32, crouch: 5 }],
    [HIT - 0.15, POINT, "out"],
    [HIT + 0.9, { ...POINT, crouch: 3 }],
    [HIT + 1.5, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.18, shake: 0.4, amp: 3, push: 3.8, straw: 30, y: -16 },
    { t: HIT + 0.3, stop: 0.03, push: 1.4, straw: 8 },
  ],
  dust: [{ t: RISE, x: 12, n: 5, dir: 1 }],
};

export const create = play(
  [
    { fx: geyser, t: RISE - 1.15, until: HIT + 0.6, x: SRC, height: 70, light: 0.6 },
    { fx: splash, t: HIT, x: TX - 4, stone: false, light: 0.8 },
  ],
  (o) => {
    const C = fit(o.palette, 8), R = new Rng(o.seed), lights = new Lights(), ripples = new Ripples({ sy: 0.25 }), mist = new Mist();
    const beads = [];
    let crashed = false;
    const add = (x, y, vx, vy, s, life) => beads.push({ x, y, vx, vy, s, life });
    const head = (t) => ease.inOutSine(clamp((t - RISE) / FLY));
    return {
      update(t, dt) {
        const s = head(t);
        if (t > RISE && t < HIT) {
          // water streams off the body and rains down
          for (let j = 0; j < Math.max(1, Math.round(50 * dt)); j++) {
            const [x, y] = along(s * R.range(0.3, 1));
            add(x + R.range(-4, 4), y + R.range(-4, 4), R.range(-40, 40), R.range(-20, 40), R.chance(0.3) ? 2 : 1, R.range(0.5, 1));
          }
        }
        if (!crashed && t >= HIT) {
          crashed = true;
          lights.add(TX - 6, -16, 70, C[5], 0.8, 0.2);
          for (let j = 0; j < 70; j++) {
            const a = -Math.PI / 2 + R.range(-1.5, 1.5), sp = R.range(60, 280);
            add(TX - 6, -12, Math.cos(a) * sp, Math.sin(a) * sp, R.chance(0.3) ? 3 : 2, R.range(0.6, 1.3));
          }
          for (let j = 0; j < 6; j++) mist.add(TX - 6 + R.range(-14, 14), -10 + R.range(-6, 4), R.range(-30, 30), -R.range(4, 16), 5, 16, R.range(0.9, 1.5), "#cdf1ff", 0.25);
          for (let j = 0; j < 3; j++) ripples.add(TX - 6, 0, 2, 24 + j * 10, 0.9 + j * 0.2, { n: 2, gap: 4, k: 1, delay: j * 0.1 });
        }
        for (let j = beads.length - 1; j >= 0; j--) {
          const q = beads[j];
          q.vy += 520 * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.life -= dt;
          if (q.y >= 0) {
            if (q.s > 1 && R.chance(0.5)) ripples.add(q.x, 0, 0.5, 3 + q.s, 0.4, { n: 1, k: 0.6 });
            beads.splice(j, 1);
          } else if (q.life <= 0) beads.splice(j, 1);
        }
        ripples.update(dt);
        mist.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ripples.draw(p, C, -1);
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(2));
        const s = head(t);
        if (t > RISE && t < HIT + 0.08) {
          // the body: from the water it rises out of up to the head, thick behind the head, thinning to the source
          const N = 46, len = Math.min(s, 0.62);
          const pts = [];
          for (let i = 0; i <= N; i++) pts.push(along(s - (len * i) / N));
          for (let i = N; i >= 0; i--) {
            const [x, y] = pts[i], u = i / N, r = 9 * (1 - u * 0.6) * (i < 3 ? 0.8 + i * 0.07 : 1);
            p.circle(x, y, r + 1, C[2]);
            p.circle(x, y, r, C[4]);
            p.circle(x - r * 0.2, y - r * 0.3, r * 0.6, C[5]);
            // scales: a darker band every few segments; a foam crest of white along the spine
            if (i % 4 === 0) p.circle(x + r * 0.15, y + r * 0.25, r * 0.55, C[3], 0.8);
            if (i % 2 === 0) p.px(x - r * 0.3, y - r * 0.75, (i + Math.floor(t * 20)) % 3 ? C[6] : WHITE);
            // fins: a spike off the back every few segments, pointing away from the curve
            if (i % 5 === 2 && i > 3 && i < N - 4) {
              const [ax, ay] = pts[i - 1], [cx2, cy2] = pts[i + 1], tx2 = cx2 - ax, ty2 = cy2 - ay, l = Math.hypot(tx2, ty2) || 1, nx = ty2 / l, ny = -tx2 / l, sg = ny < 0 ? 1 : -1;
              p.tri(x + nx * sg * r * 0.7 - tx2 * 0.4, y + ny * sg * r * 0.7 - ty2 * 0.4, x + nx * sg * (r + 5), y + ny * sg * (r + 5), x + nx * sg * r * 0.7 + tx2 * 0.4, y + ny * sg * r * 0.7 + ty2 * 0.4, C[5]);
            }
          }
          // the head: snout pointing along the path, jaws open as it dives, an eye, two whiskers streaming back
          const [hx, hy] = pts[0], [bx, by] = pts[2], ang = Math.atan2(hy - by, hx - bx), ca = Math.cos(ang), sa = Math.sin(ang);
          const open = 0.3 + 0.45 * smooth(0.55, 0.95, s), L = 18;
          const P = (a, b) => [hx + ca * a - sa * b, hy + sa * a + ca * b];
          const up = [P(-6, -9), P(4, -9), P(L, -2 - 6 * open), P(L - 3, 0), P(-2, 2)], lo = [P(-2, 2), P(L - 5, 4 + 7 * open), P(-6, 9)];
          p.poly(up, C[4]);
          p.poly(lo, C[3]);
          p.polyline([...up, up[0]], C[6]);
          p.polyline([...lo, lo[0]], C[5]);
          const [ex, ey] = P(3, -5);
          p.px(ex, ey, WHITE);
          p.px(ex + 1, ey, C[1]);
          for (const sd of [-1, 1]) {
            const pts2 = [];
            for (let k = 0; k < 8; k++) pts2.push(P(-k * 2.5, sd * (4 + k * 0.9) + Math.sin(t * 14 + k) * 1.2));
            p.polyline(pts2, C[6], 0.85);
          }
          p.glow(hx, hy, 30, C[5], 0.4);
        }
        for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, C, clamp(q.life / 0.2));
        ripples.draw(p, C, 1);
        mist.draw(p, mix(C[6], WHITE, 0.3));
        lights.draw(p);
      },
    };
  },
);
