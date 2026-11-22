// Kotoamatsukami (Distinguished Heavenly Gods, Shisui Uchiha). Narutopedia: Shisui's Mangekyou Sharingan ability, said
// to be the most powerful genjutsu of all: it enters the target's mind and changes their thoughts and will without them
// ever noticing, so they believe they acted of their own free will; it can only be used once every decade. Here: Shisui
// closes his eyes, then opens his Mangekyou (the four-bladed shuriken pattern); the world goes still and grey; a thin
// thread of red light runs from his eye into the target's eye; inside the target's head a symbol (its will) turns over
// and settles the other way; colour flows back, nothing seems to have happened; the target turns round, facing away,
// and bows its head: it is on his side now.
// New: the stillness (desaturated world, a soft vignette), the thread of light from eye to eye, the turning symbol.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const CLOSE = 0.3, OPEN = 0.8, STILL = 0.9, THREAD = 1.3, TURN = 1.9, BACK = 2.5, OBEY = 2.8, END = 3.9, TX = 160;
const RED = ["#2a0204", "#8a0a14", "#e01a2a", "#ff8a90"].map(hex), GREY = hex("#8a8894");

export const meta = {
  name: "Kotoamatsukami",
  desc: "Shisui opens his Mangekyou; the world goes still and grey as a thread of red light runs from his eye into the target's, and its will turns over without it noticing; colour returns, and the target turns its back and bows its head, on his side now.",
  tags: ["jutsu", "shisui", "uchiha", "mangekyou", "genjutsu", "control", "one-shot"],
  size: [240, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0204", "#8a0a14", "#e01a2a", "#ff8a90"], seed: 197 },
};

const CALM = { ...READY, crouch: 2, fx: 6, fy: -20, bx: -4, by: -20 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CLOSE, CALM, "out"],
    [END, CALM],
  ],
  hits: [
    { t: OPEN, stop: 0.2, target: false, sfx: "cast" },
    { t: THREAD, stop: 0.06, flash: 0, push: 0, straw: 4, shiver: 0.4 },
    { t: TURN, stop: 0.1, target: false, sfx: "clash" },
  ],
};
// the target turns away from him (faces the other way) and bows its head
export const targetState = (t) => (t > OBEY ? { rot: 0.15 * smooth(OBEY, OBEY + 0.4, t), tint: [RED[1], 0.12 * smooth(OBEY, OBEY + 0.3, t)] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const still = (t) => smooth(STILL, STILL + 0.2, t) * (1 - smooth(BACK, BACK + 0.3, t));
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the stillness: the whole frame washed grey with a dark vignette
      const k = still(t);
      if (k > 0.01) p.shade(-56, -140, 184, 30, (x, y, out) => { const d = Math.hypot((x - 64) / 140, (y + 50) / 100); out.a = k * (0.25 + 0.5 * Math.max(0, d - 0.5)); return d > 0.8 ? hex("#06040a") : GREY; });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "sharingan", t0: 0.04, t1: CLOSE, label: "KOTOAMATSUKAMI", head: b.head });
      // eyes closed, then the Mangekyou opening: a four-bladed shuriken pattern spinning
      if (t > CLOSE && t < OPEN) p.line(hx + 1, hy - 1, hx + 3, hy - 1, hex("#1a1010"));
      if (t > OPEN) {
        drawGlint(p, t, "itachi", OPEN, END - 0.3, b.head);
        const ex = hx + 2, ey = hy - 1, k = smooth(OPEN, OPEN + 0.15, t);
        if (t < OPEN + 0.5) { const s = 1 + 6 * (1 - smooth(OPEN, OPEN + 0.5, t)); p.circle(ex, ey, 3 * s, RED[2], 0.5 * k); for (let i = 0; i < 4; i++) { const a = t * 6 + i * (TAU / 4); p.line(ex, ey, ex + Math.cos(a) * 3 * s, ey + Math.sin(a) * 3 * s, RED[0], k); } }
      }
      // the thread of light from his eye to the target's
      if (t > THREAD && t < BACK) {
        const u = ease.outCubic(smooth(THREAD, THREAD + 0.3, t)), k = 1 - smooth(BACK - 0.2, BACK, t), x0 = hx + 2, y0 = hy - 1, x1 = TX + 2, y1 = -38;
        p.line(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, RED[3], k);
        p.glowLine(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 6, RED[2], 0.4 * k);
        // inside the target's head: its will, a small symbol, turning over and settling the other way
        if (t > THREAD + 0.3) { const turn = ease.inOutQuad(smooth(TURN - 0.2, TURN + 0.2, t)), a = Math.PI * turn, sx = TX + 2, sy = -50; p.circle(sx, sy, 6, RED[0], 0.7 * k); for (let i = 0; i < 3; i++) { const aa = a + i * (TAU / 3); p.line(sx, sy, sx + Math.cos(aa) * 5, sy + Math.sin(aa) * 5 * Math.cos(a), RED[3], k); } }
      }
      void rand; void noise2; void clamp; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
