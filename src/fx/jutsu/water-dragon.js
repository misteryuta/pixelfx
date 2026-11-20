// Suiton: Suiryuudan no Jutsu (water dragon bullet). Narutopedia: the user shapes a great mass of water into a dragon
// that attacks the enemy; famously 44 seals (Ox, Monkey, Hare, Rat, Boar, Bird, Ox, Horse, Bird, Rat, Tiger, Dog, Tiger,
// Snake, Ox, Ram, Snake, Boar, Ram, Rat, Monkey, Bird, Dragon, Bird, Ox, Horse, Ram, Tiger, Snake, Boar, Rat, Monkey,
// Hare, Boar, Dragon, Ram, Rat, Ox, Monkey, Bird, Boar, Rat, Snake, Bird). All 44 are flashed through here, fast.
// Built from: the library geyser (the water bursting up out of the ground the dragon is drawn from), a new serpent
// body that follows a curve (water shading, foam spine, scales, a jawed head), the water kit's beads and ripples, and
// the library splash where it crashes onto the target.
import { Lights, Rng, READY, fit, clamp, smooth, ease, mix, hex, WHITE, TAU } from "../../core/index.js";
import * as geyser from "../water/geyser.js";
import * as splash from "../water/splash.js";
import { WATER, bead, Ripples, Mist } from "../water/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const NAMES = ["ushi", "saru", "u", "ne", "i", "tori", "ushi", "uma", "tori", "ne", "tora", "inu", "tora", "mi", "ushi", "hitsuji", "mi", "i", "hitsuji", "ne", "saru", "tori", "tatsu", "tori", "ushi", "uma", "hitsuji", "tora", "mi", "i", "ne", "saru", "u", "i", "tatsu", "hitsuji", "ne", "ushi", "saru", "tori", "i", "ne", "mi", "tori"];
const SEALS = sealRun(0.05, NAMES, 0.042, { hold: 0.2, kind: "water" });
const SRC = 34, RISE = SEALS.end + 0.15, FLY = 1.15, TX = 150;
const HIT = RISE + FLY;
// the dragon's path: up out of the water, a coil high overhead, then down onto the target
const PATH = [[SRC, 6], [SRC - 4, -34], [SRC + 8, -78], [SRC + 42, -104], [SRC + 74, -94], [SRC + 70, -66], [SRC + 96, -62], [TX - 10, -40], [TX - 6, -16]];

export const meta = {
  name: "Water dragon",
  desc: "Suiton: all 44 seals flashed through, water bursts up out of the ground and coils into a dragon that rears overhead and crashes down on the target.",
  tags: ["jutsu", "water", "suiton", "dragon", "move", "one-shot"],
  size: [314, 222],
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

// ---- the dragon, after the reference: a thick serpent of water, pale blue lit from above, white currents spiralling
// down its length, a crest of white fins along the back, a horned head with a red eye and jaws open, a mane behind it
const DR = ["#173a6e", "#1f5fa6", "#3f86cf", "#6fb0ea", "#a8d6f8", "#e4f4ff", "#ffffff"].map(hex), EYE = hex("#e02838");
// arc-length table for the path, so the body's segments sit evenly whatever the curve does
const ARC = (() => {
  const n = PATH.length - 1, out = [[...PATH[0], 0]];
  for (let k = 1; k <= 600; k++) {
    const u = (k / 600) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
    const p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(n, i + 2)];
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    const x = cr(p0[0], p1[0], p2[0], p3[0]), y = cr(p0[1], p1[1], p2[1], p3[1]), q = out[out.length - 1];
    out.push([x, y, q[2] + Math.hypot(x - q[0], y - q[1])]);
  }
  return out;
})();
const TOTAL = ARC[ARC.length - 1][2];
function at(s) {
  const L = clamp(s) * TOTAL;
  let lo = 0, hi = ARC.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ARC[m][2] < L) lo = m;
    else hi = m;
  }
  const a = ARC[lo], b = ARC[hi], f = (L - a[2]) / (b[2] - a[2] || 1);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

function drawDragon(p, s, t, wake) {
  const N = 120, len = s, pts = [], nrm = [];
  for (let i = 0; i <= N; i++) pts.push(at(s - (len * i) / N));
  for (let i = 0; i <= N; i++) {
    const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(N, i + 1)], dx = ax - bx, dy = ay - by, l = Math.hypot(dx, dy) || 1;
    // the normal that points away from the belly: the back is the side facing up
    let nx = dy / l, ny = -dx / l;
    if (ny > 0) (nx = -nx), (ny = -ny);
    nrm.push([nx, ny, dx / l, dy / l]);
  }
  // thickness: a slim neck behind the head, swelling to the shoulders, tapering down to where it leaves the water
  const R = (i) => {
    const u = i / N;
    return 4.5 + 7 * Math.sin(Math.PI * Math.min(1, u * 1.9 + 0.05)) * (1 - u * 0.35) + (u < 0.06 ? 1.5 : 0);
  };
  // the outline first all the way along, then the body over it, so the silhouette is one clean line
  for (let i = N; i >= 0; i--) p.circle(pts[i][0], pts[i][1], R(i) + 1, DR[1]);
  for (let i = N; i >= 0; i--) {
    const [x, y] = pts[i], [nx, ny] = nrm[i], r = R(i);
    p.circle(x, y, r, DR[3]);
    p.circle(x - nx * r * 0.5, y - ny * r * 0.5, r * 0.5, DR[2]); // belly in shadow
    p.circle(x + nx * r * 0.3, y + ny * r * 0.3, r * 0.55, DR[4]); // back catching the light
    p.circle(x + nx * r * 0.62, y + ny * r * 0.62, r * 0.2, DR[5]); // the wet rim along the spine
  }
  // currents of white water spiralling down the body, drawn where they wrap round the near side
  const cur = (i, k) => {
    const ph = i * 0.22 - t * 3.2 + k * Math.PI, v = Math.sin(ph), [x, y] = pts[i], [nx, ny] = nrm[i], r = R(i);
    return [x + nx * v * r * 0.8, y + ny * v * r * 0.8, Math.cos(ph)];
  };
  for (let k = 0; k < 2; k++)
    for (let i = 3; i < N; i++) {
      const [x0, y0, c0] = cur(i - 1, k), [x1, y1, c1] = cur(i, k);
      if (c0 < 0.15 || c1 < 0.15) continue;
      p.line(x0, y0, x1, y1, c1 > 0.75 ? DR[6] : DR[5]);
    }
  // the crest: white-tipped fins sweeping back off the spine, bigger towards the head
  for (let i = 8; i < N - 10; i += 6) {
    const [x, y] = pts[i], [nx, ny, tx, ty] = nrm[i], r = R(i), h = 5 + 5 * (1 - i / N);
    const bx = x + nx * r * 0.85, by = y + ny * r * 0.85, tipx = bx + nx * h - tx * 6, tipy = by + ny * h - ty * 6;
    p.tri(bx - tx * 4, by - ty * 4, tipx, tipy, bx + tx * 3, by + ty * 3, DR[4]);
    p.tri(bx - tx * 1, by - ty * 1, tipx, tipy, bx + tx * 3, by + ty * 3, DR[5]);
    p.line(bx + tx * 3, by + ty * 3, tipx, tipy, DR[6]);
  }
  // the head: built in its own frame (a along the snout, b up off the jaw line)
  const [hx, hy] = pts[0], [ux, uy, ca, sa] = nrm[0], HS = 1.75;
  const P = (a, b) => [hx + (ca * a + ux * b) * HS, hy + (sa * a + uy * b) * HS];
  const open = 0.35 + 0.65 * smooth(0.55, 0.95, s);
  const mane = [];
  for (let k = 0; k < 6; k++) mane.push([P(-4 - k * 3, 5 + (k % 2) * 2), P(-12 - k * 3.5, 11 + k * 1.2 + Math.sin(t * 12 + k) * 1.5), P(-2 - k * 3, 3)]);
  for (const [a, b, c] of mane) p.tri(...a, ...b, ...c, DR[5]);
  // horns swept back
  p.tri(...P(2, 7), ...P(-13, 15), ...P(-2, 5), DR[5]);
  p.tri(...P(5, 6), ...P(-8, 16), ...P(1, 5), DR[6]);
  // skull, snout and the open lower jaw, outlined
  const skull = [P(-7, 6), P(3, 8), P(10, 7), P(17, 4), P(25, 3), P(26, 0), P(14, -1), P(4, -2), P(-7, -4)];
  const jaw = [P(4, -3), P(22, -2 - 7 * open), P(21, -5 - 7 * open), P(9, -7 - 2 * open), P(-4, -6)];
  p.poly(jaw, DR[2]);
  p.poly([P(9, -1), P(24, -1 - 1 * open), P(21, -3 - 6 * open), P(8, -5)], DR[0]); // the mouth's dark inside
  p.polyline([...jaw, jaw[0]], DR[1]);
  p.poly(skull, DR[3]);
  p.poly([P(-4, 5), P(10, 6), P(22, 3), P(10, 3)], DR[4]);
  p.polyline([...skull, skull[0]], DR[1]);
  // teeth along both jaws
  for (let k = 0; k < 5; k++) {
    const [x1, y1] = P(12 + k * 2.6, -1.2), [x2, y2] = P(11 + k * 2.4, -3.2 - 6 * open + k * 0.6);
    p.px(x1, y1, DR[6]);
    p.px(x2, y2, DR[6]);
  }
  // the red eye with a white glint, a brow over it
  const [ex, ey] = P(9, 4);
  p.circle(ex, ey, 1.3, EYE);
  p.px(ex - 0.5, ey - 0.5, DR[6]);
  p.line(...P(5, 6), ...P(12, 5.5), DR[1]);
  // whiskers streaming back from the snout, a beard of spikes under the jaw
  for (const sd of [1, -1]) {
    const w = [];
    for (let k = 0; k < 9; k++) w.push(P(22 - k * 3.4, sd * (1 + k * 1.1) + Math.sin(t * 13 + k * 0.8 + sd) * 1.4));
    p.polyline(w, DR[5], 0.9);
  }
  for (let k = 0; k < 3; k++) p.tri(...P(2 - k * 4, -5), ...P(-3 - k * 4, -11 - k), ...P(-1 - k * 4, -5), DR[4]);
  p.glow(hx, hy, 34, DR[4], 0.35);
  // where it pours out of the water at its root, the body breaks into foam
  if (wake) {
    const [rx, ry] = pts[N];
    p.circle(rx, Math.min(-1, ry), R(N) + 2, DR[5], 0.8);
  }
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
    { t: HIT + 0.3, stop: 0.03, flash: 0, push: 1.4, straw: 8 },
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
            const [x, y] = at(s - Math.min(s, 0.66) * R.range(0, 1));
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
        if (t > RISE && t < HIT + 0.08) drawDragon(p, s, t, true);
        for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, C, clamp(q.life / 0.2));
        ripples.draw(p, C, 1);
        mist.draw(p, mix(C[6], WHITE, 0.3));
        lights.draw(p);
      },
    };
  },
);
