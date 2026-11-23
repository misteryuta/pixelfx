// Shinra Tensei (Almighty Push, Pain / Deva Path). Narutopedia: the pinnacle of the Deva Path's power over attraction
// and repulsion: the user creates a repulsive force, usually all round their body, that repels everything in range,
// strong enough to deflect any attack and flatten a town; it can be narrowed and aimed; after each use there is a
// short interval before the next. In the anime the air ripples visibly round Pain, the ground under his feet is
// crushed into a crater, and whatever stood near is hurled away.
// Here: the Rinnegan; he lifts a hand, palm out, the words; a beat of dead stillness while the air is drawn in tight
// round him (everything leans toward him, dust creeping in); then the push: a sphere of bent air bursts out of him,
// the ground under his feet caves into a crater with a raised rim, a ring of dust and grit and lifted rocks races out
// along the floor; the target is thrown far away, tumbling, hits the ground, bounces once and skids to a stop.
// The camera: close on him and the raised hand, pushing in during the stillness; a hard cut wide as it bursts,
// shaking, then following the target's flight and holding on where it lands.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, mix, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.05, OPEN = 0.55, RAISE = OPEN + 0.15, WORDS = RAISE + 0.15, HUSH = RAISE + 0.3, PUSH = HUSH + 0.55, OUT = 0.42, RMAX = 150, CY = -22;
const TX = 64, G = 700;
const RG = ["#1a1430", "#3a2e66", "#7a68b8", "#c4b8f0", "#f4f0ff"].map(hex), DIRT = ["#2a2026", "#4a3c40", "#7a6a64", "#a8968a"].map(hex);
// when the sphere's edge reaches the target, and the flight: launched up and out, one bounce, a skid
const HITT = PUSH + OUT * (1 - Math.pow(1 - TX / RMAX, 1 / 3)) * 0.9;
const V0 = [260, -230], BOUNCE = 0.32, LAND1 = HITT + (2 * -V0[1]) / G;
const flight = (t) => {
  if (t < HITT) return { x: 0, y: 0, rot: 0, phase: 0 };
  const a = t - HITT, T1 = LAND1 - HITT;
  if (a < T1) return { x: V0[0] * a, y: V0[1] * a + 0.5 * G * a * a, rot: a * 13, phase: 1 };
  const x1 = V0[0] * T1, b = a - T1, vy2 = -V0[1] * BOUNCE, T2 = (2 * vy2) / G, vx2 = V0[0] * 0.45;
  if (b < T2) return { x: x1 + vx2 * b, y: -vy2 * b + 0.5 * G * b * b, rot: T1 * 13 + b * 7, phase: 2 };
  // the skid: sliding to a stop on its side
  const c = b - T2, x2 = x1 + vx2 * T2, sk = 0.35;
  return { x: x2 + vx2 * 0.6 * sk * (1 - Math.pow(1 - Math.min(1, c / sk), 2)), y: 0, rot: Math.PI / 2, phase: 3 };
};
const LAND2 = LAND1 + (2 * -V0[1] * BOUNCE) / G, REST = flight(LAND2 + 1).x;

export const meta = {
  name: "Almighty push",
  desc: "Pain: the Rinnegan, a hand raised, a beat of dead stillness as the air is drawn in round him; then a sphere of force bursts out, crushing the ground under him into a crater and hurling the target away, tumbling, bouncing and skidding to a stop.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "aoe", "knockback", "one-shot"],
  size: [440, 240],
  origin: [120, 196],
  duration: LAND2 + 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a1430", "#3a2e66", "#7a68b8", "#c4b8f0", "#f4f0ff"], seed: 46 },
};

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17 };
const LIFT = { ...READY, crouch: 2, lean: -1, fx: 16, fy: -27, bx: -3, by: -18, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM],
    [RAISE + 0.25, LIFT, "out"],
    [PUSH - 0.02, { ...LIFT, crouch: 3 }],
    [PUSH, { ...LIFT, lean: 3, fx: 19, fy: -27, crouch: 5 }, "snap"],
    [PUSH + 0.6, { ...LIFT, crouch: 3 }],
    [meta.duration, { ...LIFT, fx: 10, fy: -22 }],
  ],
  hits: [
    { t: RAISE, target: false, sfx: "cast" },
    { t: PUSH, stop: 0.12, shake: 0.7, amp: 5, target: false, sfx: "explosion" },
    { t: HITT, stop: 0.08, shake: 0.3, amp: 3, push: 0, straw: 40, skin: "shock", sfx: "heavy" },
    { t: LAND1, shake: 0.4, amp: 3, target: false, sfx: "heavy" },
    { t: LAND2, target: false, sfx: "land" },
    { t: meta.duration - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the target: hurled away, tumbling, bouncing, skidding; it lies there at the end
export const targetState = (t) => { if (t < HITT) return null; const f = flight(t); return { dx: f.x, dy: f.y, rot: f.rot }; };

// the camera: on him, in close as the air is drawn in; a hard cut wide as it bursts; after the target; held
export const camera = cineCam([
  [0, { z: 1.6, x: 6, y: -34 }],
  [RAISE, { z: 1.7, x: 8, y: -36 }],
  [PUSH - 0.01, { z: 2.4, x: 10, y: -34, r: -3 }],
  [PUSH, { z: 1.05, x: 60, y: -60, r: 2, shake: 1.2 }, "cut"],
  [HITT + 0.1, { z: 1.0, x: 90, y: -62, r: 1, shake: 0.5 }],
  [LAND1, { z: 1.15, x: TX + V0[0] * (LAND1 - HITT) - 20, y: -46, r: -1, shake: 0.6 }],
  [LAND2 + 0.3, { z: 1.25, x: TX + REST - 30, y: -44, r: 0, shake: 0 }],
  [meta.duration, { z: 1.0, x: 110, y: -70 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const radius = (t) => RMAX * ease.outCubic(clamp((t - PUSH) / OUT));
  // the rocks the push tears out of the floor: thrown out on arcs, tumbling
  const ROCKS = Array.from({ length: 14 }, (_, i) => ({ dir: i % 2 ? 1 : -1, x0: (i % 2 ? 1 : -1) * (6 + rand(i, 1) * 26), vx: 120 + rand(i, 2) * 220, vy: -(90 + rand(i, 3) * 200), s: 2 + rand(i, 4) * 3.5, spin: (rand(i, 5) - 0.5) * 18 }));
  const rockAt = (q, a) => { const x = q.x0 + q.dir * q.vx * a, y = Math.min(0, q.vy * a + 0.5 * G * a * a); return [x, y - q.s * 0.5]; };
  return {
    update(t, dt) {
      // the stillness: dust drawn in along the floor toward him
      if (t > HUSH && t < PUSH && R.chance(60 * dt)) { const s = R.chance(0.5) ? 1 : -1, x = s * R.range(30, 90); ps.spawn(P.DUST, x, -1, -s * R.range(40, 90), -R.range(0, 6), R.range(0.3, 0.6), DIRT[2], R.range(1, 2), 0, 0); }
      if (t >= PUSH) once("push", () => {
        for (let i = 0; i < 70; i++) {
          const s = R.chance(0.5) ? 1 : -1;
          ps.spawn(P.DUST, s * R.range(4, 16), -1, s * R.range(120, 340), -R.range(4, 40), R.range(0.5, 1.1), R.chance(0.5) ? DIRT[3] : DIRT[2], R.range(2, 5), 0, 0);
          if (i % 2) ps.spawn(P.GRIT, s * R.range(2, 10), -2, s * R.range(100, 300), -R.range(40, 160), R.range(0.5, 1.0), DIRT[1]);
        }
      });
      // the target hitting the floor: a burst of dust each time
      for (const [k, T] of [["l1", LAND1], ["l2", LAND2]]) if (t >= T) once(k, () => {
        const x = TX + flight(T + 0.001).x;
        for (let i = 0; i < (k === "l1" ? 26 : 14); i++) ps.spawn(P.DUST, x + R.range(-6, 6), -1, R.range(-60, 120), -R.range(10, 60), R.range(0.4, 0.9), DIRT[3], R.range(2, 4), 0, 0);
      });
      // the skid: a trail of dust behind it
      if (t > LAND2 && t < LAND2 + 0.35 && R.chance(50 * dt)) ps.spawn(P.DUST, TX + flight(t).x - 6, -1, -R.range(10, 40), -R.range(5, 20), R.range(0.3, 0.6), DIRT[2], R.range(1.5, 3), 0, 0);
      ps.update(dt);
    },
    drawBack(p, t) {
      // the crater: the ground under him crushed into a bowl, a raised rim of broken rock either side
      if (t >= PUSH) {
        const k = ease.outCubic(clamp((t - PUSH) / 0.12)), W = 46 * k;
        p.ellipse(0, 1, W, 5 * k, DIRT[0]);
        p.ellipse(0, 0.5, W * 0.8, 3 * k, hex("#120c12"));
        for (let i = 0; i < 9; i++) { const s = i % 2 ? 1 : -1, x = s * (W * 0.82 + rand(i, 7) * 6), h = (2 + rand(i, 8) * 4) * k; p.tri(x - 3, 0, x + 3, 0, x + s * 1, -h, i % 3 ? DIRT[2] : DIRT[1]); }
        // cracks running out from it
        for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, L = (30 + rand(i, 9) * 50) * k; p.line(s * W * 0.8, 0, s * (W * 0.8 + L), 0, DIRT[0], 0.8); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPEN, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", OPEN + 0.05, meta.duration - 0.4, b.head);
      if (t > WORDS && t < PUSH + 0.1) p.text("SHINRA TENSEI", 0, -66, RG[4], { font: "mini", align: "center", outline: RG[0], a: smooth(WORDS, WORDS + 0.1, t) });
      // the stillness: the air drawn in round him, rings closing on his palm, the light dimming toward him
      if (t > HUSH && t < PUSH) {
        const u = smooth(HUSH, PUSH, t);
        warp(p, 0, CY, 46 - 20 * u, 0, 0.3 * u);
        for (let i = 0; i < 3; i++) { const r = (1 - ((u * 2 + i / 3) % 1)) * 52; p.ring(0, CY, r, 1, RG[2], 0.25 + 0.5 * u * (1 - r / 52)); }
        p.glow(b.handF ? b.handF[0] : 16, CY - 4, 10 + 8 * u, RG[3], 0.4 * u);
      }
      // the push: the sphere of bent air, its rim bright, the space inside rippling
      if (t >= PUSH && t < PUSH + OUT + 0.3) {
        const r = radius(t), k = 1 - smooth(PUSH + OUT - 0.05, PUSH + OUT + 0.3, t);
        if (t < PUSH + 0.06) p.circle(0, CY, 22, WHITE);
        if (r > 6) {
          warp(p, 0, CY, Math.min(r, 110), 0, -0.16 * k);
          p.shade(-r - 3, CY - r - 3, r + 3, 2, (x, y, out) => {
            const d = Math.hypot(x, y - CY);
            if (d > r + 2 || y > 0) return;
            const e = d / r;
            if (e > 0.96) { out.a = k; return e > 0.99 ? RG[4] : RG[3]; }
            const n = Math.sin(d * 0.35 - t * 30 + noise2(x * 0.05, y * 0.05, 4) * 3);
            if (n > 0.85) { out.a = 0.35 * k; return RG[2]; }
            out.a = 0.1 * k * e; return RG[1];
          });
          // streaks thrown out on the front
          for (let i = 0; i < 22; i++) { const a = -Math.PI + (i / 21) * Math.PI + (rand(i, 3) - 0.5) * 0.1, r0 = r - 14 - rand(i, 4) * 10; p.line(Math.cos(a) * r0, CY + Math.sin(a) * r0, Math.cos(a) * (r + 3), CY + Math.sin(a) * (r + 3), RG[4], 0.7 * k); }
          // the ring of dust racing out along the floor
          p.ellipse(0, -1, r * 1.05, 4, (d) => (d > 0.85 ? DIRT[3] : 0), 0.8 * k);
        }
      }
      // the rocks
      if (t >= PUSH) for (const q of ROCKS) { const a = t - PUSH; if (a > 1.6) continue; const [x, y] = rockAt(q, a), ang = q.spin * a; p.poly([0, 1, 2, 3].map((j) => [x + Math.cos(ang + j * 1.7) * q.s, y + Math.sin(ang + j * 1.7) * q.s]), DIRT[j0(q)]); }
      ps.draw(p, "front");
    },
  };
});
const j0 = (q) => (q.s > 4 ? 1 : 2);
void mix;
