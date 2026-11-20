// Kamui, close range (Obito). Narutopedia: with Obito's right Mangekyou, Kamui moves him or what he touches into its other
// dimension through a spiralling void: he can slip parts of himself away so attacks pass through, warp himself from place
// to place, and pull a target in by touching it. Here: his Mangekyou, his own body wrung into a spiral and gone, a
// spiral opening behind the target and him turning out of it, a hand on the target's back, the target twisted and sucked
// in at the touch and spat back out, and he spirals away home.
// New: the warp on his own body and on the target (_lib warp, the frame's pixels swirled), the void's spiral, the hidden
// body between (actorAlpha).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, OUT = OPEN + 0.1, GONE = OUT + 0.35, IN = GONE + 0.25, THERE = IN + 0.35, TOUCH = THERE + 0.2, SUCK = TOUCH + 0.1, SPIT = SUCK + 0.7, HOME0 = SPIT + 0.35, HOME1 = HOME0 + 0.35, BACK = HOME1 + 0.25, TX = 140, OX = TX + 32;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex);

export const meta = {
  name: "Kamui (Obito)",
  desc: "Obito: his Mangekyou, his own body wrung into a spiral and gone, a void opening behind the target and him turning out of it; a hand on its back, the target twisted and sucked in and spat out, and he spirals away home.",
  tags: ["jutsu", "obito", "kamui", "mangekyou", "space-time", "teleport", "one-shot"],
  size: [250, 150],
  origin: [50, 118],
  duration: BACK + 1.0,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 43 },
};

export const actorAlpha = (t) => ((t >= GONE && t < IN) || (t >= HOME0 + 0.18 && t < HOME1 - 0.17) ? 0 : 1);

const CALM = { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18, ffx: 6, fbx: -6 };
const BEHIND = { ...READY, x: OX, yaw: Math.PI, crouch: 3, fx: 6, fy: -20, bx: 4, by: -19 };
const PALM = { ...BEHIND, crouch: 4, lean: 6, fx: 14, fy: -26 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [IN, BEHIND, "snap"],
    [TOUCH, PALM, "out"],
    [SPIT, { ...PALM, lean: 2 }],
    [HOME0 + 0.18, BEHIND],
    [HOME1 - 0.17, CALM, "snap"],
    [meta.duration, CALM],
  ],
  hits: [
    { t: TOUCH, stop: 0.08, flash: 0, push: 0, straw: 0, shiver: 0.6 },
    { t: SUCK + 0.3, stop: 0.04, flash: 0, push: 0, straw: 6, shiver: 1 },
    { t: SPIT, stop: 0.14, shake: 0.3, amp: 2, push: -3.5, straw: 26 },
  ],
};

// a spiral of void: arms turning round a black eye, r its size
function vortex(p, x, y, r, t, k) {
  if (k <= 0) return;
  p.circle(x, y, Math.max(1, r * 0.25 * k), SP[0]);
  for (let i = 0; i < 3; i++)
    for (let s = 0; s < 3; s++) {
      const a0 = t * 14 + (i * TAU) / 3 + s * 0.6, rr = (r - s * r * 0.25) * k;
      if (rr > 1.5) p.arc(x, y, rr, 1, a0, a0 + 1.7, s ? SP[3] : SP[4], 0.7 + 0.3 * k);
    }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let spat = false;
  return {
    update(t, dt) {
      if (!spat && t >= SPIT) {
        spat = true;
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), s = R.range(60, 180);
          ps.spawn(P.STREAK, TX, -28, Math.cos(a) * s, Math.sin(a) * s, 0.15, i % 2 ? WHITE : SP[3]);
        }
      }
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "obito", t0: EYE, t1: OPEN, label: "KAMUI", head: b.head });
      if (actorAlpha(t) > 0) drawGlint(p, t, "obito", OPEN + 0.05, meta.duration - 0.3, b.head);
      // out: his own body wrung into the spiral and swallowed
      if (t > OUT && t < GONE + 0.1) {
        const u = smooth(OUT, GONE, t);
        if (t < GONE) warp(p, 0, -20, 22, 8 * u * u, 0.9 * u * u);
        vortex(p, 0, -20, 20, t, u < 0.85 ? u : 1 - smooth(GONE, GONE + 0.1, t));
      }
      // in: a spiral opens behind the target and he turns out of it, untwisting
      if (t > GONE + 0.05 && t < THERE) {
        const u = smooth(GONE + 0.05, IN, t), v = smooth(IN, THERE, t);
        vortex(p, OX, -20, 20, -t, u * (1 - v));
        if (t >= IN) warp(p, OX, -20, 21, -8 * (1 - v) ** 2, 0.9 * (1 - v) ** 2);
      }
      // the touch: the target wrung at the hand and pulled half into the void, then thrown back out
      if (t > SUCK && t < SPIT) {
        const u = smooth(SUCK, SPIT - 0.1, t);
        warp(p, TX + 4, -28, 30, 6 * u * u, 0.7 * u * u);
        vortex(p, TX + 4, -28, 10 + 8 * u, t, 0.6 * u);
      }
      // home: the same in reverse
      if (t > HOME0 && t < HOME1 + 0.15) {
        const a = smooth(HOME0, HOME0 + 0.18, t), c = smooth(HOME1 - 0.17, HOME1 + 0.15, t);
        if (t < HOME0 + 0.18) warp(p, OX, -20, 21, 8 * a * a, 0.9 * a * a);
        vortex(p, OX, -20, 18, t, a * (1 - smooth(HOME0 + 0.18, HOME0 + 0.28, t)));
        if (t > HOME1 - 0.27) vortex(p, 0, -20, 18, -t, smooth(HOME1 - 0.27, HOME1 - 0.17, t) * (1 - c));
        if (t >= HOME1 - 0.17) warp(p, 0, -20, 22, -8 * (1 - c) ** 2, 0.9 * (1 - c) ** 2);
      }
      ps.draw(p, "front");
    },
  };
});
