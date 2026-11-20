// Enton: Kagutsuchi no Tsurugi (Blaze Release: Kagutsuchi Sword, Sasuke). Narutopedia: Blaze Release puts shape
// transformation on Amaterasu's black flames; Sasuke casts Amaterasu with his left eye and shapes the flames with his
// right, and can wield them as a blade. Here: his Mangekyou opens, blood runs from the left eye, black flames burst
// up round his hand and are drawn out into a long sword of black fire; he dashes through the target and the cut sets
// it burning with flames that won't go out.
// New: the black flame (_lib drawBlackFlame) on the hand, stretched into the blade, along the cut and on the target.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawBlackFlame, BLACK_FIRE } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.65, IGNITE = OPEN + 0.15, SHAPE = IGNITE + 0.4, DASH = SHAPE + 0.35, CUT = DASH + 0.16, PAST = CUT + 0.12, END = PAST + 1.8, TX = 140;

export const meta = {
  name: "Kagutsuchi sword",
  desc: "Sasuke: his Mangekyou opens, blood runs from the left eye, black flames burst up round his hand and are drawn into a sword of black fire; he dashes through the target and leaves it burning.",
  tags: ["jutsu", "sasuke", "amaterasu", "enton", "mangekyou", "sword", "move", "melee", "one-shot"],
  size: [270, 150],
  origin: [50, 118],
  duration: END + 0.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#050306", "#120810", "#2a0c1a", "#6a1028", "#c02040"], seed: 34 },
};

const HOLDB = { ...READY, crouch: 5, lean: 2, fx: 13, fy: -22, bx: -6, by: -20, ffx: 9, fbx: -9 };
const DRAW = { ...HOLDB, fx: 6, fy: -30, bx: 12, by: -24, lean: -4 };
const RUN = { ...READY, x: TX - 40, crouch: 8, lean: 14, fx: -10, fy: -22, bx: -12, by: -20, ffx: 11, fbx: -11, ghost: true };
const SLASH = { ...READY, x: TX + 36, crouch: 6, lean: 10, fx: 22, fy: -16, bx: -10, by: -26, ffx: 12, fbx: -12 };
export const act = {
  target: { x: TX },
  ghost: "#6a1028",
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 4, hy: 2 }],
    [IGNITE, HOLDB, "out"],
    [SHAPE, DRAW, "out"],
    [DASH, { ...DRAW, crouch: 8, lean: 6 }],
    [CUT, RUN, "in"],
    [PAST, SLASH, "out"],
    [END - 0.6, { ...SLASH, lean: 2, crouch: 4 }],
    [meta.duration, { ...READY, x: TX + 36 }],
  ],
  hits: [
    { t: CUT, stop: 0.14, shake: 0.3, amp: 2, push: 2.5, straw: 20, skin: "char" },
    ...[0.4, 0.8, 1.2].map((d) => ({ t: CUT + d, stop: 0.02, flash: 0, push: 0.3, straw: 4, shiver: 0.3 })),
  ],
  dust: [{ t: DASH, x: 8, n: 8, dir: -1 }, { t: PAST, x: TX + 36, n: 6 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), F = BLACK_FIRE;
  let cut = false;
  return {
    update(t, dt) {
      if (!cut && t >= CUT) {
        cut = true;
        lights.add(TX, -24, 60, F[4], 0.6, 0.2);
      }
      if (t > CUT && R.chance(30 * dt)) ps.spawn(P.EMBER, TX + R.range(-10, 10), -R.range(10, 40), R.range(-10, 10), -R.range(20, 40), R.range(0.3, 0.6), t > CUT ? F[4] : 0);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "sasukeMS", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "sasukeMS", OPEN + 0.05, END, b.head);
      // the price of Amaterasu: blood running from the left eye
      if (t > OPEN + 0.1) {
        const L = Math.min(4, (t - OPEN - 0.1) * 12);
        p.line(b.head[0] + 2, b.head[1] + 0.5, b.head[0] + 2, b.head[1] + 0.5 + L, hex("#a01020"));
      }
      // black fire on the hand, drawn out into the blade
      if (t > IGNITE && t < PAST + 0.3) {
        const grow = smooth(IGNITE, IGNITE + 0.15, t), blade = smooth(SHAPE - 0.1, SHAPE + 0.1, t), gone = smooth(PAST, PAST + 0.3, t);
        if (blade < 1) drawBlackFlame(p, hx, hy + 3, 7, 16, t, 1, grow * (1 - blade * 0.7));
        if (blade > 0 && gone < 1) {
          // the sword: a long blade of black flame reaching back from the fist (forward once he swings)
          const ang = t < CUT ? -2.4 : -0.4, L = 30 * blade * (1 - gone), ca = Math.cos(ang), sa = Math.sin(ang);
          for (let i = 0; i < L; i += 1) {
            const w = 3.2 * (1 - i / L) + 0.8 + Math.sin(i * 0.9 - t * 30) * 0.8, x = hx + ca * i, y = hy + sa * i;
            p.line(x - sa * w, y + ca * w, x + sa * w, y - ca * w, i % 4 === 0 ? F[2] : F[0]);
            p.px(x - sa * (w + 1), y + ca * (w + 1), F[4]);
            p.px(x + sa * (w + 1), y - ca * (w + 1), F[3]);
          }
        }
      }
      // the cut: a long black arc through the target, burning
      if (t >= CUT && t < CUT + 0.35) {
        const u = clamp((t - CUT) / 0.35);
        p.arc(TX - 6, -12, 30, 3, -1.9, 0.2, F[0], 1 - u);
        p.arc(TX - 6, -12, 33, 1, -1.9, 0.2, F[4], 1 - u);
      }
      // the target burns with black flame that won't go out
      if (t > CUT) {
        const k = smooth(CUT, CUT + 0.25, t) * (1 - smooth(END - 0.4, END, t));
        for (let i = 0; i < 5; i++) drawBlackFlame(p, TX - 12 + i * 6, -2 - (i % 2) * 20 - (i === 2 ? 30 : 0), 6 + (i % 2), 16 + (i % 3) * 5, t + i, i * 3, k);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
