// Sen'ei Jashu (Hidden Shadow Snake Hands, Orochimaru). Narutopedia: snakes summoned out from under the user's sleeve
// as a surprise, attacking or capturing by biting and constricting; they're long enough to strike from a good distance.
// Here: his yellow slit-pupilled eyes, an arm flung out, and four snakes pour from the sleeve, each its own animal:
// a green one arcing high to wind round the neck, a thick olive one round the chest, a teal one sliding in low round the
// waist, a dusky one round the post that rears up to bite the arm. They coil the target in turns of their own (behind
// it, round, in front), rear and bite, then squeeze three times: the coils draw tight, the body pinches under them and
// bulges between, straw bursts out. They let go one by one and slide back up the sleeve along the way they came,
// unwinding off the target as they go.
// New: snakes as bodies that follow a path (sleeve, a curve through the air, a helix round the target, a neck), so
// they slither and unwind like real ones; the target pinched where the coils press.
import { clamp, smooth, ease, hex, rand, WHITE, TAU, READY } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, FLING = OPEN + 0.15, TX = 150, RY = 0.32;
const PAL = {
  green: ["#121c0a", "#2f4a18", "#5a7a26", "#9cc050", "#e8e4a8"],
  olive: ["#1a120a", "#4a3618", "#7a5a2a", "#b89a58", "#eadcb0"],
  teal: ["#0a1818", "#1e3c38", "#386a5c", "#6aa088", "#dcecc8"],
  dusk: ["#140e1c", "#3a2a48", "#5e4a72", "#9a86aa", "#ecdcc8"],
};
for (const k in PAL) PAL[k] = PAL[k].map(hex);
const RED = hex("#d82a3a");

// each snake: palette, girth, when it leaves the sleeve, the band of coils (center height, radius, turns, rise per turn,
// up or down), the curve it takes through the air (control offsets from the sleeve and from where it meets the target),
// its wave, its markings, where it rears and where it bites (from the target's feet)
const SNAKES = [
  { pal: "green", w: 3.1, delay: 0.0, yc: -42, R: 10, turns: 1.4, pitch: 6, dir: -1, c1: [36, -46], c2: [-34, -26], amp: 5, waves: 2.2, sp: 11, pat: "diamond", rear: [14, -60], bite: [5, -48] },
  { pal: "olive", w: 3.9, delay: 0.07, yc: -25, R: 13, turns: 1.6, pitch: 7.5, dir: 1, c1: [46, -8], c2: [-38, 6], amp: 6, waves: 1.6, sp: 8, pat: "band", rear: [26, -42], bite: [13, -32] },
  { pal: "teal", w: 2.8, delay: 0.15, yc: -14, R: 11, turns: 1.5, pitch: 5.5, dir: -1, c1: [30, 22], c2: [-44, 18], amp: 4, waves: 2.8, sp: 13, pat: "spot", rear: [22, -6], bite: [8, -14] },
  { pal: "dusk", w: 2.4, delay: 0.24, yc: -6, R: 6.5, turns: 1.8, pitch: 4.6, dir: 1, c1: [24, -64], c2: [-26, -30], amp: 7, waves: 2, sp: 10, pat: "stripe", rear: [-24, -50], bite: [-15, -33] },
];
const AP = 0.3, NECK = 0.14, STRIKE = 0.07;
SNAKES.forEach((s) => {
  s.tA = FLING + s.delay;
  s.tC = s.tA + AP;
  s.tK = s.tC + 0.1 + 0.12 * s.turns;
  s.tB = s.tK + NECK + STRIKE;
});
const LAST_BITE = Math.max(...SNAKES.map((s) => s.tB)), SQ = LAST_BITE + 0.22, PULSES = [SQ, SQ + 0.4, SQ + 0.8], HOLD = SQ + 1.2;
// they let go in the reverse of the order they came
SNAKES.forEach((s, i) => (s.tR = HOLD + (SNAKES.length - 1 - i) * 0.09));
const RET = 0.78, END = HOLD + 0.27 + RET + 0.4;

export const meta = {
  name: "Hidden shadow snake hands",
  desc: "Orochimaru: four different snakes pour from his sleeve, coil the target at neck, chest, waist and post, bite and squeeze it three times, then unwind and slide back.",
  tags: ["jutsu", "orochimaru", "snake", "summoning", "control", "one-shot"],
  size: [250, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1e2a12", "#3a5a1e", "#6a8a2e", "#a8c858", "#f0d878"], seed: 65 },
};

const ARM = { ...READY, crouch: 4, lean: 6, fx: 21, fy: -26, bx: -6, by: -20, ffx: 10, fbx: -9 };
const PULL = { ...ARM, lean: 1, crouch: 5, fx: 18, fy: -25, bx: -8, by: -22, ffx: 9, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 2, lean: -2 }],
    [FLING, ARM, "snap"],
    [LAST_BITE, { ...ARM, lean: 5 }],
    // he hauls on them with every squeeze
    ...PULSES.flatMap((p) => [[p + 0.06, PULL, "out"], [p + 0.3, { ...ARM, lean: 4 }]]),
    [HOLD + 0.2, { ...ARM, lean: 3 }],
    [HOLD + 0.27 + RET * 0.7, { ...ARM, fx: 12, fy: -24, lean: -1 }, "in"],
    [END - 0.15, READY],
  ],
  hits: [
    ...SNAKES.map((s, i) => ({ t: s.tB, stop: 0.05, push: i % 2 ? -0.5 : 0.7, straw: 5, flash: 0.03 })),
    ...PULSES.map((t, i) => ({ t, stop: 0.06 + i * 0.02, shake: 0.18, amp: 1 + i, push: 0, shiver: 0.3, straw: 8 + i * 4 })),
    { t: HOLD + 0.3, flash: 0, push: -1.1, straw: 4 },
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

const bez = (a, b, c, d, u) => {
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};
const pulseAt = (t) => PULSES.reduce((m, p) => (t > p ? Math.max(m, Math.exp(-(t - p) * 7) * Math.min(1, (t - p) / 0.04)) : m), 0);
// how hard snake s is squeezing: drawn tight once it bites, harder on each pulse, slack once it lets go
const gripOf = (s, t) => smooth(s.tK, s.tB + 0.1, t) * (1 - smooth(s.tR - 0.05, s.tR + 0.25, t));
const coilY = (s, R, th) => s.yc + s.dir * s.pitch * ((th - Math.PI) / TAU - s.turns / 2) + R * RY * Math.sin(th);

/**
 * The snake's whole path at time t, as points { x, y, back } from the sleeve to the head, with cumulative lengths:
 * the curve through the air (waving), the coils (behind the target where sin < 0), the neck up to the head.
 */
function pathOf(s, t, hand) {
  const g = gripOf(s, t), pulse = pulseAt(t) * g, R = s.R * (1 - 0.1 * g - 0.09 * pulse);
  const th0 = Math.PI, th1 = Math.PI + s.turns * TAU;
  const entry = [TX - R, coilY(s, R, th0)];
  const pts = [], secs = [0, 0, 0];
  const push = (x, y, back, sec) => pts.push({ x, y, back, sec });
  // the curve through the air, with a travelling wave that pulls out straight while it squeezes
  const P1 = [hand[0] + s.c1[0], hand[1] + s.c1[1]], P2 = [entry[0] + s.c2[0], entry[1] + s.c2[1]], taut = 1 - 0.75 * g;
  const N = 34;
  for (let i = 0; i <= N; i++) {
    const u = i / N, [x, y] = bez(hand, P1, P2, entry, u), [x2, y2] = bez(hand, P1, P2, entry, Math.min(1, u + 0.01));
    const dx = x2 - x || 1e-3, dy = y2 - y, n = Math.hypot(dx, dy) || 1, env = Math.sin(Math.PI * u) * taut;
    const off = s.amp * env * Math.sin(u * TAU * s.waves - t * s.sp + s.delay * 30);
    push(x - (dy / n) * off, y + (dx / n) * off, false, 0);
  }
  // the coils: behind the target (upper half of each turn), then round in front
  for (let th = th0 + 0.15; th <= th1; th += 0.15) push(TX + Math.cos(th) * R, coilY(s, R, th), Math.sin(th) < 0, 1);
  // the neck: up off the last coil to the head, which rears, then strikes and holds the bite
  const E = pts[pts.length - 1], strike = ease.inQuad(clamp((t - (s.tB - STRIKE)) / STRIKE)) * (1 - ease.outQuad(clamp((t - (s.tR - 0.12)) / 0.12)));
  const jit = pulse > 0.05 ? [(rand(Math.floor(t * 40), 3) - 0.5) * 2 * pulse, (rand(Math.floor(t * 40), 4) - 0.5) * 2 * pulse] : [0, 0];
  const H = [TX + s.rear[0] + (s.bite[0] - s.rear[0]) * strike + jit[0], s.rear[1] + (s.bite[1] - s.rear[1]) * strike + jit[1]];
  const C1 = [E.x + Math.cos(th1 + Math.PI / 2) * 8, E.y - 6], C2 = [H[0] - (H[0] - E.x) * 0.2, H[1] + 10];
  for (let i = 1; i <= 12; i++) {
    const [x, y] = bez([E.x, E.y], C1, C2, H, i / 12);
    push(x, y, false, 2);
  }
  let L = 0;
  pts[0].s = 0;
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    pts[i].s = L;
    secs[pts[i].sec] = L;
  }
  return { pts, secs, L, R, g, pulse, strike };
}

// how much of the path is out of the sleeve: the curve, then the coils at a steady wind, then the neck; and back in
function lengthOf(s, t, P) {
  if (t < s.tA) return 0;
  const [a, c, n] = P.secs;
  if (t >= s.tR) return n * (1 - ease.inOutSine(clamp((t - s.tR - 0.1) / RET)));
  if (t < s.tC) return a * ease.outQuad((t - s.tA) / AP);
  if (t < s.tK) return a + (c - a) * ease.inOutSine((t - s.tC) / (s.tK - s.tC));
  return c + (n - c) * ease.outQuad(clamp((t - s.tK) / NECK));
}

function drawBody(s, P, len, t, layer) {
  return (p) => {
    const C = PAL[s.pal], pts = P.pts, swell = 1 + 0.15 * P.pulse;
    const width = (sv) => s.w * swell * Math.min(1, 0.4 + sv / 26) * (sv > len - 7 ? 0.82 : 1);
    for (let pass = 0; pass < 2; pass++)
      for (let i = 1; i < pts.length && pts[i - 1].s < len; i++) {
        const a = pts[i - 1], b = pts[i], back = a.back && b.back;
        if ((layer === "back") !== back) continue;
        let bx = b.x, by = b.y;
        if (b.s > len) {
          const u = (len - a.s) / (b.s - a.s);
          bx = a.x + (b.x - a.x) * u;
          by = a.y + (b.y - a.y) * u;
        }
        const w = width(a.s);
        if (pass === 0) {
          p.beam(a.x, a.y, bx, by, w + 1.6, C[0]);
          continue;
        }
        p.beam(a.x, a.y, bx, by, w, back ? C[1] : C[2]);
        if (back) continue;
        // the light along its back and its pale belly: which side is "up" depends on which way it's going
        const dx = bx - a.x, dy = by - a.y, n = Math.hypot(dx, dy) || 1;
        let nx = -dy / n, ny = dx / n;
        if (ny > 0) (nx = -nx), (ny = -ny);
        const o = w * 0.32;
        p.line(a.x + nx * o, a.y + ny * o, bx + nx * o, by + ny * o, C[3]);
        if (w > 2.4) p.line(a.x - nx * o, a.y - ny * o, bx - nx * o, by - ny * o, C[4], 0.8);
        // its markings
        const k = Math.floor(a.s / 6), mx = (a.x + bx) / 2, my = (a.y + by) / 2;
        if (s.pat === "band" && Math.floor(a.s / 5) % 2 === 0 && w > 2) p.beam(mx - nx * w * 0.5, my - ny * w * 0.5, mx + nx * w * 0.5, my + ny * w * 0.5, 1.2, C[1]);
        else if (s.pat === "diamond" && Math.floor(a.s) % 7 === 0) {
          p.px(mx + nx * o * 0.3, my + ny * o * 0.3, C[4]);
          p.px(mx + nx * o * 0.3 + nx, my + ny * o * 0.3 + ny, C[1]);
        } else if (s.pat === "spot" && Math.floor(a.s) % 5 === 0) p.px(mx + (k % 2 ? nx : -nx) * o, my + (k % 2 ? ny : -ny) * o, C[1]);
        else if (s.pat === "stripe") p.px(mx, my, Math.floor(a.s) % 3 ? C[1] : C[3]);
      }
  };
}

function drawHead(p, s, P, len, t) {
  const pts = P.pts.filter((q) => q.s <= len);
  if (pts.length < 3) return;
  const C = PAL[s.pal], h = pts[pts.length - 1], q = pts[Math.max(0, pts.length - 4)];
  const a = Math.atan2(h.y - q.y, h.x - q.x), c = Math.cos(a), sn = Math.sin(a), k = s.w / 3.1;
  const T = (u, v) => [h.x + (c * u - sn * v) * k, h.y + (sn * u + c * v) * k];
  // jaws: shut while it slithers, gaping as it strikes, clamped in the bite
  const gape = t < s.tB - STRIKE - 0.12 ? 0 : t < s.tB ? smooth(s.tB - STRIKE - 0.12, s.tB - 0.03, t) : 0.35 + 0.25 * P.pulse;
  const out = t > s.tR - 0.1 ? 0 : gape;
  p.poly([T(-4, -3.2), T(3, -2.6), T(6, -1 - out * 2.5), T(1, -0.4), T(-4, 0)], C[0]);
  p.poly([T(-4, 3.2), T(3, 2.4), T(5, 1 + out * 2.5), T(1, 0.4), T(-4, 0)], C[0]);
  p.poly([T(-3.4, -2.6), T(2.6, -2), T(5, -0.8 - out * 2.4), T(-3.4, -0.2)], C[2]);
  p.poly([T(-3.4, 2.6), T(2.4, 1.8), T(4.4, 0.8 + out * 2.4), T(-3.4, 0.2)], C[1]);
  p.line(...T(-3, -2.2), ...T(3, -1.8), C[3]);
  if (out > 0.15) {
    p.poly([T(1, -0.3), T(5, -0.8 - out * 2.4), T(4.4, 0.8 + out * 2.4), T(1, 0.3)], RED);
    p.px(...T(4.4, -0.6 - out * 2), WHITE);
    p.px(...T(4, 0.6 + out * 2), WHITE);
  }
  // the eye: yellow with a slit
  p.px(...T(1, -1.7), C[4]);
  p.px(...T(1.6, -1.7), hex("#f0d040"));
  // the tongue flicking while it hunts
  if (out < 0.1 && t < s.tB && Math.floor(t * 12 + s.delay * 40) % 3 === 0) {
    p.line(...T(5, 0), ...T(9, 0), RED);
    p.px(...T(10, -0.8), RED);
    p.px(...T(10, 0.8), RED);
  }
}

// the target pinched under the coils and bulging between them: each row of the box is resampled toward its middle
const CLEAR = 0x00010101;
function pinch(p, t, Ps) {
  const scale = (y) => {
    let s = 1;
    SNAKES.forEach((sn, i) => {
      const P = Ps[i];
      if (!P || P.g <= 0) return;
      const half = (sn.turns * sn.pitch) / 2 + 2, d = Math.abs(y - sn.yc);
      if (d < half) s += (0.16 * P.g + 0.22 * P.pulse) * (1 - (d / half) * 0.4);
      else if (d < half + 3) s -= 0.1 * P.pulse;
    });
    return s;
  };
  const x0 = TX - 24, x1 = TX + 24;
  for (let y = -58; y < 0; y++) {
    const s = scale(y + 0.5);
    if (Math.abs(s - 1) < 0.02) continue;
    const row = [];
    for (let x = x0; x <= x1; x++) row.push(p.get(x + 0.5, y + 0.5));
    for (let x = x0; x <= x1; x++) {
      const sx = Math.round(TX + (x + 0.5 - TX) * s - 0.5) - x0;
      const c = sx >= 0 && sx < row.length ? row[sx] : 0;
      p.px(x + 0.5, y + 0.5, c || CLEAR);
    }
  }
}

export const create = play([], () => {
  return {
    draw(p, t) {
      const b = bodyAt(act.poses, t), hand = b.handN;
      drawBadge(p, t, { kind: "snake", t0: EYE, t1: OPEN, label: "SEN'EI JASHU", head: b.head });
      drawGlint(p, t, "snake", OPEN + 0.05, END - 0.2, b.head);
      if (t < FLING) return;
      const Ps = SNAKES.map((s) => pathOf(s, t, hand)), lens = SNAKES.map((s, i) => lengthOf(s, t, Ps[i]));
      if (lens.every((l) => l <= 0.5)) return;
      pinch(p, t, Ps);
      // the coils behind the target: drawn, then the target put back over them
      const X0 = TX - 26, X1 = TX + 26, Y0 = -62, Y1 = 2, keep = [];
      for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) keep.push(p.get(x + 0.5, y + 0.5));
      SNAKES.forEach((s, i) => lens[i] > 0.5 && drawBody(s, Ps[i], lens[i], t, "back")(p));
      let j = 0;
      for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++, j++) if (keep[j] >>> 24 > 0) p.px(x + 0.5, y + 0.5, keep[j]);
      // then everything in front, last-launched first so the first snake lies on top
      for (let i = SNAKES.length - 1; i >= 0; i--) {
        if (lens[i] <= 0.5) continue;
        drawBody(SNAKES[i], Ps[i], lens[i], t, "front")(p);
        drawHead(p, SNAKES[i], Ps[i], lens[i], t);
      }
      // the strain: short white strokes snapping off the coils on each squeeze
      const pu = pulseAt(t);
      if (pu > 0.2)
        SNAKES.forEach((s, i) => {
          const R = Ps[i].R;
          for (const side of [-1, 1])
            for (let k = 0; k < 3; k++) {
              const y = s.yc + (k - 1) * 4, x = TX + side * (R + 3 + (1 - pu) * 4);
              p.line(x, y, x + side * 4 * pu, y + (k - 1) * 2 * pu, WHITE, pu);
            }
        });
      // the sleeve the snakes pour out of: a dark ring of shadow at the cuff while any are out
      if (lens.some((l) => l > 0.5)) p.circle(hand[0] + 1, hand[1], 2, hex("#140e1c"), 0.8);
    },
  };
});
