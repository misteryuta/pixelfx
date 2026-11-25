// Kamui, long range (Kakashi). Narutopedia: Kakashi's Mangekyou, from Obito's eye, sends things into another dimension:
// space at the focal point twists into a spiral and swallows what's there; it takes concentration and a lot of chakra,
// and the eye bleeds. Here: his Mangekyou (the scar through it), he braces with a hand at the eye, the air round the
// target starts to turn, then space itself twists: the target is wrung into a spiral and sucked toward a point, which
// snaps shut and throws it back out, battered.
// New: the twist (_lib warp, the frame's own pixels swirled and pulled in), the spiral rings, the snap.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.05, OPEN = 0.6, FOCUS = OPEN + 0.2, TWIST = FOCUS + 0.4, SNAP = TWIST + 0.8, TX = 150, CY = -28, RW = 34;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex);

export const meta = {
  name: "Kamui (Kakashi)",
  desc: "Kakashi: his Mangekyou, a hand at the bleeding eye, and space round the target twists into a spiral, wrings it and sucks it toward a point that snaps shut and throws it out battered.",
  tags: ["jutsu", "kakashi", "kamui", "mangekyou", "space-time", "control", "one-shot"],
  size: [250, 150],
  origin: [50, 118],
  duration: SNAP + 1.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 41 },
};

const BRACE = { ...READY, crouch: 6, lean: 3, fx: 4, fy: -33, bx: 12, by: -26, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 3 }],
    [FOCUS, BRACE, "out"],
    [SNAP, { ...BRACE, crouch: 8 }],
    [SNAP + 0.4, { ...READY, crouch: 9, lean: 8, fx: 4, fy: -33, bx: 8, by: -12 }],
    [meta.duration, { ...READY, crouch: 6 }],
  ],
  hits: [
    { t: TWIST, stop: 0.06, flash: 0, push: 0, straw: 0, shiver: 1.2 },
    { t: SNAP, stop: 0.16, shake: 0.35, amp: 3, push: 3, straw: 30, flash: 0.05 },
  ],
};

// the camera (2026-11-25): close on his face and the Mangekyou as he braces; the focus travels from the eye along his
// line of sight to the far target and stays on it while space twists there; it snaps; a little wider for the throw-out
export const camera = cineCam([
  [0, { z: 1.5, x: 30, y: -32 }],
  [OPEN, { z: 2.6, x: 8, y: -28, r: -2 }],
  [FOCUS + 0.1, { z: 2.6, x: 10, y: -28, r: -2 }],
  [TWIST + 0.2, { z: 2.1, x: TX - 6, y: CY - 2, r: 1 }],
  [SNAP, { z: 2.25, x: TX, y: CY, r: 2 }],
  [SNAP + 0.05, { z: 2.25, x: TX, y: CY, r: 2, shake: 0.6 }],
  [SNAP + 0.4, { z: 1.6, x: TX - 20, y: CY - 4, r: 0 }],
  [meta.duration, { z: 1.25, x: 80, y: -32 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let snapped = false;
  return {
    update(t, dt) {
      if (t > FOCUS && t < SNAP && R.chance(40 * dt)) {
        const a = R.range(0, TAU), d = R.range(RW, RW + 14);
        ps.spawn(P.STREAK, TX + Math.cos(a) * d, CY + Math.sin(a) * d, -Math.sin(a) * 120 - Math.cos(a) * 60, Math.cos(a) * 120 - Math.sin(a) * 60, 0.15, SP[3]);
      }
      if (!snapped && t >= SNAP) {
        snapped = true;
        for (let i = 0; i < 24; i++) {
          const a = R.range(0, TAU), s = R.range(80, 220);
          ps.spawn(P.SPARK, TX, CY, Math.cos(a) * s, Math.sin(a) * s, R.range(0.2, 0.4), i % 2 ? WHITE : SP[3]);
        }
      }
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "kamui", t0: EYE, t1: OPEN, label: "KAMUI", head: b.head });
      drawGlint(p, t, "kamui", OPEN + 0.05, meta.duration - 0.3, b.head);
      if (t > TWIST) p.line(b.head[0] + 2, b.head[1] + 0.5, b.head[0] + 2, b.head[1] + 0.5 + Math.min(4, (t - TWIST) * 8), hex("#a01020"));
      // space wrung: the target twisted round and pulled in, harder and harder, until it snaps
      if (t > TWIST && t < SNAP) {
        const u = smooth(TWIST, SNAP, t);
        warp(p, TX, CY, RW, 7 * u * u + 0.6 * u, 0.85 * u * u);
      }
      // the turning air: spiral arms round the focus, tightening
      if (t > FOCUS && t < SNAP + 0.1) {
        const u = clamp((t - FOCUS) / (SNAP - FOCUS));
        for (let i = 0; i < 3; i++)
          for (let s = 0; s < 3; s++) {
            const a0 = -t * (6 + 10 * u) + (i * TAU) / 3 + s * 0.5, r0 = RW + 6 - s * 6 - u * 14;
            if (r0 > 2) p.arc(TX, CY, r0, 1, a0, a0 + 1.6, s ? SP[3] : SP[4], 0.4 + 0.6 * u);
          }
        p.circle(TX, CY, 1 + 3 * u, SP[0]);
      }
      if (t >= SNAP && t < SNAP + 0.25) {
        const u = (t - SNAP) / 0.25;
        p.ring(TX, CY, 4 + 40 * ease.outCubic(u), 1, u < 0.3 ? WHITE : SP[3], 1 - u);
        if (u < 0.15) p.circle(TX, CY, 6, WHITE);
      }
      ps.draw(p, "front");
    },
  };
});
