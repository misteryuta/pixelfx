// Youton: Youkai no Jutsu (Lava Release: Melting Apparition, Mei Terumi, the Fifth Mizukage). Narutopedia: she spews
// a mass of lava from her mouth that melts whatever it touches; her lava ignores defences that stop fire or water.
// Here: Tiger, Ox; she draws a deep breath, chest swelling, and spits a heavy stream of molten rock in an arc: thick
// glowing globs with dark crusts that splatter where they land; it pools round the target, smoking and bubbling, the
// target sinking and blackening as it melts into the pool; the stream stops; the pool cools from orange to a dark
// crust webbed with glowing cracks, steam rising.
// New: the lava stream (globs on arcs, crust and glow), the pool that bubbles and cools, the melt (targetState).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["tora", "ushi"], 0.12, { hold: 0.15, kind: "fire", last: { fx: 9, fy: -28, bx: 10, by: -28 } });
const BREATH = SEALS.end, SPIT = BREATH + 0.4, STOP = SPIT + 1.0, COOL = STOP + 0.5, END = COOL + 2.0, TX = 170;
const LAVA = ["#1a0604", "#4a0e06", "#a8260a", "#f05a10", "#ffa030", "#ffe890"].map(hex), CRUST = ["#140c0c", "#2a1a18", "#3e2a24"].map(hex);
const POOL = 38;

export const meta = {
  name: "Lava release: melting apparition",
  desc: "Mei Terumi: Tiger, Ox, a deep breath, and she spits a heavy arc of molten rock that pools round the target, bubbling and smoking as it melts into it; the pool cools to a black crust webbed with glowing cracks.",
  tags: ["jutsu", "mei", "mizukage", "lava", "youton", "kekkei-genkai", "one-shot"],
  size: [300, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0604", "#4a0e06", "#a8260a", "#f05a10", "#ffa030", "#ffe890"], seed: 53 },
};

const INHALE = { ...READY, crouch: 3, lean: -8, fx: -2, fy: -20, bx: -6, by: -20, ffx: 8, fbx: -9, hy: -1 };
const SPEW = { ...READY, crouch: 6, lean: 10, fx: 2, fy: -18, bx: -6, by: -18, ffx: 11, fbx: -10, hy: 1 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SPIT - 0.08, INHALE, "out"],
    [SPIT, SPEW, "snap"],
    [STOP, { ...SPEW, lean: 8 }],
    [STOP + 0.3, { ...READY, crouch: 3 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SPIT, stop: 0.05, shake: 0.15, amp: 1, target: false, sfx: "cast" },
    { t: SPIT + 0.28, stop: 0.08, shake: 0.3, amp: 2, push: 2, straw: 12, skin: "char", sfx: "explosion" },
    ...[0.5, 0.7, 0.9].map((d) => ({ t: SPIT + d, stop: 0.02, push: 0.6, straw: 6, shiver: 0.6, flash: 0, skin: "char" })),
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the target melts into the pool: sinks, squashes, comes back up out of the cooled crust at the end
export const targetState = (t) => {
  if (t < SPIT + 0.28) return null;
  const sink = smooth(SPIT + 0.3, STOP + 0.4, t) * (1 - smooth(END - 1, END - 0.4, t));
  return { dy: 18 * sink, s: 1 - 0.15 * sink, tint: [LAVA[3], 0.4 * smooth(SPIT + 0.3, SPIT + 0.6, t) * (1 - smooth(STOP, COOL + 0.5, t))] };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), lights = new Lights(), globs = [], splats = [], ps = new Particles({ rng: R, ground: () => 0 });
  let poolR = 0;
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0] - 2, b.head[1] + 5];
      // the stream: globs thrown on arcs toward the target, a little spread
      if (t > SPIT && t < STOP) for (let n = 0; n < 3; n++) if (R.chance(80 * dt)) {
        const T = R.range(0.26, 0.34), tx = TX + R.range(-10, 14), vx = (tx - m[0]) / T, vy = (-1 - m[1]) / T - 0.5 * 520 * T;
        globs.push({ x: m[0], y: m[1], vx: vx * R.range(0.95, 1.05), vy, r: R.range(2, 4.5), age: 0, ph: R.range(0, TAU) });
      }
      for (let i = globs.length - 1; i >= 0; i--) {
        const g = globs[i];
        g.vy += 520 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.age += dt;
        if (g.y >= -1) {
          splats.push({ x: g.x, age: 0, r: g.r });
          for (let j = 0; j < 3; j++) ps.spawn(P.SPARK, g.x, -2, R.range(-60, 60), -R.range(40, 140), R.range(0.2, 0.4), LAVA[R.int(3, 5)]);
          globs.splice(i, 1);
        }
      }
      for (const s of splats) s.age += dt;
      if (t > SPIT + 0.25) poolR = Math.min(POOL, poolR + dt * 60);
      // smoke and steam off the pool
      if (t > SPIT + 0.3 && t < END - 0.3 && R.chance((t < COOL ? 30 : 18) * dt)) ps.spawn(P.SMOKE ?? P.STREAK, TX + R.range(-poolR, poolR), -2, R.range(-6, 6), -R.range(20, 40), R.range(0.8, 1.4), t < COOL ? hex("#3a3036") : hex("#c8c4cc"));
      if (t > SPIT && t < STOP && R.chance(10 * dt)) lights.add(TX, -6, 80, LAVA[4], 0.5, 0.2);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, LAVA);
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0] - 2, b.head[1] + 5], f = Math.floor(t * 12);
      drawBadge(p, t, { kind: "kiri", t0: 0.04, t1: BREATH, label: "YOUTON", head: b.head });
      // the breath drawn in: her chest glowing from inside
      if (t > BREATH && t < SPIT) p.glow(b.chest[0] + 2, b.chest[1], 10 * smooth(BREATH, SPIT, t), LAVA[3], 0.6);
      // the pool: orange and bubbling while it is fed, cooling to a crust with glowing cracks
      if (poolR > 0) {
        const cool = smooth(STOP, COOL + 1.2, t);
        p.shade(TX - poolR - 2, -9, TX + poolR + 2, 1, (x, y, out) => {
          const dx = (x - TX) / poolR, h = 6 * Math.sqrt(Math.max(0, 1 - dx * dx)) * (1 + 0.3 * noise2(x * 0.3, 1, 3));
          if (Math.abs(dx) > 1 || y < -h || y > 0.5) return;
          const n = noise2(x * 0.25 + t * (1 - cool) * 2, y * 0.6, 7), crack = Math.abs(noise2(x * 0.18, y * 0.4, 11)) < 0.05;
          if (cool > 0.5 && !crack) return n > 0.4 ? CRUST[2] : n > 0 ? CRUST[1] : CRUST[0];
          if (cool > 0.5 && crack) { out.k = 0.3; return LAVA[3 + (f % 2)]; }
          out.k = 0.25;
          return n > 0.55 ? LAVA[5] : n > 0.2 ? LAVA[4] : n > -0.2 ? LAVA[3] : LAVA[2];
        });
        // bubbles popping while hot
        if (cool < 0.6) for (let i = 0; i < 3; i++) { const ph = (t * 2 + i * 0.37) % 1, x = TX + (rand(Math.floor(t * 2 + i * 0.37), i) - 0.5) * poolR * 1.6; p.ring(x, -2 - ph * 3, 1 + ph * 2, 1, LAVA[5], 1 - ph); }
        p.glow(TX, -2, poolR * 1.6, LAVA[3], 0.45 * (1 - cool));
      }
      // splats where globs hit, fading into the pool
      for (const s of splats) if (s.age < 0.4) p.ellipse(s.x, -1, s.r * 2 * (1 + s.age * 3), 1.5, LAVA[4], 1 - s.age / 0.4);
      // the stream: thick glowing globs with dark crust on their backs, and a thin bright thread joining them to her mouth
      if (t > SPIT && t < STOP + 0.1) p.glowLine(m[0], m[1], m[0] + 20, m[1] + 2, 8, LAVA[4], 0.5);
      for (const g of globs) {
        const r = g.r * (1 + 0.15 * Math.sin(g.age * 30 + g.ph));
        p.glow(g.x, g.y, r * 3, LAVA[3], 0.35);
        p.circle(g.x, g.y, r, LAVA[3]);
        p.circle(g.x - r * 0.3, g.y - r * 0.3, r * 0.55, LAVA[5]);
        p.arc(g.x, g.y, r, 1, Math.PI * 0.1, Math.PI * 0.8, CRUST[1]);
      }
      void ease; void clamp; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
