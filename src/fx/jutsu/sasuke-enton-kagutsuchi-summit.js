// Enton: Kagutsuchi (Blaze Release, anime English: "Inferno Style: Flame Control"), Sasuke at the Five Kage Summit.
// Narutopedia (Blaze Release: Kagutsuchi, debut manga ch. 464, anime ep. 203): shape transformation applied to
// Amaterasu's black flames; Sasuke casts Amaterasu with his left eye and shapes the flames with his right. Against A he
// first covers his ribcage Susanoo with them (ch. 463), then converges them in front of himself into a barrier of
// spike-shaped flames that shields him and pierces and burns anyone who touches it (ch. 464). Fourth Databook: he
// invented it in that fight.
// Not Itachi's Amaterasu (fire born where the eye looks): here the fire already burns, and the thing to follow is the
// fire changing shape under his control. Here: the purple ribs of his Susanoo round him, black flame burning on the
// floor in front; his right eye narrows and bleeds; the flames lift off the floor and stream to one point in front of
// him, flatten into a wall, and spikes push out of the wall one after another toward the enemy; the enemy charges in
// and runs onto them (the hit), held burning; the spikes melt back into the wall, it sinks into the floor and the
// enemy is thrown back off them.
// New: the ribcage Susanoo (stage one, no armour), flame streams converging, the spike barrier.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, drawBlackFlame, BLACK_FIRE } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.45, GATHER = 0.8, WALL = 1.5, SPIKES = 1.8, CHARGE = 2.35, CONTACT = 2.6, MELT = 3.25, THROW = 3.45, END = 4.4;
const TX = 150, BX = 44; // where the barrier stands
const RIB = ["#2a0e46", "#5a2a8a", "#9a5ad0", "#d8b0ff"].map(hex), F = BLACK_FIRE;
// the spikes of the barrier: height on the wall, length, when it pushes out
const SPK = [
  { y: -30, L: 22, t0: 0 }, { y: -18, L: 26, t0: 0.06 }, { y: -40, L: 16, t0: 0.11 }, { y: -8, L: 18, t0: 0.15 },
  { y: -24, L: 30, t0: 0.19 }, { y: -46, L: 12, t0: 0.24 }, { y: -12, L: 24, t0: 0.27 }, { y: -35, L: 20, t0: 0.31 },
];
// the floor fires before he takes hold of them
const POOLS = [{ x: 30, w: 7, h: 16 }, { x: 58, w: 8, h: 20 }, { x: 84, w: 7, h: 15 }];

export const meta = {
  name: "Blaze release: Kagutsuchi",
  desc: "Sasuke at the Kage Summit: inside the purple ribs of his Susanoo, his right eye bleeds and the black flames on the floor lift, stream to a point in front of him and set into a wall that pushes out spikes one after another; the enemy charges onto them and burns; the spikes melt back and the wall sinks.",
  tags: ["jutsu", "sasuke", "mangekyou", "amaterasu", "enton", "fire", "barrier", "counter", "one-shot"],
  size: [260, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#050306", "#2a0c1a", "#6a1028", "#5a2a8a", "#d8b0ff"], seed: 73 },
};

const STAND = { ...READY, crouch: 3, fx: 8, fy: -26, bx: 4, by: -20, ffx: 7, fbx: -7 };
const FOCUS = { ...STAND, crouch: 5, lean: 2, fx: 10, fy: -36, bx: 6, by: -22 };
const COMMAND = { ...STAND, crouch: 6, lean: 6, fx: 18, fy: -28, bx: 4, by: -22 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, STAND],
    [EYE, FOCUS, "out"],
    [WALL, COMMAND, "out"],
    [MELT, COMMAND],
    [END, { ...STAND, crouch: 4 }],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    // the wall is up: from here on it covers him
    { t: SPIKES, stop: 0.02, push: 0, straw: 1, flash: 0, sfx: "rumble" },
    { t: CONTACT, stop: 0.16, shake: 0.35, amp: 2, push: 0, straw: 18, flash: 0, skin: "burn", sfx: "heavy" },
    { t: THROW, stop: 0.05, shake: 0.2, amp: 1, push: 0, straw: 10, sfx: "explosion" },
    { t: END - 0.25, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the enemy charges in onto the spikes, is held there, then thrown back off them
const IN = BX + 34 - TX;
export const targetState = (t) => {
  if (t < CHARGE) return null;
  const run = ease.inCubic(smooth(CHARGE, CONTACT, t)), back = ease.outCubic(smooth(THROW, THROW + 0.45, t));
  const dx = IN * run * (1 - back), held = t > CONTACT && t < THROW;
  return { dx, dy: -4 * Math.sin(back * Math.PI), rot: held ? Math.sin(t * 50) * 0.02 : -0.25 * Math.sin(back * Math.PI), tint: [F[1], held ? 0.35 : 0.2 * (1 - back)] };
};

// the camera: on him in his ribs; in on the right eye; then held on the flames between him and the enemy while they
// change shape (the accent); wider for the charge and the hit; out as the wall sinks
export const camera = cineCam([
  [0, { z: 1.3, x: 50, y: -32 }],
  [EYE, { z: 2.4, x: 6, y: -38, r: -2 }],
  [GATHER, { z: 1.9, x: 40, y: -30, r: 0 }, "cut"],
  [SPIKES + 0.3, { z: 2.05, x: BX + 8, y: -28, r: 2 }],
  [CHARGE, { z: 1.45, x: 90, y: -30, r: 0 }],
  [CONTACT, { z: 1.6, x: BX + 30, y: -30, r: -2, shake: 0.6 }],
  [CONTACT + 0.3, { z: 1.55, x: BX + 30, y: -30, r: -1 }],
  [END, { z: 1.15, x: 80, y: -32 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  // how much of the floor fire has been drawn off into the wall
  const drawn = (t) => smooth(GATHER, WALL, t);
  const wallH = (t) => 52 * ease.outBack(smooth(WALL - 0.2, SPIKES, t), 1.3) * (1 - ease.inCubic(smooth(MELT, END - 0.5, t)));
  return {
    update(t, dt) {
      // streams: embers of black flame flying from the floor fires to the point in front of him
      if (t > GATHER && t < WALL + 0.1) for (const f of POOLS) if (R.chance(40 * dt)) {
        const sx = f.x + R.range(-3, 3), sy = -R.range(2, f.h);
        ps.spawn(P.MOTE, sx, sy, (BX - sx) * 2.6, (-26 - sy) * 2.2, R.range(0.3, 0.45), R.chance(0.5) ? F[2] : F[3]);
      }
      if (t > CONTACT && t < THROW + 0.3 && R.chance(40 * dt)) ps.spawn(P.SMOKE, BX + 34 + R.range(-6, 6), -R.range(10, 40), R.range(-6, 6), -R.range(10, 25), R.range(0.5, 1), F[1], 1.2);
      ps.update(dt);
    },
    drawBack(p, t) {
      // the ribs of his Susanoo behind him: the first stage only
      const b = bodyAt(act.poses, t), [cx, cy] = b.chest;
      // a spine behind him, ribs curving forward round him from it, bigger than he is
      const sx = cx - 13, form = smooth(0, 0.35, t);
      p.beam(sx, cy - 24, sx + 2, cy + 14, 3, RIB[1], form);
      for (let i = 0; i < 6; i++) {
        const ry = cy - 20 + i * 6.5, w = 28 - Math.abs(i - 2) * 3, sag = 4 + i * 0.6;
        let px = sx, py = ry;
        for (let k = 1; k <= 10; k++) {
          const u = k / 10, nx = sx + w * u, ny = ry + sag * Math.sin(u * Math.PI * 0.9) - 3 * u;
          p.beam(px, py, nx, ny, 2, RIB[1], form);
          p.line(px, py - 1, nx, ny - 1, RIB[3], 0.6 * form);
          (px = nx), (py = ny);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sasukeMS", t0: 0.05, t1: EYE, label: "ENTON", head: b.head });
      // the right eye: the glint, blood running
      drawGlint(p, t, "sasukeMS", EYE, WALL, b.head);
      if (t > EYE + 0.1) { const L = 6 * smooth(EYE + 0.1, GATHER + 0.4, t); p.line(b.head[0] + 2, b.head[1] + 1, b.head[0] + 2, b.head[1] + 1 + L, hex("#8a0010")); }
      // the floor fires, shrinking as he draws them off
      for (const [i, f] of POOLS.entries()) drawBlackFlame(p, f.x, 0, f.w, f.h, t, i * 3 + 1, 1 - drawn(t));
      // the gathering mass at the point, growing, then setting into the wall
      const g = drawn(t), h = wallH(t);
      if (g > 0 && t < WALL + 0.1) drawBlackFlame(p, BX, -10 + 10 * g, 4 + 8 * g, 10 + 30 * g, t, 9, 1);
      if (h > 1) {
        // the wall: a flat slab of flame standing on the floor, its face crawling
        p.shade(BX - 6, -h - 2, BX + 7, 1, (x, y) => {
          const v = -y / h, n = noise2(x * 0.4, y * 0.15 - t * 4, 31);
          if (v > 1 + 0.08 * n || v < -0.02) return;
          const edge = Math.abs(x - BX) > 4.5 + n;
          if (Math.abs(x - BX) > 6) return;
          return edge ? F[3] : n > 0.55 ? F[1] : F[0];
        });
        p.glow(BX, -h / 2, h * 0.9, F[4], 0.25);
        // the spikes pushing out of its face toward the enemy, one after another; melting back at the end
        for (const s of SPK) {
          const u = ease.outBack(smooth(SPIKES + s.t0, SPIKES + s.t0 + 0.14, t), 1.6) * (1 - smooth(MELT + s.t0 * 0.5, MELT + s.t0 * 0.5 + 0.2, t));
          if (u <= 0 || -s.y > h) continue;
          const x0 = BX + 5, L = s.L * u, y0 = s.y;
          p.poly([[x0, y0 - 3], [x0 + L, y0], [x0, y0 + 3]], F[0]);
          p.line(x0, y0 - 3, x0 + L, y0, F[3]);
          p.line(x0 + L - 3, y0, x0 + L, y0, F[4]);
        }
      }
      // the hit: the enemy on the spikes catches black flame
      if (t > CONTACT) drawBlackFlame(p, TX + targetState(t).dx, 0, 9, 34, t, 17, (1 - smooth(THROW + 0.4, END - 0.3, t)) * smooth(CONTACT, CONTACT + 0.15, t));
      if (t > CONTACT && t < CONTACT + 0.06) p.line(BX + 30, -40, BX + 40, -10, WHITE, 1 - (t - CONTACT) / 0.06);
      ps.draw(p, "front");
    },
  };
});
