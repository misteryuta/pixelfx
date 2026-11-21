// Taijutsu: shoulder throw. The rival comes in with a straight punch; the hero slips inside it, catches the wrist and
// turns his back into the rival's chest; he bends and heaves, and the rival goes up over his shoulder head over heels
// and down flat on his back, the floor cracking under him; the hero, still holding the wrist, drops a knee and a
// hammer fist into his chest.
// New: the throw (the rival turned over the hero's shoulder with the turned-figure helper), the ground punch.
// From _taijutsu.js: rival, sparks, smears, shots.
import { READY, smooth, ease, clamp, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt, drawFigureTurned, impactFrame } from "./_lib.js";
import { shots, GUARD, JAB, LAND, RECOIL, FLY, rival, jointOf, smear, hitSpark, RIVAL } from "./_taijutsu.js";

const BX = 112, PUNCHT = 0.55, SLIP = 0.6, TURN = 0.8, HEAVE = 0.95, OVER = 1.25, SLAM = 1.35, KNEE = 1.6, FIST = 1.8, END = 2.9;

export const meta = {
  name: "Taijutsu: shoulder throw",
  desc: "The hero slips inside a straight punch, catches the wrist, turns his back into the rival and heaves him over his shoulder head over heels onto his back, then drops a knee and a hammer fist into his chest.",
  tags: ["taijutsu", "melee", "duel", "throw", "grapple", "one-shot"],
  size: [270, 190],
  origin: [50, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 95 },
};

const SLIPP = { ...GUARD, crouch: 9, lean: 6, fx: 18, fy: -30, bx: 10, by: -24 };
const BACKIN = { ...GUARD, yaw: Math.PI, crouch: 10, lean: -4, armsFront: true, fx: 12, fy: -32, bx: 10, by: -30, gait: false };
const HEAVEP = { ...BACKIN, crouch: 14, lean: -24, fx: 4, fy: -14, bx: 4, by: -16 };
const KNEELP = { ...GUARD, face: -1, crouch: 16, lean: 18, fx: 14, fy: -8, bx: 22, by: -26, ffx: 12, ffy: -2, fbx: -6 };
const HAMMER = { ...KNEELP, fx: 26, fy: -2, bx: 12, by: -14, lean: 24 };
const GX = 60;
// thrown: stretched out straight, arms over the head, so turned on its side it lies flat
const STRAIGHT = { ...READY, crouch: 0, lean: 0, fx: 2, fy: -34, bx: -2, by: -36, ffx: 3, fbx: -3 };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.15, { ...GUARD, x: 30 }, "out"],
    [SLIP, { ...SLIPP, x: 52 }, "out"],
    [TURN, { ...BACKIN, x: GX }, "out"],
    [HEAVE, { ...BACKIN, x: GX, crouch: 13 }],
    [OVER, { ...HEAVEP, x: GX }, "out"],
    [KNEE - 0.1, { ...GUARD, face: -1, x: GX - 2, crouch: 10, gait: false }, "out"],
    [KNEE, { ...KNEELP, x: GX - 4, gait: false }, "snap"],
    [FIST - 0.1, { ...KNEELP, x: GX - 4, fy: -30, fx: 10, lean: 6, gait: false }, "out"],
    [FIST, { ...HAMMER, x: GX - 4, gait: false }, "snap"],
    [END - 0.4, { ...KNEELP, x: GX - 4, gait: false }],
    [END, { ...KNEELP, x: GX - 4, gait: false }],
  ],
  hits: [
    { t: PUNCHT, target: false, sfx: "whoosh" },
    { t: SLIP, stop: 0.08, shake: 0.1, amp: 1, target: false, sfx: "block" },
    { t: HEAVE, target: false, sfx: "whoosh" },
    { t: SLAM, stop: 0.2, shake: 0.7, amp: 5, target: false, sfx: "explosion" },
    { t: KNEE, stop: 0.06, shake: 0.2, amp: 2, target: false, sfx: "kick" },
    { t: FIST, stop: 0.18, shake: 0.5, amp: 4, target: false, sfx: "heavy" },
  ],
  dust: [{ t: SLAM, x: GX - 20, n: 18, dir: -1 }, { t: SLAM, x: GX - 4, n: 12, dir: 1 }],
};

export const camera = shots([
  [0, { z: 1.4, x: 64, y: -26 }],
  [SLIP, { z: 2.3, x: 74, y: -30, r: 2 }, "cut"],
  [HEAVE, { z: 2.0, x: 64, y: -40, r: -2 }],
  [SLAM, { z: 2.4, x: 52, y: -12, r: 3 }, "cut"],
  [KNEE, { z: 1.9, x: 62, y: -16 }, "cut"],
  [FIST, { z: 2.6, x: 62, y: -12, r: -3 }, "cut"],
  [FIST + 0.3, { z: 1.5, x: 62, y: -20 }, "cut"],
  [END, { z: 1.4, x: 62, y: -20 }],
]);

// the rival: comes in with the punch, is caught, goes up over the hero's back and down flat behind him
const B = rival([
  [-0.25, READY],
  [0.15, { ...GUARD, x: 20 }, "out"],
  [PUNCHT, { ...JAB, x: 34 }, "snap"],
  [TURN, { ...JAB, x: 36, lean: 14 }],
  [HEAVE, { ...FLY, x: 40, y: -10 }, "out"],
  [OVER, { ...STRAIGHT, x: 62, y: -44 }, "out"],
  [SLAM, { ...STRAIGHT, x: 74, y: 0 }, "in"],
  [END - 0.2, { ...STRAIGHT, x: 74, y: 0 }],
], BX);
// head over heels: from upright at the catch to flat on his back after the slam
const TURN_END = -1.5;
const turnOf = (t) => ease.inOutCubic(smooth(HEAVE, SLAM, t)) * Math.PI * TURN_END;

export const create = play([], () => ({
  drawBack(p, t) {
    const s = B(t), a = turnOf(t);
    p.ellipse(s.x, 0.5, 10, 1.5, hex("#08060c"), 0.5);
    const lay = 15 * smooth(OVER, SLAM, t);
    drawFigureTurned(p, s.q, s.x, s.y + lay, s.x, s.y - 18 + lay, a, { face: -1, tint: RIVAL, k: 0.38 });
    if (t > SLAM) { const k = 1 - smooth(END - 0.5, END, t); for (let i = 0; i < 7; i++) { const ang = Math.PI + (i / 6) * Math.PI; p.line(BX - 74, 0, BX - 74 + Math.cos(ang) * 26, Math.sin(ang) * 2, hex("#100c14"), k); } }
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    // the catch: a grip flash round the wrist
    if (t > SLIP && t < SLIP + 0.3) { const [x, y] = bodyAt(act.poses, t).handN; p.ring(x, y, 4 + 10 * (t - SLIP), 1, WHITE, 1 - (t - SLIP) / 0.3); }
    // the arc of the throw: a white smear along the rival's head
    if (t > HEAVE && t < SLAM + 0.05) {
      const pts = [];
      for (let i = 0; i < 10; i++) { const tt = t - i * 0.015, s = B(tt), a = turnOf(tt); pts.push([s.x + Math.sin(a) * 22, s.y - 18 - Math.cos(a) * 22 + 0]); }
      for (let i = 1; i < pts.length; i++) p.beam(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 4 * (1 - i / 10), i < 3 ? WHITE : hex("#ffe8a0"), 1 - i / 10);
    }
    if (t >= SLAM && t < SLAM + 0.04) impactFrame(p, -50, -160, 220, 30, BX - 74, -4, false, 51, { style: "burst", ink: hex("#140a06"), paper: hex("#fff0c0") });
    if (t > KNEE) hitSpark(p, ...bodyAt(act.poses, KNEE).footN, t - KNEE, {});
    if (t > FIST - 0.08 && t < FIST + 0.03) smear(p, at("handN"), t, { w: 6, n: 8 });
    if (t > FIST) hitSpark(p, ...bodyAt(act.poses, FIST).handN, t - FIST, { big: true });
    void clamp; void rand; void jointOf; void LAND; void RECOIL;
  },
}));
