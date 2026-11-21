// Taijutsu: substitution counter (Kawarimi no Jutsu). The rival rushes in and lands a big punch square on the hero,
// who folds round it; a puff of smoke, and it is a log the rival is punching, splinters flying; the rival freezes,
// looks round; a shadow falls over him; the hero drops out of the air behind him and brings his heel down on the
// back of his head, driving him face-first into the floor.
// New: the swap (poof, log, splinters), the hero's drop from above. From _taijutsu.js: rival, sparks, smears; _lib: poof.
import { READY, smooth, ease, clamp, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt, drawPoof, drawChunk } from "./_lib.js";
import { shots, GUARD, RUN, HAYMAKER, WIND, BLOCK, RECOIL, GUT, FLY, LAND, rival, drawRival, rivalGhosts, smear, hitSpark } from "./_taijutsu.js";

const BX = 118, RUSH = 0.25, PUNCH = 0.6, SWAP = 0.66, LOOK = 1.0, SHADOW = 1.3, DROP = 1.45, HEEL = 1.6, DOWN = 1.75, END = 3.0;
const WOOD = ["#2a1a0e", "#5a3a1e", "#8a5a2e", "#b8864a"].map(hex);

export const meta = {
  name: "Taijutsu: substitution counter",
  desc: "The rival's big punch lands square on the hero, a puff of smoke and it is a log; the rival freezes and looks round; the hero drops out of the air behind him and drives a heel into the back of his head.",
  tags: ["taijutsu", "melee", "duel", "kawarimi", "counter", "one-shot"],
  size: [270, 180],
  origin: [50, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 93 },
};

const HEELP = { crouch: 0, lean: 10, fx: -6, fy: -26, bx: -12, by: -22, ffx: 14, ffy: -6, fbx: -6, fby: -16, face: -1, gait: false };
// behind the rival: past him, facing back
const BEHIND = BX - 2;
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.15, { ...GUARD, x: 20 }, "out"],
    [PUNCH, { ...BLOCK, x: 22 }, "out"],
    [SHADOW, { ...HEELP, x: BEHIND, y: -70, lean: -10, ffy: -40 }, "snap"],
    [HEEL, { ...HEELP, x: BEHIND - 4, y: -26 }, "in"],
    [DOWN + 0.15, { ...LAND, face: -1, x: BEHIND - 6, y: 0, crouch: 15, gait: false }, "in"],
    [END - 0.4, { ...GUARD, face: -1, x: BEHIND - 6, gait: false }],
    [END, { ...GUARD, face: -1, x: BEHIND - 6, gait: false }],
  ],
  hits: [
    { t: RUSH, target: false, sfx: "step" },
    { t: PUNCH, stop: 0.12, shake: 0.3, amp: 2, target: false, sfx: "heavy" },
    { t: SWAP, target: false, sfx: "whoosh" },
    { t: HEEL, stop: 0.22, shake: 0.6, amp: 5, target: false, sfx: "heavy" },
    { t: DOWN, shake: 0.3, amp: 2, target: false, sfx: "land" },
  ],
  dust: [{ t: SWAP, x: 26, n: 10 }, { t: DOWN, x: BX - 40, n: 16, dir: -1 }],
};
// the swap: the hero is the log from the punch until he drops from above
export const actorAlpha = (t) => (t >= SWAP && t < SHADOW ? 0 : 1);

export const camera = shots([
  [0, { z: 1.4, x: 64, y: -26 }],
  [PUNCH, { z: 2.4, x: 40, y: -28, r: -2 }, "cut"],
  [SWAP + 0.1, { z: 2.2, x: 46, y: -26, r: 0 }],
  [LOOK, { z: 1.9, x: 60, y: -30, r: 0 }, "cut"],
  [SHADOW, { z: 1.7, x: 70, y: -50 }, "cut"],
  [HEEL, { z: 2.5, x: 70, y: -26, r: 3 }, "cut"],
  [DOWN + 0.2, { z: 1.4, x: 70, y: -24 }, "cut"],
  [END, { z: 1.3, x: 66, y: -24 }],
]);

const B = rival([
  [-0.25, READY],
  [RUSH, { ...RUN, x: 30 }, "out"],
  [PUNCH - 0.12, { ...WIND, x: 66 }],
  [PUNCH, { ...HAYMAKER, x: 72 }, "snap"],
  [LOOK - 0.1, { ...HAYMAKER, x: 72, lean: 6 }],
  [LOOK, { ...GUARD, x: 70, yaw: -0.6 }, "out"],
  [SHADOW + 0.05, { ...GUARD, x: 70, yaw: 0.6 }, "out"],
  [HEEL, { ...GUARD, x: 70, hy: -2 }],
  [HEEL + 0.02, { ...GUT, x: 72, crouch: 12, lean: 24 }, "snap"],
  [DOWN, { ...LAND, x: 76, y: 0, crouch: 16, lean: 26 }, "in"],
  [END - 0.2, { ...LAND, x: 76, crouch: 16, lean: 26 }],
], BX);

export const create = play([], () => {
  const chips = Array.from({ length: 12 }, (_, i) => ({ vx: (rand(i, 1) - 0.5) * 160, vy: -40 - rand(i, 2) * 140, s: 1.5 + rand(i, 3) * 2 }));
  return {
    drawBack(p, t) {
      drawRival(p, B, t);
      if (t > RUSH && t < PUNCH) rivalGhosts(p, B, t);
    },
    draw(p, t) {
      const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
      // the punch lands... on a log
      const hx = 26, hy = -26;
      if (t > PUNCH) hitSpark(p, hx + 4, hy, t - PUNCH, { big: true, dir: -1 });
      drawPoof(p, hx, -18, t - SWAP + 0.02, 1.2, 3);
      if (t > SWAP && t < SHADOW + 0.6) {
        const k = 1 - smooth(SHADOW, SHADOW + 0.6, t), lean = Math.min(1, (t - SWAP) * 3) * 0.3;
        // the log: a stump of wood standing where he was, then tipping over
        p.poly([[hx - 5, 0], [hx + 5, 0], [hx + 5 - lean * 30, -30], [hx - 5 - lean * 30, -30]], WOOD[1], k);
        p.poly([[hx - 2, 0], [hx + 2, 0], [hx + 2 - lean * 30, -30], [hx - 2 - lean * 30, -30]], WOOD[2], k);
        p.ellipse(hx - lean * 30, -30, 5, 2, WOOD[3], k);
        for (const c of chips) { const a = t - SWAP; if (a < 0.6) drawChunk(p, hx + c.vx * a, hy + c.vy * a + 250 * a * a, c.s, a * 9, WOOD, 1 - a / 0.6); }
      }
      // his shadow falling over the rival before the drop
      if (t > SHADOW - 0.1 && t < HEEL) p.ellipse(BEHIND - 10, 0.5, 10 * smooth(SHADOW - 0.1, HEEL, t), 1.8, hex("#08060c"), 0.6);
      if (t > DROP - 0.05 && t < HEEL + 0.03) smear(p, at("footN"), t, { w: 6, n: 8 });
      if (t > HEEL) hitSpark(p, ...bodyAt(act.poses, HEEL).footN, t - HEEL, { big: true });
      // the rival hitting the floor face first
      if (t > DOWN && t < DOWN + 0.3) { const u = (t - DOWN) / 0.3; p.ellipse(BX - 76 + 10, 0, 6 + 30 * u, 3, WHITE, 1 - u); }
      void ease; void clamp; void FLY; void RECOIL;
    },
  };
});
