// Taijutsu: sweep and drop (after the reference: the rush, the dodge, the takedown and the blow from above). The hero
// darts in; the rival meets him with a spinning kick that whips over his ducked head; from the crouch the hero sweeps
// his legs out, the rival is thrown up and turned over in the air; the hero springs up after him and drives him back
// down into the ground with a hammer blow: impact frames, the floor cracks, dust and rock thrown out.
// New: the sweep, the spin kick (yaw), the airborne finisher and the cratering landing (from _taijutsu.js and _lib).
import { READY, smooth, ease, clamp, hex, rand } from "../../core/index.js";
import { play, bodyAt, impactFrame, drawChunk } from "./_lib.js";
import { GUARD, RUN, KICK, DUCK, LOWKICK, FLY, LAND, rival, drawRival, rivalGhosts, jointOf, smear, hitSpark, speedLines } from "./_taijutsu.js";

const BX = 104, DASH = 0.25, SPIN = 0.62, SWEEP = 0.86, UP = 1.0, PEAK = 1.18, DROP = 1.36, LANDT = 1.62, END = 2.9;

export const meta = {
  name: "Taijutsu: sweep and drop",
  desc: "A dash in, a spinning kick ducked, a leg sweep that throws the rival into the air, and a leaping hammer blow that drives him into the cracking ground.",
  tags: ["taijutsu", "melee", "duel", "finisher", "one-shot"],
  size: [270, 160],
  origin: [50, 132],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 83 },
};

const HAMMER = { crouch: 0, lean: 18, fx: 16, fy: -8, bx: 12, by: -10, ffx: 2, ffy: -16, fbx: -8, fby: -10, ghost: true };
const LEAPP = { crouch: 2, lean: -4, fx: 2, fy: -40, bx: 6, by: -42, ffx: 8, ffy: -12, fbx: -6, fby: -8, ghost: true };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.12, GUARD, "out"],
    [DASH, { ...RUN, x: 6 }, "snap"],
    [SPIN - 0.08, { ...RUN, x: 44 }],
    [SPIN - 0.03, { ...DUCK, x: 48 }, "snap"],
    [SWEEP - 0.04, { ...DUCK, x: 50 }],
    [SWEEP, { ...LOWKICK, x: 52 }, "snap"],
    [UP, { ...LEAPP, x: 56, y: -6 }, "out"],
    [PEAK, { ...LEAPP, x: 62, y: -44, lean: 6 }, "out"],
    [DROP, { ...HAMMER, x: 66, y: -14 }, "in"],
    [LANDT, { ...LAND, x: 64, y: 0, crouch: 15 }, "in"],
    [END - 0.4, { ...GUARD, x: 58 }],
    [END, { ...GUARD, x: 58 }],
  ],
  hits: [
    { t: DASH, target: false, sfx: "step" },
    { t: SPIN, target: false, sfx: "whoosh" },
    { t: SWEEP, stop: 0.08, shake: 0.2, amp: 2, target: false, sfx: "kick" },
    { t: UP, target: false, sfx: "step" },
    { t: DROP, stop: 0.24, shake: 0.7, amp: 5, target: false, sfx: "heavy" },
    { t: LANDT, shake: 0.2, amp: 2, target: false, sfx: "land" },
  ],
  dust: [{ t: DASH, x: 4, n: 8, dir: -1 }, { t: UP, x: 54, n: 10 }, { t: DROP, x: 70, n: 14, dir: -1 }, { t: DROP, x: 82, n: 14, dir: 1 }],
};

// the rival: guard, a spinning kick (a full turn about his feet), swept off his feet and turned in the air, slammed down
const B = rival([
  [-0.25, READY],
  [0.12, GUARD, "out"],
  [SPIN - 0.2, { ...GUARD, x: 18, yaw: 0 }],
  [SPIN, { ...KICK, x: 22, yaw: Math.PI, ffy: -30 }, "line"],
  [SPIN + 0.12, { ...GUARD, x: 22, yaw: Math.PI * 2 }, "line"],
  [SWEEP, { ...GUARD, x: 22, yaw: 0, lean: 4 }, "snap"],
  [SWEEP + 0.04, { ...FLY, x: 20, y: -8, lean: -22 }, "snap"],
  [PEAK, { ...FLY, x: 16, y: -30, lean: -26, yaw: Math.PI * 0.6 }],
  [DROP, { ...FLY, x: 16, y: -12, lean: -28, yaw: Math.PI }, "in"],
  [DROP + 0.04, { ...LAND, x: 16, y: 0, crouch: 16, lean: 18 }, "snap"],
  [END - 0.3, { ...LAND, x: 16, crouch: 13 }],
  [END, { ...GUARD, x: 16 }],
], BX);

export const create = play([], () => ({
  drawBack(p, t) {
    speedLines(p, -50, -80, 220, -4, t, smooth(DASH, DASH + 0.1, t) * (1 - smooth(SPIN - 0.1, SPIN, t)), 1);
    // the crater where he's driven in
    if (t > DROP) {
      const k = 1 - smooth(DROP + 1, END, t), x = BX - 16;
      p.ellipse(x, 0.5, 26, 3, hex("#120c18"), 0.9 * k);
      for (let i = 0; i < 6; i++) {
        const dir = i % 2 ? 1 : -1, L = 14 + rand(i, 5) * 24;
        p.line(x + dir * 6, 0, x + dir * L, (rand(i, 6) - 0.5) * 2, hex("#08060c"), k);
      }
    }
    drawRival(p, B, t);
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    if (t > SPIN - 0.12 && t < SPIN + 0.1) {
      smear(p, (tt) => {
        const s = B(tt);
        return jointOf(s.q, "ankleN", s.x, s.y, -1);
      }, t, { w: 5, n: 8 });
    }
    if (t > SWEEP - 0.08 && t < SWEEP + 0.04) smear(p, at("footN"), t, { w: 5 });
    if (t > SWEEP) hitSpark(p, ...bodyAt(act.poses, SWEEP).footN, t - SWEEP);
    if (t > PEAK && t < DROP + 0.03) smear(p, at("handN"), t, { w: 6, n: 8 });
    const hit = bodyAt(act.poses, DROP).handN;
    if (t >= DROP && t < DROP + 0.05) impactFrame(p, -50, -132, 220, 28, hit[0], hit[1], false, 11);
    else if (t >= DROP + 0.05 && t < DROP + 0.1) impactFrame(p, -50, -132, 220, 28, hit[0], hit[1], true, 12);
    if (t > DROP + 0.1) hitSpark(p, hit[0], hit[1], t - DROP - 0.1, { big: true });
    // rock thrown out of the crater
    const age = t - DROP - 0.1;
    if (age > 0 && age < 1)
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI * (0.15 + 0.7 * rand(i, 21)), v = 60 + 90 * rand(i, 22), x = BX - 16 + Math.cos(a) * v * age, y = Math.sin(a) * v * age + 220 * age * age;
        if (y < 0) drawChunk(p, x, y, 1.5 + 2 * rand(i, 23), age * 7, ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex));
      }
  },
}));
