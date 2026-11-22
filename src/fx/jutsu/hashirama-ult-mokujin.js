// ULTIMATE: Senpou: Mokuton: Mokujin no Jutsu (Sage Art: Wood Release: Wood Golem, Hashirama Senju). Narutopedia: in
// Sage Mode (the red markings round his eyes), the First Hokage creates a gigantic wooden golem, armoured like a
// samurai with a horned, fanged face like a demon's mask; it fought the Nine-Tails and Madara's Susanoo, and it can
// bind with wooden dragons that grow out of its arms. Here: Hashirama claps his hands (the Ram seal), red sage
// markings spread under his eyes; the ground heaves and the golem grows up out of it in great wooden slabs, shoulders,
// the horned mask, Hashirama standing on its head; it raises an arm and a wooden dragon pours out of its forearm,
// coils round the target and pins it; the golem draws back its other fist and drives it down onto the bound target:
// the ground breaks, splinters fly; the golem sinks back into the earth.
// New: the golem (slabs of wood, the horned mask with fangs, the arms), the dragon out of its arm, the hammer blow;
// ULTIMATE staging; one impact frame (burst in wood brown and gold).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, drawChunk, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { ultSky, ultBanner, frameOf, aboveGround } from "./_ultimate.js";

const CLAP = 0.3, GROW = 0.7, GROWN = 1.8, ARM = 2.0, DRAGON = 2.2, BOUND = 2.9, COCK = 3.0, PUNCH = 3.35, SINK = 4.6, END = 5.6, TX = 240, GX = 50;
const WOOD = ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"].map(hex), MASK = ["#2a1a10", "#6a4a2a", "#c8a070"].map(hex), RED = hex("#c01a24");

export const meta = {
  name: "Wood golem",
  desc: "ULTIMATE. Hashirama in Sage Mode: a giant wooden golem with a horned demon mask grows out of the ground with him on its head; a wooden dragon pours out of its arm and coils round the target, and the golem drives its fist down onto it, breaking the ground.",
  tags: ["jutsu", "ultimate", "hashirama", "mokuton", "wood", "sage-mode", "summon", "bind", "one-shot"],
  size: [380, 290],
  origin: [60, 260],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"], seed: 176 },
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CLAP, { ...READY, crouch: 4, armsFront: true, fx: 9, fy: -27, bx: 10, by: -27, ffx: 9, fbx: -9 }, "out"],
    [END, { ...READY, crouch: 4, armsFront: true, fx: 9, fy: -27, bx: 10, by: -27, ffx: 9, fbx: -9 }],
  ],
  hits: [
    { t: CLAP, stop: 0.06, target: false, sfx: "clash" },
    { t: GROW, shake: 1.4, amp: 4, target: false, sfx: "rumble" },
    { t: DRAGON, target: false, sfx: "whoosh" },
    { t: BOUND, stop: 0.08, shake: 0.4, amp: 2, push: 0, straw: 14, flash: 0, sfx: "block" },
    { t: PUNCH, stop: 0.34, shake: 1.6, amp: 9, push: 0, straw: 80, flash: 0.1, sfx: "explosion" },
    { t: SINK, shake: 0.8, amp: 3, target: false, sfx: "rumble" },
  ],
};
// Hashirama rides the golem's head from the growth on
export const actorAlpha = (t) => (t > GROW + 0.4 && t < SINK + 0.5 ? 0 : 1);
export const targetState = (t) => (t > PUNCH && t < SINK ? { s: 1 - 0.25 * (1 - smooth(PUNCH + 0.2, SINK, t) * 0.6), dy: 4 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta), bits = [];
  const up = (t) => ease.outCubic(smooth(GROW, GROWN, t)) * (1 - ease.inCubic(smooth(SINK, END - 0.2, t)));
  // the golem's fist: cocked back, then hammered down onto the target
  const fistAt = (t) => { const c = smooth(ARM + 0.6, COCK, t), d = ease.inCubic(smooth(COCK + 0.05, PUNCH, t)); return [GX + 70 - 30 * c + (TX - GX - 40) * d, -150 - 40 * c + (150 + 40 * c - 20) * d]; };
  return {
    update(t, dt) {
      if (t > GROW && t < GROWN && R.chance(60 * dt)) ps.spawn(P.GRIT, GX + R.range(-60, 60), -1, R.range(-80, 80), -R.range(60, 200), R.range(0.5, 1), WOOD[R.int(1, 3)]);
      if (t >= PUNCH && !this.p) { this.p = 1; lights.add(TX, -10, 200, WOOD[4], 0.6, 0.4); for (let i = 0; i < 30; i++) bits.push({ x: TX + R.range(-30, 30), y: -R.range(2, 30), vx: R.range(-260, 260), vy: -R.range(80, 280), a: R.range(0, TAU), s: R.range(2, 4), age: 0 }); }
      for (const c of bits) { c.vy += 560 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.age += dt; if (c.y > -1) { c.y = -1; c.vy *= -0.3; c.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: CLAP, t1: END - 0.2, tone: "#080604", glow: "#2a1a0c" });
      const u = up(t);
      if (u <= 0.01) { ps.draw(p, "back"); return; }
      const lift = (1 - u) * 230, Y = (y) => y + lift;
      aboveGround(p, () => {
      // the body: wooden slabs, the samurai's skirt plates, the chest, the shoulders
      for (let i = 0; i < 5; i++) p.rect(GX - 50 + i * 20, Y(-60), 18, 60, i % 2 ? WOOD[2] : WOOD[3]);
      p.poly([[GX - 56, Y(-60)], [GX + 56, Y(-60)], [GX + 46, Y(-150)], [GX - 46, Y(-150)]], WOOD[2]);
      for (let i = 0; i < 4; i++) p.line(GX - 40, Y(-140 + i * 20), GX + 40, Y(-140 + i * 20), WOOD[1]);
      for (const sd of [-1, 1]) { p.ellipse(GX + sd * 54, Y(-148), 22, 14, WOOD[3]); p.ellipse(GX + sd * 54, Y(-152), 16, 6, WOOD[4]); }
      // the far arm hanging, the near arm raised (the dragon comes out of it), then the fist cocked and hammered
      p.beam(GX - 54, Y(-148), GX - 70, Y(-80), 18, WOOD[1]);
      const [fx, fy] = fistAt(t), sh = [GX + 54, Y(-148)], el = [(sh[0] + fx) / 2 + 10, (sh[1] + Y(fy)) / 2 + 20];
      p.beam(sh[0], sh[1], el[0], el[1], 20, WOOD[2]); p.beam(el[0], el[1], fx, Y(fy), 18, WOOD[3]);
      p.circle(fx, Y(fy), 14, WOOD[3]); for (let i = 0; i < 3; i++) p.line(fx + 6, Y(fy) - 8 + i * 6, fx + 13, Y(fy) - 8 + i * 6, WOOD[1]);
      // the head: the horned demon mask, fangs, deep eye holes; Hashirama standing on top
      const hx = GX, hy = Y(-184);
      p.ellipse(hx, hy, 26, 30, MASK[1]);
      p.tri(hx - 22, hy - 16, hx - 12, hy - 20, hx - 34, hy - 52, MASK[2]); p.tri(hx + 22, hy - 16, hx + 12, hy - 20, hx + 34, hy - 52, MASK[2]);
      for (const ex of [-10, 10]) p.ellipse(hx + ex, hy - 4, 6, 4, MASK[0]);
      p.rect(hx - 12, hy + 10, 24, 6, MASK[0]); for (let i = 0; i < 5; i++) p.tri(hx - 11 + i * 5, hy + 10, hx - 8 + i * 5, hy + 10, hx - 9.5 + i * 5, hy + 15, WHITE);
      drawFigure(p, { ...READY, crouch: 3, armsFront: true, fx: 9, fy: -27, bx: 10, by: -27 }, hx - 2, hy - 30, {});
      });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "MOKUTON: MOKUJIN", hold: 1.0, color: "#b8864a" });
      drawBadge(p, t, { kind: "wood", t0: 0.1, t1: CLAP, label: "SENPOU", head: b.head });
      // the red sage markings under his eyes
      if (t > CLAP) { const [hx, hy] = b.head; p.line(hx, hy + 1, hx + 3, hy + 1, RED); }
      // the wooden dragon pouring out of the golem's forearm, coiling round the target and pinning it
      if (t > DRAGON && t < SINK) {
        const g = ease.outCubic(smooth(DRAGON, BOUND, t)), k = 1 - smooth(SINK - 0.3, SINK, t), sx = GX + 70, sy = -150;
        let px = sx, py = sy;
        for (let i = 1; i <= 30; i++) {
          const u = (i / 30) * g, coil = u > 0.6 ? (u - 0.6) / 0.4 : 0, a = coil * TAU * 1.5, x = sx + (TX - sx) * Math.min(1, u / 0.6) + Math.cos(a) * 18 * coil, y = sy + (-30 - sy) * Math.min(1, u / 0.6) + Math.sin(a) * 6 * coil - coil * 20;
          p.beam(px, py, x, y, 12 - u * 5, WOOD[1], k); p.beam(px, py, x, y, 9 - u * 5, WOOD[3], k); if (i % 3 === 0) p.line(px, py - 4, x, y - 4, WOOD[4], k);
          px = x; py = y;
        }
        p.circle(px, py, 5, WOOD[3], k); p.px(px + 2, py - 1, hex("#c8ffc0"), k);
      }
      for (const c of bits) drawChunk(p, c.x, c.y, c.s, c.a, WOOD.slice(1), 1 - smooth(0.9, 1.4, c.age));
      if (t > PUNCH && t < PUNCH + 0.4) { const v = (t - PUNCH) / 0.4; p.ellipse(TX, 0, 30 + 120 * v, 4 + 6 * v, (d) => (d > 0.85 ? WOOD[4] : 0), 1 - v); }
      void rand; void noise2; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= PUNCH && t < PUNCH + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -10, false, 176, { style: "burst", ink: hex("#1a0f08"), paper: hex("#fff0d0"), lines: 44 });
    },
  };
});
