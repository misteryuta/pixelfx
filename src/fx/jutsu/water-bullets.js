// Water release: three heavy bullets of water spat one after another. The bullets are new (a glassy, wobbling orb
// lit from the top left, squashed along its flight, shedding beads); everything they break into comes from the
// water kit (water/_lib: beads, ripples, mist), and the last one ends in the library's splash, its stone left out.
import { Lights, Rng, READY, fit, clamp, smooth, ease, mix, WHITE, TAU } from "../../core/index.js";
import * as splash from "../water/splash.js";
import { WATER, bead, Ripples, Mist } from "../water/_lib.js";
import { play, seals, MOUTH } from "./_lib.js";

const FIRE = 0.42, GAP = 0.13, SPEED = 300, TX = 128, HY = -22;
const SHOTS = [
  { r: 3.6, dy: 2, drop: 6 },
  { r: 4.2, dy: -1, drop: 4 },
  { r: 5.2, dy: 1, drop: 5 },
];
const at = (i) => FIRE + i * GAP;
const FLY = (TX - 6 - MOUTH[0]) / SPEED;
const hit = (i) => at(i) + FLY;

export const meta = {
  name: "Water bullets",
  desc: "Water release: seals, a deep breath, then three heavy bullets of water spat in rhythm, each bigger than the last, bursting on the target in sprays of beads and a splash.",
  tags: ["jutsu", "water", "move", "projectile", "one-shot"],
  size: [260, 120],
  origin: [48, 100],
  duration: hit(2) + 3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WATER, seed: 4 },
};

const FILL = { ...READY, crouch: 2, lean: -5, fx: 6, fy: -26, bx: 8, by: -26, armsFront: true, ffx: 8, fbx: -8 };
const SPIT = { ...READY, crouch: 5, lean: 6, fx: 9, fy: -24, bx: 4, by: -21, ffx: 11, fbx: -10 };
const SPIT2 = { ...SPIT, crouch: 4, lean: 3 };

const shotKeys = SHOTS.flatMap((s, i) => [
  [at(i), { ...SPIT, lean: 6 + i }, "snap"],
  [at(i) + 0.07, SPIT2],
]);
export const act = {
  target: { x: TX },
  poses: [
    [-0.8, READY],
    ...seals(-0.64, 3, 0.13),
    [-0.18, FILL],
    [FIRE - 0.03, { ...FILL, lean: -7, crouch: 1 }],
    ...shotKeys,
    [at(2) + 0.55, { ...SPIT2, lean: 1 }],
    [at(2) + 1.1, READY],
    [meta.duration, READY],
  ],
  hits: SHOTS.map((s, i) => ({ t: hit(i), stop: 0.04 + i * 0.05, shake: 0.12 + i * 0.1, amp: 1 + i, push: 1.2 + i * 1.1, straw: 6 + i * 10, y: HY })),
  dust: [{ t: FIRE, x: 12, n: 4, dir: 1 }],
};

// the bullet in flight at time t (null before it leaves or after it lands)
function shotAt(i, t) {
  const a = t - at(i);
  if (a < 0 || t >= hit(i)) return null;
  const u = a / FLY, s = SHOTS[i];
  return { x: MOUTH[0] + 2 + a * SPEED, y: MOUTH[1] + (HY + s.dy - MOUTH[1]) * ease.inOutSine(u) + Math.sin(u * Math.PI) * -s.drop, a };
}

export const create = play([{ fx: splash, t: hit(2) + 0.02, x: TX - 2, stone: false, light: 0.8 }], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed + 9), lights = new Lights(), ripples = new Ripples({ sy: 0.25 }), mist = new Mist();
  const beads = [], burst = SHOTS.map(() => false), shot = SHOTS.map(() => false);
  const add = (x, y, vx, vy, s, life, g = 520) => beads.push({ x, y, vx, vy, s, life, max: life, g });
  const [mx, my] = MOUTH;
  return {
    update(t, dt) {
      SHOTS.forEach((s, i) => {
        if (!shot[i] && t >= at(i)) {
          shot[i] = true;
          // the spit: spray off the lips, a cold blink of light
          lights.add(mx + 4, my, 24, C[5], 0.5, 0.1);
          for (let j = 0; j < 6; j++) add(mx + 4, my, R.range(60, 160), R.range(-50, 30), R.int(1, 2), R.range(0.2, 0.4));
        }
        const b = shotAt(i, t);
        // in flight: beads peel off the back of the bullet and fall away
        if (b && R.chance(40 * dt * (s.r / 4))) add(b.x - s.r, b.y + R.range(-s.r, s.r) * 0.6, SPEED * R.range(0.15, 0.4), R.range(-30, 20), R.chance(0.3) ? 2 : 1, R.range(0.3, 0.6));
        if (!burst[i] && t >= hit(i)) {
          burst[i] = true;
          const x = TX - 6, y = HY + s.dy, k = 0.6 + i * 0.25;
          lights.add(x, y, 40 * k, C[5], 0.7, 0.14);
          lights.add(x, y, 12, WHITE, 0.6, 0.05);
          // a spray thrown back and out off the body, the bigger beads arcing and falling to the floor
          for (let j = 0; j < 18 + i * 10; j++) {
            const a = Math.PI + R.range(-1.35, 1.35), sp = R.range(60, 230) * k;
            add(x, y + R.range(-2, 2), Math.cos(a) * sp, Math.sin(a) * sp - R.range(20, 70), R.chance(0.25) ? 3 : R.chance(0.5) ? 2 : 1, R.range(0.45, 0.95));
          }
          for (let j = 0; j < 6 + i * 4; j++) add(x + 4, y + R.range(-4, 4), R.range(20, 90), R.range(-60, 10), R.int(1, 2), R.range(0.4, 0.7));
          for (let j = 0; j < 2 + i; j++) mist.add(x + R.range(-3, 3), y + R.range(-3, 3), R.range(-30, 10), R.range(-14, -4), 3, 8 + i * 2, R.range(0.7, 1.1), "#cdf1ff", 0.22);
          ripples.add(TX - 4, 0, 2, 10 + i * 4, 0.7, { n: 2, gap: 3, k: 0.8 });
        }
      });
      // beads fall and, where they meet the floor, leave a tiny ring
      for (let j = beads.length - 1; j >= 0; j--) {
        const q = beads[j];
        q.vy += q.g * dt;
        q.vx *= 1 - 0.6 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
        if (q.y >= 0) {
          if (q.s > 1 && R.chance(0.6)) ripples.add(q.x, 0, 0.5, 3 + q.s, 0.4, { n: 1, k: 0.6 });
          beads.splice(j, 1);
        } else if (q.life <= 0) beads.splice(j, 1);
      }
      ripples.update(dt);
      mist.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ripples.draw(p, C, -1);
      // a wet patch spreads under the target and dries off
      const w = t - hit(0);
      if (w > 0) {
        const k = smooth(0, 0.4, w) * (1 - smooth(1.6, 2.6, t - hit(2)));
        p.ellipse(TX - 4, 0.5, 6 + 8 * smooth(0, 1.2, w), 1.6, C[2], 0.55 * k);
        p.ellipse(TX - 6, 0, 3 + 3 * smooth(0, 1.2, w), 0.7, C[4], 0.35 * k);
      }
    },
    draw(p, t) {
      // cheeks full: water glinting at the lips just before each spit
      if (t > FIRE - 0.25 && t < at(2)) p.glow(mx + 2, my, 8, C[5], 0.4);
      SHOTS.forEach((s, i) => {
        const b = shotAt(i, t);
        if (!b) return;
        // the bullet: squashed long along its flight and wobbling, a dark rim, a lit body, a white catch-light top left
        const wob = Math.sin(b.a * 70 + i) * 0.12, rx = s.r * (1.28 + wob), ry = s.r * (0.82 - wob * 0.6);
        for (let k = 1; k <= 3; k++) p.ellipse(b.x - k * s.r * 0.9, b.y, rx * (1 - k * 0.22), ry * (1 - k * 0.25), C[3 + (k === 1 ? 1 : 0)], 0.5 - k * 0.12);
        p.ellipse(b.x, b.y, rx + 0.8, ry + 0.8, C[2]);
        p.ellipse(b.x, b.y, rx, ry, C[4]);
        p.ellipse(b.x + 0.4, b.y + ry * 0.25, rx * 0.75, ry * 0.5, C[3]);
        p.ellipse(b.x - rx * 0.25, b.y - ry * 0.3, rx * 0.5, ry * 0.4, C[6]);
        p.px(b.x - rx * 0.45, b.y - ry * 0.5, WHITE);
        p.px(b.x + rx * 0.5, b.y + ry * 0.35, C[6]);
        p.glow(b.x, b.y, 14 + s.r * 2, C[5], 0.35);
      });
      for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, C, clamp(q.life / 0.2));
      ripples.draw(p, C, 1);
      mist.draw(p, mix(C[6], WHITE, 0.3));
      lights.draw(p);
    },
  };
});
