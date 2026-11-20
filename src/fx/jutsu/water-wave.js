// Suiton: Mizurappa (raging waves). Narutopedia: seals Dragon, Ox, Hare; like the great fireball, but water is spat
// from the mouth at the enemy. The reference clip stages it: one hand keeps a one-handed seal at the chest, the cheeks
// fill, and a torrent bursts from the mouth and fans out wide, its edges torn into white, saw-toothed foam.
// The torrent is new (a widening cone shaded per pixel, bands racing down it, jagged foam rims); everything it
// breaks into comes from the water kit (water/_lib: beads, ripples, mist) and it ends in the library splash.
import { Lights, Rng, READY, fit, clamp, smooth, ease, mix, noise, noise2, WHITE, TAU } from "../../core/index.js";
import * as splash from "../water/splash.js";
import { WATER, bead, Ripples, Mist } from "../water/_lib.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["tatsu", "ushi", "u"], 0.14, { hold: 0.2 });
const FILL = SEALS.end, OPEN = FILL + 0.34, REACH = 0.2, HOLD = OPEN + 1.25, CUT = 0.3, TX = 132, HY = -20;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
const LEN = TX - 6 - MX;

export const meta = {
  name: "Raging waves",
  desc: "Suiton: Dragon, Ox, Hare, then one hand held in a seal as a torrent bursts from the mouth and fans out wide with white saw-toothed foam, hammering the target.",
  tags: ["jutsu", "water", "suiton", "move", "beam", "one-shot"],
  size: [250, 130],
  origin: [44, 110],
  duration: HOLD + CUT + 2.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WATER, seed: 4 },
};

// the one-handed seal: the near hand up at the chest, two fingers raised; the far arm thrown back for balance
const HELD = { ...READY, crouch: 4, lean: -4, fx: 9, fy: -26, bx: -5, by: -22, ffx: 9, fbx: -9 };
const BLOW = { ...HELD, crouch: 5, lean: 5, fx: 10, fy: -25, bx: -7, by: -24, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [FILL + 0.08, HELD],
    [OPEN - 0.04, { ...HELD, lean: -6, crouch: 3 }],
    [OPEN, BLOW, "snap"],
    [OPEN + 0.6, { ...BLOW, lean: 6, crouch: 6 }],
    [HOLD, { ...BLOW, lean: 4 }],
    [HOLD + CUT + 0.5, { ...BLOW, lean: 1, crouch: 3 }],
    [HOLD + CUT + 1.1, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: OPEN + REACH, stop: 0.1, shake: 0.22, amp: 2, push: 2.6, straw: 18, y: HY },
    { t: OPEN + REACH + 0.35, stop: 0.03, push: 1.2, straw: 8, y: HY },
    { t: OPEN + REACH + 0.7, stop: 0.03, push: 1.4, straw: 8, y: HY },
    { t: HOLD, stop: 0.06, shake: 0.12, amp: 1, push: 2, straw: 12, y: HY },
  ],
  dust: [{ t: OPEN, x: 12, n: 4, dir: 1 }],
};

// how far the torrent's head has got (0..1 of the way) and where its tail is once it's cut off
const head = (t) => ease.outCubic(clamp((t - OPEN) / REACH));
const tail = (t) => ease.inQuad(clamp((t - HOLD) / CUT));
// the torrent's centreline sags a little and wavers; its half-width opens out with distance
const centre = (d, t) => MY + (HY - MY) * (d / LEN) + Math.sin(d * 0.09 - t * 14) * 0.8 * (d / LEN);
const half = (d, t) => 1.6 + d * 0.13 + 1.2 * noise(d * 0.15 - t * 10, 3);

export const create = play([{ fx: splash, t: HOLD + 0.05, x: TX - 4, stone: false, light: 0.8 }], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed + 9), lights = new Lights(), ripples = new Ripples({ sy: 0.25 }), mist = new Mist();
  const beads = [];
  const add = (x, y, vx, vy, s, life, g = 520) => beads.push({ x, y, vx, vy, s, life, g });
  let burst = false;
  return {
    update(t, dt) {
      // the cheeks fill: a few beads leak at the lips
      if (t > FILL && t < OPEN && R.chance(10 * dt)) add(MX, MY, R.range(10, 40), R.range(-20, 10), 1, 0.3);
      if (!burst && t >= OPEN) {
        burst = true;
        lights.add(MX + 4, MY, 30, C[5], 0.6, 0.12);
        for (let j = 0; j < 10; j++) add(MX + 2, MY, R.range(60, 200), R.range(-90, 40), R.int(1, 2), R.range(0.2, 0.4));
      }
      const h = head(t), tl = tail(t), live = t >= OPEN && tl < 1;
      if (live) {
        // spray torn off the torrent's edges all along it
        const n = Math.round(60 * dt * 30) / 30 > 0 ? Math.max(1, Math.round(70 * dt)) : 0;
        for (let j = 0; j < n; j++) {
          const d = LEN * R.range(tl, h), y0 = centre(d, t), w = half(d, t), sd = R.sign();
          add(MX + d, y0 + sd * w, R.range(40, 160), sd * R.range(30, 120) - 30, R.chance(0.3) ? 2 : 1, R.range(0.25, 0.55));
        }
        // where it lands on the target: a boiling crown of spray thrown up and back, mist, rings on the floor
        if (h >= 1) {
          for (let j = 0; j < Math.max(1, Math.round(90 * dt)); j++) {
            const a = Math.PI + R.range(-1.6, 1.6), sp = R.range(60, 220);
            add(TX - 6, HY + R.range(-8, 8), Math.cos(a) * sp + 40, Math.sin(a) * sp - R.range(30, 90), R.chance(0.25) ? 3 : R.chance(0.5) ? 2 : 1, R.range(0.4, 0.9));
          }
          if (R.chance(8 * dt)) mist.add(TX - 6 + R.range(-4, 4), HY + R.range(-6, 6), R.range(-20, 20), R.range(-20, -6), 3, 10, R.range(0.6, 1), "#cdf1ff", 0.22);
          if (R.chance(5 * dt)) ripples.add(TX - 4 + R.range(-6, 6), 0, 1, R.range(8, 16), 0.6, { n: 2, gap: 3, k: 0.8 });
          if (R.chance(6 * dt)) lights.add(TX - 6, HY, 34, C[5], 0.4, 0.1);
        }
      }
      for (let j = beads.length - 1; j >= 0; j--) {
        const q = beads[j];
        q.vy += q.g * dt;
        q.vx *= 1 - 0.6 * dt;
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
    drawBack(p, t) {
      ripples.draw(p, C, -1);
      // a wet sheen spreads on the floor under the target and dries
      const w = t - OPEN - REACH;
      if (w > 0) {
        const k = smooth(0, 0.4, w) * (1 - smooth(1.8, 2.8, t - HOLD));
        p.ellipse(TX - 4, 0.5, 8 + 10 * smooth(0, 1.2, w), 1.8, C[2], 0.55 * k);
        p.ellipse(TX - 6, 0, 4 + 4 * smooth(0, 1.2, w), 0.8, C[4], 0.35 * k);
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(2));
      const h = head(t), tl = tail(t);
      if (t >= OPEN && tl < 1 && h > tl) {
        const d0 = LEN * tl, d1 = LEN * h, W = half(LEN, t) + 4;
        // the torrent: bands of blue racing out along it, a white core near the mouth, saw-toothed foam on both rims
        p.shade(MX + d0 - 2, Math.min(MY, HY) - W - 3, MX + d1 + 3, Math.max(MY, HY) + W + 3, (x, y, out) => {
          const d = x - MX;
          if (d < d0 || d > d1 || y > 0) return;
          const yc = centre(d, t), w = half(d, t), v = (y - yc) / w, av = Math.abs(v);
          // the rim tears into teeth that race outward with the flow
          const tooth = ((d * 0.32 - t * 26 + (v > 0 ? 0.5 : 0)) % 1 + 1) % 1, teeth = 0.18 * (1 - tooth) * Math.min(1, d / 18);
          if (av > 1 + teeth) return;
          const flow = noise2(d * 0.1 - t * 11, v * 2.2, 7), core = 1 - av;
          if (av > 0.82) out.c = av > 0.95 ? WHITE : C[6];
          else out.c = flow > 0.35 && core > 0.25 ? C[6] : flow > 0.05 ? C[5] : core > 0.5 ? C[4] : C[3];
          // near the mouth it is a hot white jet; far out it thins and goes glassy
          if (d < 10 && core > 0.3) out.c = WHITE;
          out.a = d1 - d < 3 ? 0.7 : 1;
        });
        // the head: a churning cap of foam where it hits
        const hx = MX + d1, hy = centre(d1, t);
        p.circle(hx, hy, 3 + 2 * Math.abs(Math.sin(t * 25)), C[6]);
        p.glow(hx, hy, 26, C[5], 0.45);
        p.glowLine(MX, MY, hx, hy, 12, C[4], 0.25);
      }
      for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, C, clamp(q.life / 0.2));
      ripples.draw(p, C, 1);
      mist.draw(p, mix(C[6], WHITE, 0.3));
      lights.draw(p);
    },
  };
});
