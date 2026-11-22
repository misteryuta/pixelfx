// Baryon Mode (Naruto with Kurama, Boruto). Narutopedia: a transformation that burns all of Kurama's chakra: Naruto's
// hair spikes up with tufts like fox ears, his whiskers thicken, black pigment stretches up round his eyes toward the
// ears, his eyes become Kurama's red slits; a chakra cape with a black swirl on the chest, four tails off its back and
// five more at its hem; every blow also burns away the target's life. Here: Kurama's voice, a heartbeat; a column of
// red-orange baryon light, sparks fusing; the cape forms on him, the swirl, the tails; he vanishes in a red streak and
// is in front of the target already, one punch: the hit is silent for a frame, then the target is ringed by burning
// particles drawn out of it, a red shock ring, and he is back at his start, steaming, the mode fading off him.
// New: the baryon column and fusing particles, the cape with its swirl and tails, the life-burning particles.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, drawOutline, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const HEART = 0.3, COLUMN = 0.55, FORMED = 1.25, GO = 1.6, HIT = 1.72, BURN = HIT + 0.08, BACK = HIT + 0.9, END = BACK + 1.4, TX = 170;
const RED = ["#2a0204", "#7a0a0e", "#d42a18", "#ff7a2a", "#ffd08a", "#fff4e0"].map(hex), INK = hex("#120408");
const IN = TX - 18;

export const meta = {
  name: "Baryon Mode",
  desc: "Naruto and Kurama: a heartbeat, a column of red baryon light, the chakra cape with its black swirl and tails forms; a red streak and one silent punch, the target ringed by burning particles drawn out of it; back at the start, steaming, the mode fading.",
  tags: ["jutsu", "naruto", "kurama", "baryon", "melee", "ultimate", "one-shot"],
  size: [300, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0204", "#7a0a0e", "#d42a18", "#ff7a2a", "#ffd08a", "#fff4e0"], seed: 142 },
};

const FIGHT = { ...READY, crouch: 7, lean: 4, fx: 12, fy: -26, bx: 6, by: -24, ffx: 10, fbx: -10 };
const PUNCH = { ...READY, x: IN, crouch: 8, lean: 14, fx: 26, fy: -28, bx: -8, by: -22, ffx: 13, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#ff7a2a",
  poses: [
    [-0.25, READY],
    [HEART, { ...READY, crouch: 3, lean: -2 }, "out"],
    [FORMED, FIGHT, "out"],
    [GO, { ...FIGHT, crouch: 10, lean: 10 }],
    [HIT, PUNCH, "snap"],
    [BACK - 0.02, { ...PUNCH, lean: 8 }],
    [BACK, { ...FIGHT, gait: false }, "snap"],
    [END, { ...READY, crouch: 4, lean: 6, gait: false }, "in"],
  ],
  hits: [
    { t: HEART, stop: 0.12, shake: 0.3, amp: 2, target: false, sfx: "heavy" },
    { t: COLUMN, shake: 1.0, amp: 2, target: false, sfx: "rumble" },
    { t: GO, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.3, shake: 0.9, amp: 6, push: 6, straw: 40, flash: 0.1, skin: "red", shiver: 0.8, sfx: "heavy" },
    { t: BURN + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: COLUMN, x: 0, n: 16, dir: -1 }, { t: COLUMN, x: 0, n: 16, dir: 1 }, { t: HIT, x: TX, n: 14, dir: 1 }],
};
// gone in the streak; there at the target; gone again back home
export const actorAlpha = (t) => (t > GO && t < HIT ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), motes = [];
  const on = (t) => smooth(COLUMN + 0.3, FORMED, t) * (1 - smooth(BACK + 0.4, END - 0.2, t));
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // particles fusing into him while the column stands
      if (t > COLUMN && t < FORMED && R.chance(90 * dt)) { const a = R.range(0, TAU), d = R.range(30, 60); motes.push({ x: b.chest[0] + Math.cos(a) * d, y: b.chest[1] + Math.sin(a) * d, tx: () => b.chest, age: 0, life: 0.3, kind: 0 }); }
      // the target's life drawn out of it as burning particles
      if (t > BURN && t < BURN + 0.8 && R.chance(70 * dt)) motes.push({ x: TX + R.range(-8, 8), y: -R.range(6, 46), vx: R.range(-20, 20), vy: -R.range(20, 60), age: 0, life: R.range(0.5, 0.9), kind: 1 });
      for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.age += dt; if (m.kind === 1) { m.x += m.vx * dt; m.y += m.vy * dt; } if (m.age > m.life) motes.splice(i, 1); }
      if (on(t) > 0.5 && R.chance(30 * dt)) ps.spawn(P.SMOKE, (b.q.x ?? 0) + R.range(-6, 6), -R.range(10, 40), R.range(-6, 6), -R.range(10, 30), R.range(0.5, 0.9), hex("#d8c8c0"), 1.5);
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -28, 180, RED[3], 1, 0.4); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), k = on(t), bx = b.q.x ?? 0, by = b.q.y ?? 0;
      // the column of baryon light
      if (t > COLUMN && t < FORMED + 0.2) {
        const g = smooth(COLUMN, COLUMN + 0.2, t) * (1 - smooth(FORMED - 0.1, FORMED + 0.2, t)), w = 10 + 14 * g;
        p.shade(bx - w - 8, -210, bx + w + 8, 2, (x, y, out) => { const d = Math.abs(x - bx) / (w * (0.8 + 0.3 * noise2(y * 0.05 - t * 6, 2, 3))); if (d > 1) return; out.a = g; out.k = 0.3; return d < 0.3 ? RED[5] : d < 0.65 ? RED[4] : RED[3]; });
      }
      // the cape's tails: four off the back, five more at the hem, swaying
      if (k > 0) {
        for (let i = 0; i < 9; i++) {
          const back = i < 4, a0 = back ? -2.4 - i * 0.18 : -2.9 - (i - 4) * 0.12, L = back ? 18 + i * 2 : 12, sx = bx - 4, sy = by + (back ? -26 : -12);
          let x = sx, y = sy;
          for (let j = 0; j < 8; j++) { const a = a0 + Math.sin(t * 6 + i + j * 0.6) * 0.18, nx = x + Math.cos(a) * L / 8, ny = y + Math.sin(a) * L / 8; p.beam(x, y, nx, ny, 3 - j * 0.25, back ? RED[3] : RED[2], k); x = nx; y = ny; }
        }
        drawOutline(p, b.q, bx, by, RED[3], { w: 2, a: k, flick: t * 18 });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), k = on(t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kurama", t0: 0.04, t1: HEART, label: "BARYON", head: b.head });
      if (t > HEART && t < HEART + 0.3) { const u = (t - HEART) / 0.3; p.ring(b.chest[0], b.chest[1], 4 + 30 * u, 2, RED[3], 1 - u); }
      // the cape over him: orange-red, the black swirl on the chest, the fox-ear tufts and the dark eye marks
      if (k > 0 && actorAlpha(t)) {
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: RED[3], k: 0.45 * k });
        for (let i = 0; i < 12; i++) { const a = i * 0.6, r = 0.6 + i * 0.35; p.px(b.chest[0] + Math.cos(a) * r, b.chest[1] - 2 + Math.sin(a) * r, INK, k); }
        for (const s of [-1, 1]) p.tri(hx + s * 3, hy - 5, hx + s * 5, hy - 5, hx + s * 4.5, hy - 11, hex("#fdd73a"), k);
        p.line(hx + 1, hy - 1, hx + 5, hy - 4, INK, k);
        p.px(hx + 3, hy - 1, hex("#ff2a2a"), k);
      }
      // fusing particles
      for (const m of motes) if (m.kind === 0) { const [cx, cy] = m.tx(), u = m.age / m.life; p.px(m.x + (cx - m.x) * u, m.y + (cy - m.y) * u, u < 0.5 ? RED[4] : WHITE); } else p.px(m.x, m.y, m.age < m.life * 0.5 ? RED[4] : RED[2], 1 - m.age / m.life);
      // the streak to the target, and back
      if (t > GO - 0.02 && t < HIT + 0.1) { const kk = 1 - smooth(HIT, HIT + 0.1, t); p.glowLine(4, -24, IN, -24, 10, RED[3], 0.7 * kk); p.beam(4, -24, IN, -24, 2, RED[4], kk); }
      if (t > BACK - 0.02 && t < BACK + 0.12) { const kk = 1 - (t - BACK + 0.02) / 0.14; p.beam(IN, -24, 4, -24, 2, RED[4], kk); }
      // the silent frame of the hit, then the red shock ring
      if (t >= HIT && t < HIT + 0.05) impactFrame(p, -56, -168, 244, 32, TX - 6, -28, true, 61, { style: "rings", ink: hex("#140204"), paper: hex("#ffe8d8"), lines: 30 });
      if (t > HIT + 0.05 && t < HIT + 0.5) { const u = (t - HIT - 0.05) / 0.45; p.ring(TX - 6, -28, 6 + 60 * ease.outCubic(u), 2, RED[3], 1 - u); p.glow(TX - 6, -28, 30, RED[3], 0.6 * (1 - u)); }
      void rand; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
