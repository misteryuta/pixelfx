// Mokuton: Shichuukaku no Jutsu (Wood Release: Four Pillar Prison, Yamato). Narutopedia: Yamato forms a seal and a
// cage of thick wooden pillars bursts out of the ground around the target and closes over it; with the Four Pillar
// House he raises a whole building the same way. Here: the seal, palms flat on the floor; the floor cracks in a square
// round the target; four corner posts shoot up, then the bars between them, beam after beam, slamming into place,
// a roof of crossbeams locking down on top with a boom; the target inside, behind the bars; splinters, dust; then
// Yamato straightens and the wood creaks as it settles.
// New: the prison, built beam by beam with overshoot and settle; splinters.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawChunk } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 160, SEAL = 0.3, PALMS = 0.6, CRACK = 0.75, POSTS = 0.9, BARS = 1.15, ROOF = 1.55, END = 3.6;
const WOOD = ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"].map(hex);
const HW = 22, HH = 60;

export const meta = {
  name: "Wood release: four pillar prison",
  desc: "Yamato: palms flat on the floor, the floor cracks in a square round the target; four corner posts shoot up, the bars between them slam into place one after another, and a roof of crossbeams locks down with a boom.",
  tags: ["jutsu", "yamato", "wood", "mokuton", "bind", "one-shot"],
  size: [290, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"], seed: 67 },
};

const SEALP = { ...READY, crouch: 3, armsFront: true, fx: 8, fy: -28, bx: 9, by: -28, ffx: 8, fbx: -8 };
const FLAT = { ...READY, crouch: 15, lean: 18, fx: 18, fy: -2, bx: 16, by: -2, ffx: 10, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEAL, SEALP, "out"],
    [PALMS, FLAT, "in"],
    [ROOF + 0.5, FLAT],
    [ROOF + 0.9, { ...READY, crouch: 3 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: PALMS, stop: 0.05, shake: 0.2, amp: 1, target: false, sfx: "step" },
    { t: POSTS, stop: 0.06, shake: 0.4, amp: 2, push: 0.5, straw: 6, sfx: "rumble" },
    ...[0, 1, 2, 3].map((i) => ({ t: BARS + i * 0.08, stop: 0.02, shake: 0.15, amp: 1, target: false, sfx: "block" })),
    { t: ROOF, stop: 0.14, shake: 0.6, amp: 4, push: 1, straw: 16, sfx: "heavy" },
  ],
  dust: [{ t: POSTS, x: TX - HW, n: 10, dir: -1 }, { t: POSTS, x: TX + HW, n: 10, dir: 1 }, { t: ROOF, x: TX, n: 14 }],
};

// a beam of wood from (x0, y0) to (x1, y1), w wide: dark rim, lit face, grain
function beam(p, x0, y0, x1, y1, w, k = 1) {
  p.beam(x0, y0, x1, y1, w + 1, WOOD[0], k);
  p.beam(x0, y0, x1, y1, w, WOOD[2], k);
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  p.line(x0 + nx * w * 0.25, y0 + ny * w * 0.25, x1 + nx * w * 0.25, y1 + ny * w * 0.25, WOOD[3], k);
  p.line(x0 - nx * w * 0.3, y0 - ny * w * 0.3, x1 - nx * w * 0.3, y1 - ny * w * 0.3, WOOD[1], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), bits = [];
  const grow = (t, t0, d = 0.14) => ease.outBack(clamp((t - t0) / d), 1.8);
  return {
    update(t, dt) {
      if (t >= ROOF && !this.r) { this.r = 1; for (let i = 0; i < 16; i++) bits.push({ x: TX + R.range(-HW, HW), y: -HH, vx: R.range(-120, 120), vy: -R.range(40, 160), a: R.range(0, TAU), va: R.range(-10, 10), s: R.range(1.5, 3), age: 0 }); lights.add(TX, -HH, 90, WOOD[4], 0.5, 0.2); }
      for (const c of bits) { c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.age += dt; if (c.y > -1 && c.vy > 0) { c.y = -1; c.vy *= -0.3; c.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the square crack in the floor
      if (t > CRACK) { const g = smooth(CRACK, POSTS, t); p.line(TX - HW * g, 0, TX + HW * g, 0, hex("#0c0810")); }
      // the back posts and back bars (behind the target)
      const post = grow(t, POSTS);
      if (post > 0) for (const x of [TX - HW + 6, TX + HW + 6]) beam(p, x, 0, x, -(HH - 6) * post, 6);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "wood", t0: 0.04, t1: SEAL + 0.1, label: "MOKUTON", head: b.head });
      // the floor cracking from his palms out to the target
      if (t > PALMS && t < POSTS + 0.4) { const u = smooth(PALMS, CRACK, t), k = 1 - smooth(POSTS, POSTS + 0.4, t); let x = b.handN[0], y = 0; for (let i = 0; i < 20 * u; i++) { const nx = x + (TX - HW - b.handN[0]) / 20, ny = (rand(i, 3) - 0.5) * 2; p.line(x, y, nx, ny, hex("#0c0810"), k); x = nx; y = ny; } }
      // the front posts, the bars slamming up between them one after another, the roof locking down
      const post = grow(t, POSTS);
      if (post > 0) for (const x of [TX - HW, TX + HW]) beam(p, x, 0, x, -HH * post, 7);
      for (let i = 0; i < 4; i++) {
        const g = grow(t, BARS + i * 0.08, 0.1), x = TX - HW + 9 + i * ((HW * 2 - 18) / 3);
        if (g > 0) beam(p, x, 0, x, -(HH - 4) * g, 4);
      }
      // the crossbeams of the roof: drop from above and lock, a boom
      if (t > ROOF - 0.12) {
        const u = ease.outBack(clamp((t - ROOF + 0.12) / 0.12), 1.5), y = -HH - 40 * (1 - u);
        for (let i = 0; i < 3; i++) beam(p, TX - HW - 4, y + i * 4, TX + HW + 10, y - 3 + i * 4, 4, Math.min(1, u * 3));
        beam(p, TX - HW, y - 2, TX - HW + 6, y + 10, 4, Math.min(1, u * 3));
        if (t > ROOF && t < ROOF + 0.12) p.ellipse(TX + 3, -HH, 40, 6, WHITE, 1 - (t - ROOF) / 0.12);
        // the bands of chakra where the beams join
        if (t > ROOF) for (const x of [TX - HW, TX + HW]) p.px(x, -HH + 2, hex("#8fbf4a"));
      }
      for (const c of bits) drawChunk(p, c.x, c.y, c.s, c.a, WOOD.slice(1), 1 - smooth(1.0, 1.5, c.age));
      void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
