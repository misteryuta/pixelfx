// Doton: Chou Kajuugan no Jutsu (Earth Release: Super Added Weight Boulder, Oonoki, the Third Tsuchikage).
// Narutopedia: Oonoki touches something and multiplies its weight, crushing it under its own mass; with the Light Weight
// Rock technique he makes himself weightless and floats. He flattened a giant with a single tap. Here: Oonoki floats in,
// tiny and bent with age, his back creaking ("my back!"); he drifts over the target, sets one finger lightly on it
// and kanji-like rings of earth chakra spin round the contact; the target turns heavy, its colour darkening to stone,
// and is driven down into the floor, cracks running out, the floor sagging around it; he floats away rubbing his back.
// New: the floating old man, the finger tap with its weight rings, the target pressed into a sagging floor.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawChunk } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const FLOAT = 0.3, OVER = 1.2, TAP = 1.5, HEAVY = 1.7, CRUSH = 2.0, SINK = 2.6, LEAVE = 3.0, END = 3.9, TX = 160;
const EARTH = ["#2a2014", "#5a4426", "#8a6a40", "#c8a070", "#f0d8a0"].map(hex), ROCK = ["#2a2430", "#4a4250", "#6a6274", "#8a8494"].map(hex);

export const meta = {
  name: "Super added weight boulder",
  desc: "Oonoki floats in, bent with age, and sets one finger on the target; rings of earth chakra spin round the touch, the target turns heavy as stone and is driven down into the floor, cracks running out around it.",
  tags: ["jutsu", "onoki", "tsuchikage", "earth", "doton", "weight", "one-shot"],
  size: [230, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2014", "#5a4426", "#8a6a40", "#c8a070"], seed: 187 },
};

const OLD = { ...READY, y: -10, crouch: 4, lean: 18, fx: 4, fy: -14, bx: -8, by: -18, ffx: 4, ffy: -4, fbx: -4, fby: -4, gait: false };
const POINT = { ...OLD, fx: 18, fy: -16, lean: 24 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [FLOAT, OLD, "out"],
    [OVER, { ...OLD, x: TX - 18, y: -40 }, "out"],
    [TAP, { ...POINT, x: TX - 18, y: -40 }, "out"],
    [LEAVE, { ...POINT, x: TX - 18, y: -40 }],
    [END, { ...OLD, x: TX - 60, y: -24, bx: -2, by: -12 }, "out"],
  ],
  hits: [
    { t: FLOAT, target: false, sfx: "cast" },
    { t: TAP, stop: 0.1, target: false, sfx: "parry" },
    { t: HEAVY, stop: 0.08, shake: 0.4, amp: 2, push: 0, straw: 10, flash: 0, sfx: "heavy" },
    { t: CRUSH, stop: 0.2, shake: 1.0, amp: 6, push: 0, straw: 40, sfx: "explosion" },
    { t: SINK, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
  ],
};
export const targetState = (t) => (t > HEAVY ? { dy: 12 * ease.inCubic(smooth(HEAVY, CRUSH, t)) + 4 * smooth(CRUSH, SINK, t), s: 1 - 0.1 * smooth(HEAVY, CRUSH, t), tint: [ROCK[1], 0.55 * smooth(HEAVY, HEAVY + 0.3, t)] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), rocks = [];
  return {
    update(t, dt) {
      if (t >= CRUSH && !this.c) { this.c = 1; for (let i = 0; i < 18; i++) rocks.push({ x: TX + R.range(-20, 20), y: -2, vx: R.range(-160, 160), vy: -R.range(60, 200), a: R.range(0, 6), s: R.range(1.5, 3.5), age: 0 }); }
      for (const r of rocks) { r.vy += 600 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.vx * 0.02 * dt; r.age += dt; if (r.y > -1) { r.y = -1; r.vy *= -0.3; r.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the floor sagging and cracking under the weight
      if (t > CRUSH) {
        const v = ease.outCubic(smooth(CRUSH, CRUSH + 0.3, t));
        p.shade(TX - 60, -1, TX + 60, 12, (x, y) => { const d = Math.abs(x - TX) / 60, depth = 10 * v * (1 - d * d); if (y > depth || d > 1) return; return y > depth - 2 ? ROCK[2] : hex("#0a080e"); });
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI, L = 30 + rand(i, 1) * 40; p.line(TX, 0, TX + Math.cos(a) * L * v, 1 + Math.sin(a) * 2, hex("#08060a")); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "iwa", t0: 0.04, t1: FLOAT, label: "KAJUUGAN", head: b.head });
      // the old man: white moustache and topknot, his big nose; the complaint about his back
      p.line(hx - 1, hy + 2, hx + 3, hy + 2, WHITE); p.px(hx + 4, hy, hex("#e8a080")); p.circle(hx - 1, hy - 5, 1.5, WHITE);
      if (t > LEAVE) p.text("MY BACK...", hx, hy - 14, EARTH[4], { font: "mini", align: "center", outline: EARTH[0], a: 1 - smooth(END - 0.3, END, t) });
      // the weight rings spinning round the touch, tightening
      if (t > TAP && t < SINK) {
        const k = smooth(TAP, TAP + 0.1, t) * (1 - smooth(SINK - 0.3, SINK, t)), [fx, fy] = b.handN;
        for (let i = 0; i < 3; i++) { const r = (10 + i * 7) * (1 - 0.4 * smooth(TAP, CRUSH, t)), a = t * (4 + i) * (i % 2 ? 1 : -1); p.ring(fx + 2, fy + 2, r, 1, EARTH[3], 0.6 * k); for (let j = 0; j < 4; j++) { const aa = a + j * (TAU / 4); p.rect(fx + 2 + Math.cos(aa) * r - 1, fy + 2 + Math.sin(aa) * r - 1, 3, 3, EARTH[4], k); } }
      }
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK.slice(1), 1 - smooth(0.8, 1.3, r.age));
      void noise2; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
