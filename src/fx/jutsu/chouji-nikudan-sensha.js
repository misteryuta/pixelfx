// Nikudan Sensha (Human Boulder / Human Bullet Tank, Chouji). Narutopedia: a showy Akimichi taijutsu; after Baika no
// Jutsu (expansion) the user tucks into a ball and rolls at the target, the spin pulverising most obstacles and making
// them hard to stop. Here: the seal, Chouji swelling up huge, tucking into a ball with his head and limbs pulled in, the
// ball spinning up in place with the ground smoking under it, then tearing across the floor, slamming the target and
// bouncing back, unrolling into Chouji again.
// New: the ball (a shaded sphere of his clothes and skin with the turning stripes and spiral of his scarf, the limbs
// tucked), the swelling, the spin-up, the gouge and smoke. From the library: the blunt hit.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as blunt from "../impacts/blunt-hit.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["mi"], 0.12, { hold: 0.35 });
const SWELL = SEALS.end, BALL = SWELL + 0.35, REV = BALL + 0.45, ROLL = REV + 0.05, HIT = ROLL + 0.42, BOUNCE = HIT + 0.45, OPEN = BOUNCE + 0.2, END = OPEN + 1, TX = 160, BR = 17;
const RED = ["#4a1a12", "#8a2a1a", "#c8442a", "#f07a4a"].map(hex), SKIN = hex("#f1c7a3"), SKD = hex("#c98b6c");

export const meta = {
  name: "Human boulder",
  desc: "Chouji: he swells up huge, tucks into a spinning ball that smokes against the floor, tears across it, slams the target and bounces back, unrolling into himself again.",
  tags: ["jutsu", "chouji", "akimichi", "taijutsu", "dash", "melee", "one-shot"],
  size: [270, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1a12", "#8a2a1a", "#c8442a", "#f07a4a"], seed: 61 },
};

export const actorAlpha = (t) => (t >= BALL && t < OPEN ? 0 : 1);

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SWELL + 0.2, { ...READY, crouch: 8, fx: 12, fy: -22, bx: 8, by: -24 }, "out"],
    [OPEN, { ...READY, x: TX - 50, crouch: 10 }, "snap"],
    [END, { ...READY, x: TX - 50 }],
  ],
  hits: [
    { t: HIT, stop: 0.18, shake: 0.45, amp: 4, push: 5, straw: 36 },
    { t: HIT + 0.15, stop: 0.03, flash: 0, push: 1, straw: 10 },
  ],
  dust: [{ t: ROLL, x: 4, n: 12, dir: -1 }, { t: OPEN, x: TX - 50, n: 8 }],
};

// where the ball is and how fast it has turned
const ballAt = (t) => {
  if (t < ROLL) return { x: 6, spin: Math.max(0, t - BALL) ** 2 * 60 };
  if (t < HIT) {
    const u = ease.inQuad((t - ROLL) / (HIT - ROLL));
    return { x: 6 + (TX - BR - 12 - 6) * u, spin: (REV - BALL) ** 2 * 60 + (t - ROLL) * 40 };
  }
  const u = clamp((t - HIT) / (BOUNCE - HIT)), x = TX - BR - 12 - 40 * ease.outCubic(u);
  return { x, y: -Math.sin(Math.PI * u) * 18, spin: (REV - BALL) ** 2 * 60 + (HIT - ROLL) * 40 + (t - HIT) * 10 };
};

function ball(p, x, y, r, spin) {
  p.shade(x - r - 1, y - r * 2 - 1, x + r + 1, y + 1, (px, py, out) => {
    const dx = (px - x) / r, dy = (py - (y - r)) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const z = Math.sqrt(1 - d2), lit = -dx * 0.4 - dy * 0.5 + z * 0.5;
    if (d2 > 0.85) return RED[0];
    // the clothes turning: bands round the ball, a pale belly patch and the spiral of the scarf going round
    const a = Math.atan2(dy, dx) + spin, band = Math.floor(((a / TAU) * 6 + 60) % 6);
    if (Math.hypot(dx - Math.cos(spin) * 0.45, dy - Math.sin(spin) * 0.45) < 0.28) return lit > 0.3 ? SKIN : SKD;
    if (band === 2) return lit > 0.4 ? hex("#e8e0d0") : hex("#a8a098");
    return lit > 0.55 ? RED[3] : lit > 0.25 ? RED[2] : RED[1];
  });
}

export const create = play([{ fx: blunt, t: HIT, x: TX - 12, height: 18, seed: 9 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      const q = ballAt(t);
      // the spin-up: the floor smoking and sparking under the ball; on the roll, a wake of dust and grit
      if (t > BALL + 0.1 && t < HIT && R.chance(90 * dt)) {
        ps.spawn(P.DUST, q.x - BR * 0.6, -1, -R.range(40, 120), -R.range(4, 30), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
        if (R.chance(0.5)) ps.spawn(P.GRIT, q.x - BR * 0.5, -1, -R.range(60, 180), -R.range(20, 80), R.range(0.3, 0.6), hex("#5a4c66"));
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      if (t > ROLL) {
        const q = ballAt(Math.min(t, HIT)), k = 1 - smooth(HIT + 0.3, END, t);
        p.line(6, 0, q.x, 0, hex("#120c18"), k);
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, RED.concat([hex("#ffd0a0")]));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "akimichi", t0: 0.05, t1: SEALS.end, label: "BAIKA", head: b.head });
      // swelling: his body drawn bigger and bigger over the stock one, then the poof into the ball
      if (t > SWELL && t < BALL) {
        const s = 1 + 0.6 * ease.outBack(clamp((t - SWELL) / (BALL - SWELL - 0.05)), 2);
        for (let k = 0; k < 3; k++) p.ellipse(4, -18 * s, 10 * s - k, 16 * s - k * 2, k ? RED[2 + (k > 1)] : RED[0]);
        p.circle(6, -34 * s + 2, 6 * s, SKIN);
        p.px(8, -34 * s + 1, hex("#120c18"));
      }
      if (t >= BALL && t < OPEN) {
        const q = ballAt(t);
        ball(p, q.x, q.y ?? 0, BR, q.spin);
        // speed lines while it rolls
        if (t > ROLL && t < HIT) for (let i = 0; i < 4; i++) p.line(q.x - BR - 4 - i * 6, -6 - i * 7, q.x - BR - 14 - i * 6, -6 - i * 7, hex("#d8d0c8"), 0.7);
      }
      drawPoof(p, 6, -18, t - BALL + 0.05, 1.6, 3);
      drawPoof(p, TX - 50, -18, t - OPEN + 0.05, 1.6, 5);
      ps.draw(p, "front");
    },
  };
});
