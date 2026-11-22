// Amaterasu (Itachi). Narutopedia: a Mangekyou Sharingan doujutsu, the highest Fire Release; black flames are born at the
// focal point of the user's sight, no seals, no projectile, burn as hot as the sun and won't go out until the target is
// ash, and the eye that casts it bleeds. Here: Itachi's Mangekyou turns, he just looks: the air at the target ripples
// where his gaze settles: one red frame, the whole world gone to ink on blood for an instant, a red pulse that dies
// away, and black fire is simply there, catching on the target and spreading out over it and across the ground,
// burning on long after.
// New: the red frame (impactFrame in ink on red), the bloom of black flame (_lib drawBlackFlame, tongues catching one
// after another outward from where he looked), the blood from the eye.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt, drawBlackFlame, BLACK_FIRE, impactFrame, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.65, FOCUS = OPEN + 0.25, IGNITE = FOCUS + 0.22, END = IGNITE + 2.6, TX = 140;
// the tongues: where on the target each catches, how long after the first, how big
const TONGUES = [
  ...Array.from({ length: 9 }, (_, i) => ({ x: TX - 12 + rand(i, 1) * 24, y: -4 - rand(i, 2) * 44, w: 5 + rand(i, 4) * 4, h: 12 + rand(i, 5) * 12 })),
  // and out across the ground on both sides
  ...Array.from({ length: 12 }, (_, i) => ({ x: TX + (i % 2 ? 1 : -1) * (16 + Math.floor(i / 2) * 9 + rand(i, 6) * 4), y: 0, w: 4 + rand(i, 7) * 3, h: 8 + rand(i, 8) * 10 })),
].map((q) => ({ ...q, d: Math.hypot(q.x - TX, q.y + 26) * 0.012 * (0.8 + 0.4 * rand(q.x, 9)) }));

export const meta = {
  name: "Amaterasu",
  desc: "Itachi: his Mangekyou turns and he only looks; the air at the target ripples where his gaze settles and black flames bloom over it, spreading and burning on, while blood runs from his eye.",
  tags: ["jutsu", "itachi", "amaterasu", "mangekyou", "fire", "dot", "one-shot"],
  size: [240, 150],
  origin: [50, 118],
  duration: END + 0.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#050306", "#120810", "#2a0c1a", "#6a1028", "#c02040"], seed: 36 },
};

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [IGNITE, { ...CALM, hy: 1 }],
    [IGNITE + 0.2, { ...CALM, crouch: 2, fx: 6, fy: -30, bx: -2, by: -17 }, "out"],
    [IGNITE + 0.8, CALM],
    [meta.duration, CALM],
  ],
  hits: [
    { t: IGNITE, stop: 0.12, shake: 0.25, amp: 2, push: 1.8, straw: 14, skin: "char", flash: 0 },
    ...[0.5, 1.0, 1.5, 2.0].map((d) => ({ t: IGNITE + d, stop: 0.02, flash: 0, push: 0.4, straw: 5, shiver: 0.4 })),
    { t: meta.duration - 0.25, flash: 0, push: 0, straw: 0, skin: null }, // RESET SKIN: the target back to its own colours
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), F = BLACK_FIRE;
  return {
    update(t, dt) {
      if (t > IGNITE && t < END - 0.3 && R.chance(40 * dt)) {
        const q = TONGUES[R.int(0, TONGUES.length - 1)];
        ps.spawn(P.EMBER, q.x + R.range(-3, 3), q.y - q.h * 0.6, R.range(-10, 10), -R.range(20, 45), R.range(0.4, 0.8), R.chance(0.6) ? F[1] : F[4]);
      }
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN + 0.05, END, b.head);
      // the eye bleeds once the flames are called
      if (t > IGNITE) p.line(b.head[0] + 2, b.head[1] + 0.5, b.head[0] + 2, b.head[1] + 0.5 + Math.min(4, (t - IGNITE) * 10), hex("#a01020"));
      // the red frame: for an instant everything is ink on blood, then a red pulse dies away over the scene
      if (t >= IGNITE - 0.02 && t < IGNITE + 0.4) veil(p, -50, -118, 190, 32, hex("#8a0a18"), 0.45 * (1 - smooth(IGNITE - 0.02, IGNITE + 0.4, t)));
      // the bloom: black flame catches at one point and spreads over the whole target, then burns on
      if (t >= IGNITE) {
        const out = 1 - smooth(END - 0.5, END, t);
        p.glow(TX, -20, 60 * smooth(IGNITE, IGNITE + 0.6, t), F[4], 0.25 * out);
        for (const [i, q] of TONGUES.entries()) {
          const k = ease.outBack(clamp((t - IGNITE - q.d) / 0.25), 2) * out;
          drawBlackFlame(p, q.x, q.y, q.w, q.h, t + i * 0.7, i * 5, k);
        }
      }
      ps.draw(p, "front");
    },
  };
});
