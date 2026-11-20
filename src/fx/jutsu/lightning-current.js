// Raiton: Jibashi (lightning current). Narutopedia: Raiton chakra is made to vibrate until it becomes electricity,
// steered by the user out of the hand; Jibashi's seals are Boar, Tiger, Snake. The reference clip gives the look: the
// current first crawls all over the arm and body, then is let go in a blinding white-cored blast streaked with speed
// lines. Here: one channel held from the palm to the target that keeps re-striking while knots of charge race down it.
// Inked with the lightning kit (lightning/_lib: bowed bolts, stroke, crackle, trace, scorch); the target end opens with
// the library's zap hit, and fires it again when the current surges.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, rng, lerp, mix, hex, WHITE, TAU, sparkle } from "../../core/index.js";
import * as zap from "../lightning/zap-hit.js";
import { VOLT, PLASMA, zigzag, bowed, stroke, crackle, trace, scorch } from "../lightning/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const SEALS = sealRun(0.05, ["i", "tora", "mi"], 0.13, { hold: 0.15, kind: "lightning" });
const CHARGE = SEALS.end, FIRE = CHARGE + 0.55, LEAP = 0.06, SURGE = FIRE + 0.5, HOLD = FIRE + 1.05, BREAK = 0.18, TX = 124;
// the body the current crawls over while it charges: shoulder to fist, and the trunk
const ARM = [[3, -29], [-1, -22], [-3, -17]], BODY = [-6, -36, 10, -4];
const HAND = [17, -22], TGT = [TX - 6, -22];

export const meta = {
  name: "Lightning current",
  desc: "Lightning release: seals, a fist crackling at the hip, then an open palm thrust out and a current that holds the target, re-striking as charge races down it, surging once.",
  tags: ["jutsu", "lightning", "move", "beam", "one-shot"],
  size: [220, 110],
  origin: [44, 90],
  duration: HOLD + BREAK + 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: VOLT, sparks: PLASMA, seed: 6 },
};

const DRAWN = { ...READY, x: -3, crouch: 5, lean: -3, fx: -3, fy: -17, bx: 10, by: -27, armsFront: true, ffx: 9, fbx: -9 };
const THRUST = { ...READY, x: 1, crouch: 4, lean: 5, fx: HAND[0], fy: HAND[1], bx: -5, by: -24, ffx: 12, fbx: -10, toeB: true };
const zapHit = (t, stop, push) => ({ t, stop, push, straw: 6, flash: stop > 0.06 ? 0.05 : 0, skin: "shock", shiver: 0.8, y: -22 });

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [CHARGE + 0.08, DRAWN],
    [FIRE - 0.04, { ...DRAWN, crouch: 6, lean: -4 }],
    [FIRE, THRUST, "snap"],
    [SURGE, { ...THRUST, crouch: 5 }],
    [SURGE + 0.02, { ...THRUST, x: 0, lean: 3 }, "snap"],
    [HOLD, { ...THRUST, crouch: 4, lean: 4 }],
    [HOLD + 0.5, { ...THRUST, crouch: 3, lean: 1, fy: -19 }],
    [HOLD + 1.1, READY],
    [meta.duration, READY],
  ],
  hits: [
    { ...zapHit(FIRE + LEAP, 0.1, 2), shake: 0.16, amp: 1 },
    zapHit(FIRE + 0.24, 0.02, -0.6),
    { ...zapHit(SURGE, 0.08, 2.4), shake: 0.2, amp: 2 },
    zapHit(SURGE + 0.24, 0.02, -0.8),
    zapHit(HOLD - 0.1, 0.02, 0.8),
    { t: HOLD + BREAK + 1.2, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: FIRE, x: 12, n: 6, dir: 1 }],
};

// the current's strength: a hard first flash, a restless hum, a surge, then it stutters out
function level(t) {
  const a = t - FIRE - LEAP;
  if (a < 0) return 0;
  const hum = a < 0.1 ? [1, 0.55, 1][Math.floor(a * 30)] ?? 1 : 0.78 + 0.22 * Math.sin(t * 61) * Math.sin(t * 23);
  const surge = 1 + 0.4 * (1 - smooth(0, 0.25, t - SURGE)) * (t >= SURGE ? 1 : 0);
  const b = t - HOLD;
  return (b < 0 ? hum : b < BREAK ? hum * (1 - b / BREAK) * (Math.floor(b * 60) % 3 === 1 ? 0.4 : 1) : 0) * surge;
}

export const create = play(
  [
    { fx: zap, t: FIRE + LEAP - 0.03, x: TGT[0], y: TGT[1] },
    { fx: zap, t: SURGE - 0.03, x: TGT[0], y: TGT[1] + 2, seed: 9 },
  ],
  (o) => {
    const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0, ASH = hex("#5b5566");
    const ps = new Particles({ rng: R, ground: floor, sparks: o.sparks }), lights = new Lights();
    let leapt = false, surged = false, popped = false;
    const [hx, hy] = HAND, [tx, ty] = TGT;
    // the channel re-strikes every other frame; a second, thinner strand winds round it on its own beat
    const shape = (f, salt, bow) => bowed(rng(o.seed, 31 + salt, f), hx + 1, hy, tx, ty, bow * rng(o.seed, 77 + salt, f).range(0.4, 1), 0.2, salt ? 0.15 : 0.45);
    return {
      update(t, dt) {
        // charging at the hip: streaks drawn in, sparks spat off the fist
        if (t > CHARGE && t < FIRE) {
          const [cx, cy] = [-3, -17];
          if (R.chance(70 * dt)) {
            const a = R.range(0, TAU), d = R.range(10, 22), T = R.range(0.06, 0.1), v = (d * 3) / (Math.exp(3 * T) - 1);
            ps.spawn(P.STREAK, cx + Math.cos(a) * d, cy + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? C[6] : C[5]);
          }
          if (R.chance(10 * dt)) ps.spawn(P.SPARK, cx, cy, R.range(-80, 80), -R.range(20, 120), R.range(0.12, 0.3));
        }
        if (!leapt && t >= FIRE + LEAP) {
          leapt = true;
          lights.add(tx, ty, 60, C[4], 0.9, 0.22);
          lights.add(hx, hy, 40, C[5], 0.7, 0.15);
          for (let j = 0; j < 18; j++) {
            const a = Math.PI + R.range(-1.2, 1.2), sp = R.range(70, 230);
            ps.spawn(P.SPARK, tx, ty, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.15, 0.4));
          }
        }
        if (!surged && t >= SURGE) {
          surged = true;
          lights.add((hx + tx) / 2, hy, 90, C[5], 0.6, 0.2);
          for (let j = 0; j < 14; j++) {
            const u = R.next(), sp = R.range(60, 180), a = R.range(0, TAU);
            ps.spawn(P.SPARK, lerp(hx, tx, u), lerp(hy, ty, u), Math.cos(a) * sp, Math.sin(a) * sp - 30, R.range(0.12, 0.3));
          }
        }
        const k = level(t);
        if (k > 0) {
          // while it holds: sparks shed off the channel, the target spits sparks to the floor
          if (R.chance(14 * dt)) ps.spawn(P.SPARK, lerp(hx, tx, R.next()), lerp(hy, ty, R.next()) - 2, R.range(-60, 60), R.range(-90, 20), R.range(0.1, 0.25));
          if (R.chance(10 * dt)) ps.spawn(P.SPARK, tx + R.range(-4, 4), -1, R.range(-70, 70), -R.range(40, 140), R.range(0.12, 0.3));
        }
        if (!popped && t >= HOLD + BREAK) {
          popped = true;
          for (let j = 0; j < 9; j++) {
            const a = R.range(0, TAU), sp = R.range(40, 140);
            ps.spawn(P.SPARK, tx, ty, Math.cos(a) * sp, Math.sin(a) * sp - 30, R.range(0.12, 0.3));
          }
          for (let j = 0; j < 3; j++) ps.spawn(P.SMOKE, tx + R.range(-4, 4), ty + R.range(-4, 6), R.range(-4, 4), -R.range(10, 18), R.range(0.8, 1.2), mix(ASH, C[2], 0.35), R.range(2.5, 3.5), j * 0.1);
          lights.add(tx, ty, 34, C[4], 0.5, 0.12);
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        // the floor under the target scorches where the current grounds itself
        const a = t - FIRE - LEAP;
        if (a > 0) scorch(p, tx + 2, 0, 9, Math.min(1, a / 0.2) * Math.pow(clamp(1 - (t - HOLD) / 0.8), 1.3) * 0.9, 1 - smooth(HOLD + 1, HOLD + 1.5, t));
        ps.draw(p, "back");
      },
      draw(p, t) {
        const f = Math.floor(t * 30 + 1e-4), f2 = f >> 1, k = level(t);
        drawSeals(p, t, SEALS, C.slice(2));
        // charging: the current crawls over the whole body; arcs run down the drawn-back arm into the fist
        const body = t > CHARGE ? (t < FIRE ? smooth(CHARGE, FIRE - 0.15, t) : Math.min(1, k) * 0.6) : 0;
        if (body > 0.02) {
          const r2 = rng(o.seed, 21, f), [x0, y0, x1, y1] = BODY;
          for (let j = 0; j < 2 + Math.round(3 * body); j++) {
            const ax = r2.range(x0, x1), ay = r2.range(y0, y1), a = r2.range(0, TAU), d = r2.range(4, 9);
            crackle(p, zigzag(r2, ax, ay, ax + Math.cos(a) * d, ay + Math.sin(a) * d, 0.45, 0.3), r2.range(0.45, 0.8) * body, C, 0.3);
          }
          if (t < FIRE) crackle(p, zigzag(r2, ARM[0][0], ARM[0][1], ARM[2][0], ARM[2][1], 0.35, 0.4), 0.8 * body, C, 0.4);
          p.glow(2, -20, 28, C[4], 0.3 * body);
          if (r2.next() < 0.4 * body) crackle(p, zigzag(r2, r2.range(-4, 6), -6, r2.range(-8, 10), -0.5, 0.3, 0.2), 0.6 * body, C, 0.3);
        }
        // the fist at the hip while it charges: a crackling knot
        if (t > CHARGE && t < FIRE) {
          const g = smooth(CHARGE, FIRE, t), r2 = rng(o.seed, 5, f), a = r2.range(0, TAU), d = r2.range(4, 8) * (0.5 + g);
          p.circle(-3, -17, 1 + 2 * g, C[5]);
          p.circle(-3, -17, 0.8 + g, WHITE);
          p.glow(-3, -17, 20, C[4], 0.7 * g);
          crackle(p, zigzag(r2, -3, -17, -3 + Math.cos(a) * d, -17 + Math.sin(a) * d, 0.4, 0.3), 0.6 * g, C, 0.3);
        }
        // the release, as in the clip: one white frame over the channel, then speed lines raking along it while it holds
        if (k > 0) {
          const L = tx - hx, r3 = rng(o.seed, 41, f);
          for (let j = 0; j < 7; j++) {
            const u0 = ((t * 3.2 + j * 0.37) % 1), len = r3.range(10, 26), off = r3.range(-11, 11);
            const sx = hx + L * u0, sy = hy + (ty - hy) * u0 + off;
            p.line(sx, sy, Math.min(tx, sx + len), sy, Math.abs(off) < 5 ? C[6] : C[5], 0.55 * Math.min(1, k));
          }
        }
        // the leap: the current races out of the palm with a hot head
        if (t >= FIRE && t < FIRE + LEAP) {
          const u = ease.outQuad((t - FIRE) / LEAP), b = shape(-1, 0, -8);
          stroke(p, { paths: [b.paths[0]] }, 1, C, 0.8, { upTo: u });
          const tp = b.paths[0].pts, [px, py] = tp[Math.min(tp.length - 1, Math.floor(u * (tp.length - 1)))];
          p.circle(px, py, 2, WHITE);
          p.glow(px, py, 16, C[5], 0.7);
        }
        if (k > 0) {
          const main = shape(f2, 0, f2 % 2 ? -7 : 6), hero = t - FIRE - LEAP < 0.07;
          // a fat channel with a thick white core, like the blast in the clip, thickening further on the surge
          stroke(p, main, Math.min(1, k), C, 1.6 + 0.5 * Math.max(0, k - 1) * 2.5, { light: 0.7, core: 1.1, hero });
          // two more strands wound round it, flickering in and out on their own beats
          if (f % 3 !== 2) stroke(p, shape(f, 1, f % 2 ? 10 : -10), 0.6 * Math.min(1, k), C, 0.8, { light: 0.3 });
          if (f % 4 !== 1) crackle(p, shape(f + 7, 2, f % 2 ? -13 : 12), 0.55 * Math.min(1, k), C, 0.25);
          p.glowLine(hx, hy, tx, ty, 18, C[4], 0.35 * Math.min(1, k));
          // knots of charge racing down the channel from the palm to the target
          const pts = main.paths[0].pts;
          for (let j = 0; j < 3; j++) {
            const u = (t * 2.8 + j / 3) % 1, [qx, qy] = pts[Math.min(pts.length - 1, Math.floor(u * (pts.length - 1)))];
            p.circle(qx, qy, 1.5, C[6]);
            p.px(qx, qy, WHITE);
            p.glow(qx, qy, 10, C[5], 0.5 * Math.min(1, k));
          }
          // the palm holds it: a bright node; the target end: a node with arcs crawling over the body
          for (const [nx, ny, big] of [[hx + 1, hy, 0], [tx, ty, 1]]) {
            const r = (2 + big + Math.sin(t * 47 + big) * 0.6) * Math.min(1.3, k);
            p.circle(nx, ny, r + 1.4, C[3]);
            p.circle(nx, ny, r + 0.6, C[5]);
            p.circle(nx, ny, r * 0.55, WHITE);
            p.glow(nx, ny, 22 + big * 8, C[4], 0.6 * Math.min(1, k));
          }
          const r2 = rng(o.seed, 11, f);
          for (let j = 0; j < 2; j++) {
            const a0 = r2.range(0, TAU), a1 = a0 + r2.sign() * r2.range(0.6, 1.2), d0 = r2.range(4, 7), d1 = r2.range(6, 11);
            crackle(p, zigzag(r2, tx + Math.cos(a0) * d0, ty + Math.sin(a0) * d0 * 1.6, tx + Math.cos(a1) * d1, ty + Math.sin(a1) * d1 * 1.6, 0.35, 0), r2.range(0.45, 0.7) * Math.min(1, k), C, 0.25);
          }
          if (r2.next() < 0.45) {
            const gx = tx + r2.range(-4, 6);
            crackle(p, zigzag(r2, tx + r2.range(-2, 2), ty + 4, gx, -0.5, 0.3, 0.35), 0.75 * Math.min(1, k), C, 0.35);
            p.px(gx, -1, WHITE);
          }
          // the surge's hero frame: a white glint at both ends
          const s = t - SURGE;
          if (s > 0 && s < 0.15) {
            sparkle(p, hx + 1, hy, Math.round(10 * (1 - s / 0.15)), C[6], C[4], 0.6);
            sparkle(p, tx, ty, Math.round(14 * (1 - s / 0.15)), C[6], C[4], 0.6);
          }
        } else if (t >= HOLD + BREAK && t < HOLD + BREAK + 0.4) {
          // the spent channel: a dotted trace that cools and goes
          const g = 1 - (t - HOLD - BREAK) / 0.4;
          trace(p, shape(Math.floor((HOLD + BREAK) * 15), 0, 6).paths[0].pts, g > 0.5 ? C[4] : C[2], g * 0.9);
        }
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);
