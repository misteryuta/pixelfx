// Ninpou: Choujuu Giga (Super Beast Imitating Drawing, Sai). Narutopedia: Sai paints with chakra-laced ink on a scroll
// and the drawings leap off the paper as living ink creatures; struck, they burst back into ink. Here: he snaps the
// scroll open along the floor; his brush flies over it, ink strokes appearing as he goes; the first lion lifts out of
// the page, black and white, shaking itself, then a second; they bound at the target in long leaps, the ink trailing
// off them in drops; they hit it one after the other and burst into great splashes of ink that spatter the floor; the
// spatter soaks away and the scroll rolls itself up.
// New: the scroll and brushwork, the ink lions (drawn in strokes, shaded flat), the ink splash.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 180, UNROLL = 0.3, PAINT = 0.55, LIFT1 = 1.15, LIFT2 = 1.35, RUN1 = 1.4, RUN2 = 1.6, HIT1 = 2.0, HIT2 = 2.2, ROLL = 3.2, END = 3.9;
const INK = ["#0a0a10", "#1e1e28", "#3a3a48"].map(hex), PAPER = ["#e8e0cc", "#cfc5ac", "#a89c80"].map(hex);
const SX0 = 8, SX1 = 70;

export const meta = {
  name: "Super beast imitating drawing",
  desc: "Sai: the scroll snapped open along the floor, his brush flying over it; two ink lions lift off the page, bound at the target in long leaps trailing drops of ink, and burst into great splashes of ink as they hit.",
  tags: ["jutsu", "sai", "ink", "summon", "projectile", "one-shot"],
  size: [310, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a10", "#1e1e28", "#3a3a48", "#e8e0cc"], seed: 45 },
};

const KNEEL = { ...READY, crouch: 12, lean: 14, fx: 16, fy: -6, bx: -2, by: -12, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [UNROLL, { ...READY, crouch: 6, lean: 8, fx: 14, fy: -10, bx: 2, by: -14 }, "out"],
    [PAINT, KNEEL, "out"],
    ...[0.65, 0.75, 0.85, 0.95, 1.05].map((t, i) => [t, { ...KNEEL, fx: 18 + (i % 2 ? 12 : 0), fy: -4 - (i % 2) * 2 }]),
    [LIFT1, { ...KNEEL, fx: 14, fy: -16 }, "out"],
    [HIT2 + 0.3, { ...READY, crouch: 4, fx: 10, fy: -20 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: UNROLL, target: false, sfx: "step" },
    { t: LIFT1, target: false, sfx: "cast" },
    { t: HIT1, stop: 0.08, shake: 0.3, amp: 2, push: 3, straw: 20, skin: "shadow", sfx: "heavy" },
    { t: HIT2, stop: 0.12, shake: 0.4, amp: 3, push: 4, straw: 30, skin: "shadow", sfx: "heavy" },
    { t: HIT2 + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// a lion of ink: a heavy body, a shaggy mane of brush strokes, legs mid-stride, a tail; s 0..1 how lifted off the page
function lion(p, x, y, t, s, seed) {
  if (s <= 0) return;
  const run = Math.sin(t * 22 + seed) * 4, k = Math.min(1, s * 1.5);
  // legs
  for (const [lx, ph] of [[-8, 0], [-4, 2], [6, 1], [10, 3]]) { const sw = Math.sin(t * 22 + seed + ph) * 4; p.beam(x + lx, y - 6, x + lx + sw, y, 2.2, INK[0], k); }
  // body: an ink shape with a white highlight stroke along the back
  p.ellipse(x, y - 9, 13, 6 * s, INK[0], k);
  p.line(x - 9, y - 13, x + 6, y - 14, PAPER[0], 0.8 * k);
  // the mane: radiating strokes round the head
  const hx = x + 12, hy = y - 13 - run * 0.2;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, L = 7 + 2 * Math.sin(t * 10 + i); p.beam(hx, hy, hx + Math.cos(a) * L, hy + Math.sin(a) * L * 0.9, 2, INK[i % 2], k); }
  p.circle(hx + 2, hy + 1, 4, INK[0], k);
  p.px(hx + 3, hy - 1, PAPER[0], k);
  p.line(hx + 3, hy + 3, hx + 6, hy + 3, PAPER[0], k);
  // the tail with its tuft
  p.line(x - 12, y - 10, x - 18, y - 16 + run * 0.3, INK[0], k);
  p.circle(x - 18, y - 17 + run * 0.3, 2, INK[0], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), drops = [], splats = [];
  const path = (t, t0, t1, x0) => { const u = clamp((t - t0) / (t1 - t0)); return [x0 + (TX - 10 - x0) * u, -Math.abs(Math.sin(u * Math.PI * 2)) * 16]; };
  return {
    update(t, dt) {
      for (const [t0, t1, x0] of [[RUN1, HIT1, 30], [RUN2, HIT2, 50]]) {
        if (t > t0 && t < t1 && R.chance(40 * dt)) { const [x, y] = path(t, t0, t1, x0); drops.push({ x: x - 10, y: y - 8, vx: -R.range(10, 40), vy: -R.range(0, 40), age: 0 }); }
        if (t >= t1 && !this["s" + t1]) {
          this["s" + t1] = 1;
          for (let i = 0; i < 26; i++) drops.push({ x: TX - 4, y: -26 + R.range(-10, 10), vx: R.range(-140, 120), vy: -R.range(40, 200), age: 0, big: R.chance(0.4) });
          splats.push({ x: TX - 6, at: t });
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.vy += 420 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.age += dt; if (d.y > -1) { splats.push({ x: d.x, at: t, small: true }); drops.splice(i, 1); } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // ink soaking into the floor
      for (const s of splats) { const a = t - s.at, k = 1 - smooth(0.8, 1.8, a); if (k > 0) p.ellipse(s.x, 0, (s.small ? 2.5 : 18) * Math.min(1, a * 8 + 0.3), s.small ? 0.8 : 1.6, INK[1], k); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "ink", t0: 0.04, t1: UNROLL, label: "CHOUJUU GIGA", head: b.head });
      // the scroll: unrolled along the floor, the roll at its end, rolled back up at the end
      const open = ease.outCubic(smooth(UNROLL, UNROLL + 0.2, t)) * (1 - ease.inCubic(smooth(ROLL, ROLL + 0.3, t)));
      if (open > 0) {
        const x1 = SX0 + (SX1 - SX0) * open;
        p.rect(SX0, -2, x1 - SX0, 2, PAPER[0]);
        p.rect(SX0, -1, x1 - SX0, 1, PAPER[1]);
        p.circle(x1, -2.5, 2.5, PAPER[2]);
        p.circle(x1, -2.5, 1, hex("#5a3a20"));
        // the painted strokes appearing under the brush, then rising off the page as the lions lift
        const painted = smooth(PAINT, LIFT1 - 0.05, t);
        for (let i = 0; i < 16 * painted; i++) { const x = SX0 + 4 + i * 3.5; if (x < x1 - 2) p.line(x, -2, x + 2, -1 - (i % 2), INK[0], 1 - smooth(LIFT1, LIFT2 + 0.2, t) * 0.7); }
      }
      // the brush flying
      if (t > PAINT && t < LIFT1) { p.line(b.handN[0], b.handN[1], b.handN[0] + 3, b.handN[1] + 5, hex("#5a3a20")); p.px(b.handN[0] + 3, b.handN[1] + 6, INK[0]); }
      // the lions: lift off the page, shake, bound at the target
      for (const [t0, t1, x0, lift, seed] of [[RUN1, HIT1, 30, LIFT1, 1], [RUN2, HIT2, 50, LIFT2, 4]]) {
        if (t < lift || t > t1) continue;
        const s = smooth(lift, lift + 0.2, t), [x, y] = t < t0 ? [x0, 0] : path(t, t0, t1, x0);
        lion(p, x, y, t, s, seed);
      }
      // the splash: a burst of ink thrown off the target, black blots and white flecks
      for (const [t1, k0] of [[HIT1, 1], [HIT2, 1.2]]) {
        const a = t - t1;
        if (a < 0 || a > 0.35) continue;
        const u = a / 0.35;
        for (let i = 0; i < 10; i++) { const ang = (i / 10) * TAU + t1, d = 6 + 22 * ease.outCubic(u) * k0; p.circle(TX - 4 + Math.cos(ang) * d, -26 + Math.sin(ang) * d * 0.8, 3.5 * (1 - u) + 1, INK[i % 2]); }
        p.circle(TX - 4, -26, 10 * (1 - u), INK[0]);
      }
      for (const d of drops) { if (d.big) p.circle(d.x, d.y, 1.5, INK[0]); else p.px(d.x, d.y, INK[0]); }
      void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
