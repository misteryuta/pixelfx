// Chidori Nagashi (Chidori Current, Sasuke). Narutopedia: the Chidori released in every direction at once, flowing from
// the user's whole body so it hits everyone around; the lightning makes the nerves misfire, so whoever it touches goes
// stiff, and it can be sent through the ground for range. Here: the Sharingan, he drops into a crouch, lightning bursts
// out of his whole body in a sphere of bolts, then pours into the floor and races along it to the target, which locks
// rigid and shudders with sparks crawling over it.
// New: the body burst (bolts thrown from points all over the posed body, _lib bolt), the ground current. From the
// library: the electrified status, on the target while it's locked.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU, posed } from "../../core/index.js";
import * as shocked from "../lightning/electrified.js";
import { play, bodyAt, bolt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, CROUCH = 0.5, BURST = CROUCH + 0.25, FLOW = BURST + 0.45, REACH = 0.3, LOCK = FLOW + REACH, FREE = LOCK + 1.1, TX = 150;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"];

export const meta = {
  name: "Chidori current",
  desc: "Sasuke: the Sharingan, a crouch, lightning bursting out of his whole body in a sphere of bolts, then pouring into the ground and racing to the target, which locks rigid with sparks crawling over it.",
  tags: ["jutsu", "sasuke", "lightning", "raiton", "sharingan", "aoe", "stun", "one-shot"],
  size: [260, 150],
  origin: [56, 120],
  duration: FREE + 1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: LT, seed: 33 },
};

const LOW = { ...READY, crouch: 11, lean: 6, fx: 9, fy: -10, bx: -6, by: -10, ffx: 11, fbx: -10 };
const FLARE = { ...READY, crouch: 6, lean: -4, fx: 14, fy: -32, bx: -12, by: -30, ffx: 12, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CROUCH, LOW, "in"],
    [BURST, FLARE, "snap"],
    [FLOW - 0.05, { ...FLARE, crouch: 8 }],
    [FLOW, { ...LOW, fx: 12, fy: -2, bx: 4, by: -2, crouch: 13 }, "snap"],
    [FREE, { ...LOW, crouch: 10 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: BURST, stop: 0.1, shake: 0.25, amp: 2, target: false },
    { t: LOCK, stop: 0.1, shake: 0.2, amp: 2, push: 0.6, straw: 14, skin: "shock", shiver: 1.2 },
    ...[0.25, 0.5, 0.75].map((d) => ({ t: LOCK + d, stop: 0.02, flash: 0, push: 0.2, straw: 4, shiver: 0.6 })),
    { t: FREE, flash: 0, push: 0.4, straw: 0, skin: null },
  ],
  dust: [{ t: FLOW, x: 12, n: 6 }],
};

export const create = play([{ fx: shocked, t: LOCK, until: FREE, x: TX }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let burst = false;
  return {
    update(t, dt) {
      if (!burst && t >= BURST) {
        burst = true;
        lights.add(0, -20, 80, C[3], 1, 0.25);
        for (let i = 0; i < 26; i++) {
          const a = R.range(0, TAU), s = R.range(80, 220);
          ps.spawn(P.SPARK, Math.cos(a) * 6, -20 + Math.sin(a) * 10, Math.cos(a) * s, Math.sin(a) * s, R.range(0.15, 0.4), R.chance(0.5) ? WHITE : C[3]);
        }
      }
      if (t > FLOW && t < FREE && R.chance(50 * dt)) ps.spawn(P.SPARK, TX + R.range(-10, 10), -R.range(2, 50), R.range(-60, 60), -R.range(20, 80), R.range(0.1, 0.25), R.chance(0.5) ? WHITE : C[3]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "sharingan", t0: EYE, t1: CROUCH, label: "SHARINGAN", head: b.head });
      drawGlint(p, t, "sharingan", CROUCH + 0.05, meta.duration - 0.4, b.head);
      // static gathering on him while he crouches
      if (t > CROUCH - 0.2 && t < BURST) {
        const r = posed(b.q);
        for (let i = 0; i < 4; i++) {
          const j = Math.floor(rand(f, i) * r.n), x = r.xs[j] + (b.q.x ?? 0), y = r.ys[j];
          bolt(p, x, y, x + (rand(f, i + 4) - 0.5) * 10, y + (rand(f, i + 8) - 0.5) * 10, f + i, C, { jag: 0.4, glow: 0 });
        }
      }
      // the burst: bolts out of every part of him, a sphere of lightning that holds, then sinks into the floor
      if (t >= BURST && t < FLOW + 0.1) {
        const k = 1 - smooth(FLOW - 0.1, FLOW + 0.1, t), r = posed(b.q), Rr = 26 + 10 * Math.sin(t * 30);
        for (let i = 0; i < 12; i++) {
          const j = Math.floor(rand(f, i + 20) * r.n), x0 = r.xs[j] + (b.q.x ?? 0), y0 = r.ys[j], a = Math.atan2(y0 + 20, x0) + (rand(f, i) - 0.5);
          bolt(p, x0, y0, Math.cos(a) * Rr * k, -20 + Math.sin(a) * Rr * k, f + i, C, { jag: 0.3, seed: i, glow: 0 });
        }
        p.glow(0, -20, 50, C[3], 0.7 * k);
        if (t - BURST < 0.05) p.circle(0, -20, 22, WHITE);
      }
      // the current: bolts racing low along the floor to the target, then climbing it
      if (t >= FLOW && t < FREE) {
        const u = clamp((t - FLOW) / REACH), head = 8 + (TX - 12 - 8) * u, fade = 1 - smooth(FREE - 0.3, FREE, t);
        for (let s = 0; s < 3; s++) {
          let x = 8;
          while (x < head) {
            const nx = Math.min(head, x + 14 + rand(f, s * 13 + x) * 10);
            bolt(p, x, -1 - rand(f, s + x) * 3, nx, -1 - rand(f + 1, s + nx) * 3, f + s * 9 + x, C, { jag: 0.4, seed: s, glow: 0.3 * fade });
            x = nx;
          }
        }
        if (u >= 1) for (let s = 0; s < 3; s++) bolt(p, TX - 10 + s * 8, -1, TX - 6 + s * 5 + (rand(f, s) - 0.5) * 12, -20 - rand(f, s + 1) * 30, f + s, C, { jag: 0.35, glow: 0.4 * fade });
        p.ellipse(head / 2 + 4, 0, head / 2, 2, C[2], 0.35 * fade);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
