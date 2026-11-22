// Taijutsu: aerial combo. The hero runs in under the rival's guard and launches him with a rising kick; leaps after
// him and, in the air, a jab, a cross and a knee, each one lifting him a little higher; at the top a spin and an axe
// kick that drives him straight down into the floor; he bounces once, dust and cracks; the hero lands in a crouch.
// New: the juggle (both bodies in the air, the rival turned head over heels with the turned-figure helper), the
// axe-kick spike. From _taijutsu.js: rival, sparks, smears, shots.
import { READY, smooth, ease, clamp, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt, drawChunk, drawFigureTurned, impactFrame } from "./_lib.js";
import { shots, GUARD, RUN, KICK, JAB, CROSS, KNEE, FLY, LAND, RECOIL, rival, jointOf, smear, hitSpark, RIVAL } from "./_taijutsu.js";

const BX = 112, DASH = 0.2, LAUNCH = 0.62, JUMP = 0.74, A1 = 0.9, A2 = 1.02, A3 = 1.14, SPINT = 1.3, AXE = 1.46, SLAM = 1.62, BOUNCE = 1.82, LANDT = 1.9, END = 3.1;

export const meta = {
  name: "Taijutsu: aerial combo",
  desc: "A rising kick launches the rival; the hero leaps after him for a jab, a cross and a knee in the air, then a spinning axe kick spikes him into the floor.",
  tags: ["taijutsu", "melee", "duel", "juggle", "one-shot"],
  size: [270, 200],
  origin: [50, 170],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 91 },
};

const RISEK = { crouch: 0, lean: -12, fx: -4, fy: -24, bx: -8, by: -26, ffx: 14, ffy: -36, fbx: -2, toeB: true };
const AIRJ = { ...JAB, crouch: 0, ffy: -8, fby: -12 }, AIRC = { ...CROSS, crouch: 0, ffy: -10, fby: -8 }, AIRK = { ...KNEE, crouch: 0, fby: -6 };
const AXEP = { crouch: 0, lean: 12, fx: -6, fy: -20, bx: -10, by: -24, ffx: 16, ffy: -4, fbx: -6, fby: -14, ghost: true };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.1, GUARD, "out"],
    [LAUNCH - 0.06, { ...RUN, x: 46 }],
    [LAUNCH, { ...RISEK, x: 52 }, "snap"],
    [JUMP, { ...GUARD, x: 54, crouch: 12 }, "out"],
    [A1 - 0.04, { ...AIRJ, x: 58, y: -30, fx: 4 }, "out"],
    [A1, { ...AIRJ, x: 60, y: -36 }, "snap"],
    [A2, { ...AIRC, x: 62, y: -46 }, "snap"],
    [A3, { ...AIRK, x: 64, y: -56 }, "snap"],
    [SPINT, { ...AXEP, x: 66, y: -66, lean: -10, ffy: -40 }, "out"],
    [AXE, { ...AXEP, x: 68, y: -58 }, "snap"],
    [LANDT, { ...LAND, x: 66, y: 0, crouch: 15 }, "in"],
    [END - 0.4, { ...GUARD, x: 62 }],
    [END, { ...GUARD, x: 62 }],
  ],
  hits: [
    { t: DASH, target: false, sfx: "step" },
    { t: LAUNCH, stop: 0.1, shake: 0.3, amp: 2, target: false, sfx: "kick" },
    { t: A1, stop: 0.04, shake: 0.1, amp: 1, target: false, sfx: "punch" },
    { t: A2, stop: 0.05, shake: 0.12, amp: 1, target: false, sfx: "punch" },
    { t: A3, stop: 0.07, shake: 0.2, amp: 2, target: false, sfx: "kick" },
    { t: SPINT, target: false, sfx: "whoosh" },
    { t: AXE, stop: 0.2, shake: 0.3, amp: 3, target: false, sfx: "heavy" },
    { t: SLAM, stop: 0.12, shake: 0.8, amp: 6, target: false, sfx: "explosion" },
    { t: LANDT, shake: 0.2, amp: 1, target: false, sfx: "land" },
  ],
  dust: [{ t: DASH, x: 4, n: 8, dir: -1 }, { t: JUMP, x: 54, n: 10 }, { t: SLAM, x: 80, n: 18, dir: 1 }, { t: SLAM, x: 64, n: 14, dir: -1 }],
};

export const camera = shots([
  [0, { z: 1.4, x: 60, y: -26 }],
  [LAUNCH, { z: 2.0, x: 70, y: -24, r: 2 }],
  [A1, { z: 1.8, x: 74, y: -50, r: -1 }, "cut"],
  [A3, { z: 1.9, x: 76, y: -64, r: 1 }],
  [AXE, { z: 2.4, x: 76, y: -60, r: -3 }, "cut"],
  [SLAM, { z: 1.5, x: 74, y: -30, r: 0 }, "cut"],
  [END, { z: 1.25, x: 70, y: -26 }],
]);

// the rival: launched up off his feet, lifted by each blow, turned over at the top, spiked into the floor, a bounce
const B = rival([
  [-0.25, READY],
  [0.1, { ...GUARD, x: 30 }, "out"],
  [LAUNCH - 0.02, { ...GUARD, x: 34, lean: 6 }],
  [LAUNCH, { ...FLY, x: 32, y: -10 }, "snap"],
  [A1, { ...FLY, x: 28, y: -40 }, "out"],
  [A2, { ...RECOIL, x: 26, y: -52 }, "snap"],
  [A3, { ...FLY, x: 24, y: -64 }, "snap"],
  [AXE, { ...FLY, x: 22, y: -74 }, "out"],
  [SLAM, { ...FLY, x: 22, y: 0 }, "in"],
  [BOUNCE, { ...FLY, x: 18, y: -12 }, "out"],
  [BOUNCE + 0.2, { ...LAND, x: 16, y: 0, crouch: 15 }, "in"],
  [END - 0.3, { ...LAND, x: 14 }],
], BX);
// his turn in the air: over once from the launch to the top, then head first down
const spinOf = (t) => (t < LAUNCH ? 0 : t < AXE ? -ease.inOutCubic(smooth(LAUNCH, AXE, t)) * Math.PI * 2.5 : t < BOUNCE ? -Math.PI * 2.5 : -Math.PI * 2.5 - smooth(BOUNCE, BOUNCE + 0.2, t) * Math.PI * 1.5);
const rJ = (n) => (t) => { const s = B(t); return jointOf(s.q, n, s.x, s.y, -1); };

export const create = play([], () => ({
  drawBack(p, t) {
    const s = B(t), a = spinOf(t);
    p.ellipse(s.x, 0.5, 10 - Math.min(6, Math.abs(s.y) * 0.1), 1.5, hex("#08060c"), 0.5);
    if (Math.abs(a) < 0.01) drawFigureTurned(p, s.q, s.x, s.y, s.x, s.y - 20, 0, { face: -1, tint: RIVAL, k: 0.38 });
    else drawFigureTurned(p, s.q, s.x, s.y, s.x, s.y - 20, a, { face: -1, tint: RIVAL, k: 0.38 });
    // the crack under the slam
    if (t > SLAM) { const k = 1 - smooth(END - 0.6, END, t); for (let i = 0; i < 6; i++) { const ang = Math.PI + (i / 5) * Math.PI; p.line(BX - 22, 0, BX - 22 + Math.cos(ang) * 24, Math.sin(ang) * 2, hex("#100c14"), k); } }
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    if (t > LAUNCH - 0.08 && t < LAUNCH + 0.03) smear(p, at("footN"), t, { w: 5 });
    if (t > LAUNCH) hitSpark(p, ...bodyAt(act.poses, LAUNCH).footN, t - LAUNCH, { dir: 1 });
    for (const [h, n, big] of [[A1, "handN", false], [A2, "handF", false], [A3, "footN", true]]) {
      if (t > h - 0.06 && t < h + 0.03) smear(p, at(n), t, { w: big ? 5 : 3 });
      if (t > h) hitSpark(p, ...bodyAt(act.poses, h)[n], t - h, { big });
    }
    if (t > SPINT - 0.1 && t < AXE + 0.03) smear(p, at("footN"), t, { w: 6, n: 10 });
    if (t > AXE) hitSpark(p, ...bodyAt(act.poses, AXE).footN, t - AXE, { big: true });
    if (t > SLAM && t < SLAM + 1) for (let i = 0; i < 8; i++) { const a = t - SLAM, x = BX - 22 + (rand(i, 2) - 0.5) * 30 + (rand(i, 3) - 0.5) * a * 120, y = -2 - 60 * a + 120 * a * a * rand(i, 4); if (y < 0) drawChunk(p, x, y, 2 + rand(i, 5) * 2, a * 8 + i, ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex)); }
    void clamp; void WHITE; void KICK; void rJ;
  },
}));
