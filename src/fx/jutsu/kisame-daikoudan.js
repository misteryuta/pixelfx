// Suiton: Daikoudan no Jutsu (Great Shark Bullet, Kisame). Narutopedia: seals Clap, Snake and a technique-specific
// seal; the user makes a gigantic shark out of water and, thrusting both hands forward, sends it at the opponent; it can
// swallow the chakra of an enemy jutsu to grow even bigger. Here: Kisame's gills and grin, the seals, water welling up
// out of the floor in front of him and rising into a great shark, fins, gill slits, a mouth full of teeth, which he
// drives forward with both hands: it dives into the ground, only its dorsal fin cutting along the floor toward the target
// with a wake of water behind it, then bursts up out of the ground right in front of the target, jaws wide, and bites
// down on it in a breaking wave.
// New: the shark (one shaded body of water with a white rim, its features cut in, a wake of foam). From the water kit:
// beads of spray. From the library: the splash.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import * as splash from "../water/splash.js";
import { WATER, bead } from "../water/_lib.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["gassho", "mi", "hiden"], 0.13, { hold: 0.2, kind: "water" });
const WELL = SEALS.end, FORMED = WELL + 0.55, SEND = FORMED + 0.12, DIVE = SEND + 0.25, SURF = DIVE + 0.6, HIT = SURF + 0.3, END = HIT + 2.6, TX = 180;
const LEAPX = TX - 66;
const SW = ["#0a2a4a", "#1f5fa6", "#3f86cf", "#8ac8f0", "#e4f4ff"].map(hex);

export const meta = {
  name: "Great shark bullet",
  desc: "Kisame: Clap, Snake and his own seal, water welling up and rising into a giant shark with fins, gills and a mouth full of teeth, driven forward with both hands across the floor to crash into the target.",
  tags: ["jutsu", "kisame", "akatsuki", "water", "suiton", "projectile", "one-shot"],
  size: [310, 170],
  origin: [56, 132],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WATER, seed: 71 },
};

const PUSH = { ...READY, crouch: 8, lean: 12, fx: 21, fy: -24, bx: 20, by: -28, armsFront: true, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [FORMED, { ...READY, crouch: 6, fx: 10, fy: -26, bx: 11, by: -27, armsFront: true }, "out"],
    [SEND, PUSH, "snap"],
    [END - 0.4, { ...PUSH, crouch: 6, lean: 6 }],
    [END, READY],
  ],
  hits: [
    { t: DIVE - 0.05, shake: 0.12, amp: 1, target: false },
    { t: SURF, stop: 0.05, shake: 0.25, amp: 2, target: false },
    { t: HIT, stop: 0.16, shake: 0.45, amp: 3, push: 5, straw: 34 },
    { t: HIT + 0.2, stop: 0.03, flash: 0, push: 1.5, straw: 10 },
  ],
  dust: [{ t: SEND, x: 10, n: 8, dir: -1 }],
};

// the shark: inside test in its own space (nose to the right, length ~L), jaw open j
function inShark(x, y, L, j) {
  const u = x / L;
  if (u < -0.5 || u > 0.55) return false;
  const half = 0.17 * L * Math.sqrt(Math.max(0, 1 - ((u - 0.05) / 0.5) ** 2));
  const body = Math.abs(y) < half && !(u > 0.25 && y > -half * 0.1 + 2 && y < -half * 0.1 + 2 + j * (u - 0.25) * L * 0.5);
  const dorsal = u > -0.05 && u < 0.15 && y < -half + 1 && y > -half - (0.15 - u) * L * 0.9;
  const tail = u < -0.4 && Math.abs(y) < (-0.4 - u) * L * 1.6 + 2;
  const pectoral = u > 0.05 && u < 0.18 && y > half - 1 && y < half + (0.18 - u) * L * 0.5;
  return body || dorsal || tail || pectoral;
}

export const create = play([{ fx: splash, t: SURF, x: LEAPX, stone: false, light: 0.5 }, { fx: splash, t: HIT, x: TX - 6, stone: false, light: 0.8 }], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed), beads = [];
  // where the shark is: one smooth path from the pool, nose down into the floor, a run just under it with only the dorsal
  // fin cutting the surface (the floor hides the rest), and up out of it in an arc onto the target. Its heading is the
  // path's own direction, so nothing jumps: it speeds up all the way (slow off his hands, fastest as it hits).
  const X0 = 36, X1 = TX - 28, DEPTH = 11;
  const pathX = (t) => { const u = clamp((t - SEND) / (HIT - SEND)); return X0 + (X1 - X0) * (0.35 * u + 0.65 * u * u); };
  const pathY = (x, t) => {
    // out of the floor it climbs steeply and levels off right at the target: still rising as it bursts out, flat as it hits
    const dive = smooth(X0, 84, x), v = clamp((x - 110) / (X1 - 110)), leap = 1 - (1 - v) * (1 - v);
    return -26 + (DEPTH + 26) * dive - (DEPTH + 26) * leap + 1.2 * Math.sin(x * 0.22) * dive * (1 - leap);
  };
  const posAt = (t) => { const x = pathX(t); return [x, pathY(x, t)]; };
  const sharkAt = (t) => {
    const L = 40 + 30 * ease.outCubic(clamp((t - WELL) / (FORMED - WELL)));
    const settle = 1 - smooth(FORMED, SEND, t);
    if (t < SEND) return { x: X0, y: -26 + (1 - clamp((t - WELL) / (FORMED - WELL))) * 20 + Math.sin(t * 8) * 1.5 * settle, L, j: 0.3 + 0.2 * Math.sin(t * 6) * settle, a: 0 };
    const [x, y] = posAt(t), [x2, y2] = posAt(t + 0.01), [x1, y1] = posAt(t - 0.01);
    const a = Math.atan2(y2 - y1, x2 - x1) * smooth(SEND, SEND + 0.08, t);
    return { x, y, L, j: 0.3 + 0.7 * smooth(SURF, HIT - 0.05, t), a, under: y > 6 };
  };
  return {
    update(t, dt) {
      if (t > WELL && t < HIT && R.chance(90 * dt)) {
        const s = sharkAt(t);
        // spray: off its body in the air, off the fin's wake along the floor while it is under
        if (s.under) beads.push({ x: s.x + R.range(-14, 4), y: -1, vx: R.range(-70, 10), vy: R.range(-110, -40), s: R.chance(0.3) ? 2 : 1, life: R.range(0.3, 0.6) });
        else beads.push({ x: s.x - s.L * 0.3 + R.range(-10, 10), y: Math.min(-1, s.y + R.range(-8, 12)), vx: R.range(-80, -20), vy: R.range(-60, 0), s: R.chance(0.3) ? 2 : 1, life: R.range(0.3, 0.6) });
      }
      for (let i = beads.length - 1; i >= 0; i--) {
        const q = beads[i];
        q.vy += 420 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
        if (q.y > 0 || q.life <= 0) beads.splice(i, 1);
      }
    },
    drawBack(p, t) {
      // the water welling up out of the floor in front of him
      if (t > WELL - 0.2 && t < SEND + 0.2) {
        const k = smooth(WELL - 0.2, WELL, t) * (1 - smooth(SEND, SEND + 0.2, t));
        p.ellipse(36, 0, 26 * k, 3, SW[2], 0.8);
        p.ellipse(36, -1, 18 * k, 1.5, SW[3], 0.8);
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, SW);
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kisame", t0: 0.05, t1: SEALS.end, label: "SUITON", head: b.head });
      // his gills
      for (let i = 0; i < 3; i++) p.px(hx - 2 + i, hy + 1, hex("#1e3a5c"));
      // under the floor: only the dorsal fin cuts along it, a furrow of churning water and foam behind
      if (t > SEND && t < HIT) {
        const s = sharkAt(t), fx = s.x - s.L * 0.02, k = smooth(0, 8, s.y) * (1 - smooth(SURF, SURF + 0.12, t));
        for (let i = 0; i < 9; i++) {
          const x = fx - 6 - i * 7;
          if (x < 60) break;
          p.ellipse(x, 0, 7 - i * 0.4, 1.6, i % 2 ? SW[3] : SW[4], (0.9 - i * 0.09) * k);
        }
        p.ellipse(fx - 30, 0.6, 34, 1.2, SW[1], 0.6 * k);
        p.arc(fx + 8, 0, 7, 2, Math.PI, Math.PI * 1.6, SW[4], k);
      }
      if (t > WELL && t < HIT + 0.05) {
        const s = sharkAt(t), f = Math.floor(t * 20), ca = Math.cos(-s.a), sa = Math.sin(-s.a), RR = s.L * 0.62;
        p.glow(s.x, Math.min(-2, s.y), s.L * 0.8, SW[2], 0.5 * (1 - 0.6 * smooth(4, 12, s.y)));
        p.shade(s.x - RR, s.y - RR, s.x + RR, Math.min(0, s.y + RR), (px, py, out) => {
          const x0 = px - s.x, y0 = py - s.y, x = x0 * ca - y0 * sa, y = x0 * sa + y0 * ca;
          if (!inShark(x, y, s.L, s.j)) return;
          const e = 1.4, edge = !inShark(x - e, y, s.L, s.j) || !inShark(x + e, y, s.L, s.j) || !inShark(x, y - e, s.L, s.j) || !inShark(x, y + e, s.L, s.j) || py > -1.5;
          const u = x / s.L;
          out.a = 1;
          if (edge) return WHITE;
          // eye, gill slits, the teeth along the open jaw, the pale belly
          if (Math.abs(u - 0.34) < 0.025 && Math.abs(y + s.L * 0.06) < 1.5) return SW[0];
          if (u > 0.12 && u < 0.24 && Math.abs(((u - 0.12) * s.L) % 3.5 - 1.7) < 0.6 && Math.abs(y) < s.L * 0.07) return SW[1];
          if (u > 0.27 && Math.abs(y + s.L * 0.017 - 2.5) < 1.6 && (Math.floor(px) & 1)) return WHITE;
          const n = noise2(px * 0.2 - t * 6, py * 0.2, 3);
          return y > s.L * 0.05 ? (n > 0.6 ? SW[4] : SW[3]) : n > 0.7 ? SW[3] : n > 0.35 ? SW[2] : SW[1];
        });
        // a wake of foam behind it once it swims
        // the hole it bursts out of: water thrown up round it
        if (t > SURF && t < HIT) for (let i = 0; i < 6; i++) p.disc(LEAPX - 8 + i * 4, -3 - Math.sin(i * 1.7 + t * 20) * 3, 4, SW[4], 0.7);
      }
      for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, C, clamp(q.life / 0.2));
    },
  };
});
