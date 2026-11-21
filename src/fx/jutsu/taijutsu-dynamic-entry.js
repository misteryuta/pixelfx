// Taijutsu: dynamic entry. The hero comes flying in from off the frame, one leg out, a flying kick; the rival gets his
// arms crossed in time and is driven back sliding, heels ploughing the floor; the hero lands, and before the rival's
// guard comes down: a flurry, jab-jab-cross-jab, each faster, the rival's guard knocked open; a rising uppercut lifts
// him off his feet and he drops on his back.
// New: the flying entry with speed lines, the slide with furrows, the flurry with rising pace. From _taijutsu.js.
import { READY, smooth, ease, clamp, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { shots, GUARD, JAB, CROSS, UPPER, BLOCK, RECOIL, FLY, LAND, rival, drawRival, jointOf, smear, hitSpark, blockSpark, speedLines } from "./_taijutsu.js";

const BX = 120, ENTRY = 0.45, LANDT = 0.7, FL = [0.92, 1.04, 1.14, 1.22, 1.3], UPC = 1.52, DOWN = 2.05, END = 2.9;

export const meta = {
  name: "Taijutsu: dynamic entry",
  desc: "A flying kick in from off the frame, blocked with crossed arms and driven back sliding; a flurry of jabs and a cross knock the guard open, and a rising uppercut lifts the rival off his feet onto his back.",
  tags: ["taijutsu", "melee", "duel", "flurry", "one-shot"],
  size: [270, 160],
  origin: [50, 132],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 94 },
};

const FLYK = { crouch: 0, lean: -10, fx: -6, fy: -30, bx: -10, by: -28, ffx: 22, ffy: -20, fbx: -6, fby: -10, ghost: true, gait: false };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, { ...FLYK, x: -90, y: -50 }],
    [ENTRY, { ...FLYK, x: 46, y: -14 }, "line"],
    [LANDT, { ...LAND, x: 40, y: 0, gait: false }, "in"],
    [FL[0] - 0.08, { ...GUARD, x: 44 }, "out"],
    ...FL.map((t, i) => [t, { ...(i === 2 ? CROSS : JAB), x: 48 + i * 2, fx: (i === 2 ? 5 : 23) + i }, "snap"]),
    [UPC - 0.1, { ...GUARD, x: 56, crouch: 12, lean: 10 }, "out"],
    [UPC, { ...UPPER, x: 60 }, "snap"],
    [END - 0.4, { ...GUARD, x: 58 }],
    [END, { ...GUARD, x: 58 }],
  ],
  hits: [
    { t: ENTRY, stop: 0.16, shake: 0.4, amp: 3, target: false, sfx: "block" },
    { t: LANDT, target: false, sfx: "land" },
    ...FL.map((t, i) => ({ t, stop: 0.03, shake: 0.08, amp: 1, target: false, sfx: i === 2 ? "heavy" : "punch" })),
    { t: UPC, stop: 0.2, shake: 0.5, amp: 4, target: false, sfx: "heavy" },
    { t: DOWN, shake: 0.3, amp: 2, target: false, sfx: "land" },
  ],
  dust: [{ t: ENTRY, x: BX - 30, n: 14, dir: 1 }, { t: LANDT, x: 40, n: 8 }, { t: DOWN, x: BX - 20, n: 14, dir: 1 }],
};
// the rival's shove back along the floor
export const camera = shots([
  [0, { z: 1.3, x: 40, y: -30 }],
  [ENTRY, { z: 2.4, x: 74, y: -28, r: -3 }, "cut"],
  [LANDT, { z: 1.8, x: 74, y: -26 }],
  [FL[0], { z: 2.2, x: 80, y: -26, r: 1 }],
  [FL[4], { z: 2.5, x: 82, y: -28, r: -1 }],
  [UPC, { z: 2.6, x: 84, y: -34, r: 3 }, "cut"],
  [UPC + 0.2, { z: 1.4, x: 84, y: -30 }, "cut"],
  [END, { z: 1.3, x: 80, y: -26 }],
]);

const B = rival([
  [-0.25, READY],
  [ENTRY - 0.15, { ...BLOCK, x: 0 }, "out"],
  [ENTRY, { ...BLOCK, x: 2, gait: false }],
  [LANDT, { ...BLOCK, x: -22, crouch: 9, gait: false }, "out"],
  ...FL.map((t, i) => [t, { ...(i < 3 ? BLOCK : RECOIL), x: -24 - i * 2, fy: i < 3 ? -31 : -20 }, "snap"]),
  [UPC, { ...RECOIL, x: -34 }],
  [UPC + 0.04, { ...FLY, x: -40, y: -16 }, "snap"],
  [DOWN, { ...LAND, x: -70, y: 0, crouch: 16, lean: -16 }, "in"],
  [END - 0.2, { ...LAND, x: -72, crouch: 16, lean: -16 }],
], BX);
const rJ = (n) => (t) => { const s = B(t); return jointOf(s.q, n, s.x, s.y, -1); };

export const create = play([], () => ({
  drawBack(p, t) {
    // furrows where his heels plough back
    if (t > ENTRY) { const s = B(Math.min(t, LANDT)); p.line(BX - 2, 0, s.x, 0, hex("#100c14"), 1 - smooth(END - 0.6, END, t)); }
    drawRival(p, B, t);
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    speedLines(p, -60, -70, 220, 10, t, 1 - smooth(ENTRY - 0.05, ENTRY + 0.05, t));
    if (t > ENTRY) { const [x, y] = bodyAt(act.poses, ENTRY).footN; blockSpark(p, x + 3, y, t - ENTRY, { dir: 1, c: hex("#ffe8a0") }); }
    FL.forEach((h, i) => {
      const n = i === 2 ? "handF" : "handN";
      if (t > h - 0.05 && t < h + 0.02) smear(p, at(n), t, { w: 3 });
      if (t > h) (i < 3 ? blockSpark : hitSpark)(p, ...bodyAt(act.poses, h)[n], t - h, { dir: 1 });
    });
    if (t > UPC - 0.08 && t < UPC + 0.03) smear(p, at("handN"), t, { w: 6, n: 8 });
    if (t > UPC) hitSpark(p, ...bodyAt(act.poses, UPC).handN, t - UPC, { big: true });
    void ease; void clamp; void rand; void WHITE; void rJ;
  },
}));
