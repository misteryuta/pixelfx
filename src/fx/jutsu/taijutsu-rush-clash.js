// Taijutsu: rush and clash (after the reference fights: two shinobi running at each other, fists meeting, then a fast
// close exchange). They stand off, both break into a run, and their fists meet in the middle: impact frames, a ring of
// air, both thrown back skidding. The rival comes in with a high kick, blocked on the forearms; a jab, a cross, both
// parried; the rival's hook whips over the hero's head as he ducks, and from the duck he comes up with an uppercut that
// lifts the rival off his feet and sends him skidding away.
// New: the second fighter (_taijutsu.js), the exchange, the sparks and smears of every blow, sound tags on the beats.
import { READY, clamp, smooth, ease, hex, WHITE } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { shots } from "./_taijutsu.js";
import { GUARD, RUN, JAB, CROSS, KICK, BLOCK, PARRY, PARRY2, WIND, HAYMAKER, DUCK, UPPER, FLY, LAND, rival, drawRival, rivalGhosts, jointOf, smear, hitSpark, blockSpark, clashRing, speedLines } from "./_taijutsu.js";

const BX = 120, DASH = 0.35, CLASH = 0.8, KICKT = 1.6, JABT = 1.88, CROSST = 2.03, HOOK = 2.28, UPT = 2.47, LANDT = 2.97, END = 4.0;

export const meta = {
  name: "Taijutsu: rush clash",
  desc: "Two shinobi charge, fists meet in an impact flash and both skid back; a blocked high kick, a jab and a cross parried, a hook ducked, and an uppercut that sends the rival flying.",
  tags: ["taijutsu", "melee", "duel", "combo", "one-shot"],
  size: [270, 140],
  origin: [50, 112],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 81 },
};

export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [0.1, GUARD, "out"],
    [DASH, { ...RUN, x: 4 }, "snap"],
    [CLASH - 0.06, { ...RUN, x: 38 }],
    [CLASH, { ...CROSS, x: 44, ghost: true }, "out"],
    [CLASH + 0.35, { ...GUARD, x: 28, crouch: 9, lean: -4 }, "out"],
    [KICKT - 0.2, { ...GUARD, x: 34 }],
    [KICKT, { ...BLOCK, x: 36 }, "snap"],
    [KICKT + 0.15, { ...BLOCK, x: 31, lean: -5 }, "out"],
    [JABT - 0.06, { ...GUARD, x: 36 }],
    [JABT, { ...JAB, x: 40 }, "snap"],
    [CROSST - 0.05, { ...GUARD, x: 38 }],
    [CROSST, { ...CROSS, x: 42 }, "snap"],
    [HOOK - 0.08, { ...GUARD, x: 42 }],
    [HOOK - 0.02, { ...DUCK, x: 44 }, "snap"],
    [UPT - 0.06, { ...DUCK, x: 48, crouch: 16 }],
    [UPT, { ...UPPER, x: 52, ghost: true }, "snap"],
    [UPT + 0.3, { ...UPPER, x: 52, lean: 2 }],
    [LANDT + 0.3, { ...GUARD, x: 44 }],
    [END, { ...GUARD, x: 44 }],
  ],
  hits: [
    { t: DASH, target: false, sfx: "step" },
    { t: CLASH, stop: 0.2, shake: 0.45, amp: 4, target: false, sfx: "clash" },
    { t: KICKT - 0.08, target: false, sfx: "whoosh" },
    { t: KICKT, stop: 0.08, shake: 0.18, amp: 2, target: false, sfx: "block" },
    { t: JABT, stop: 0.04, shake: 0.08, amp: 1, target: false, sfx: "parry" },
    { t: CROSST, stop: 0.04, shake: 0.08, amp: 1, target: false, sfx: "parry" },
    { t: HOOK, target: false, sfx: "whoosh" },
    { t: UPT, stop: 0.22, shake: 0.5, amp: 4, target: false, sfx: "heavy" },
    { t: LANDT, shake: 0.15, amp: 2, target: false, sfx: "land" },
  ],
  dust: [{ t: DASH, x: 2, n: 8, dir: -1 }, { t: CLASH + 0.05, x: 30, n: 10, dir: -1 }, { t: UPT, x: 50, n: 6, dir: -1 }],
};

// the camera: wide on the stand-off, pushing in as they run, a cut to the fists meeting, close on the exchange, a cut
// to the uppercut from low, then out wide as the rival flies
export const camera = shots([
  [0, { z: 1.05, x: 60, y: -26, r: 0 }],
  [DASH, { z: 1.1, x: 60, y: -26 }],
  [CLASH - 0.08, { z: 1.55, x: 60, y: -27 }],
  [CLASH, { z: 2.5, x: 60, y: -27, r: -3 }, "cut"],
  [CLASH + 0.3, { z: 2.3, x: 60, y: -27, r: -2 }],
  [CLASH + 0.36, { z: 1.5, x: 58, y: -26, r: 0 }, "cut"],
  [KICKT - 0.12, { z: 1.6, x: 54, y: -30 }],
  [KICKT, { z: 2.1, x: 50, y: -32, r: 2 }, "cut"],
  [KICKT + 0.22, { z: 1.8, x: 56, y: -28, r: 0 }],
  [JABT, { z: 2.0, x: 62, y: -28 }],
  [CROSST, { z: 2.15, x: 62, y: -28, r: -1 }],
  [HOOK - 0.06, { z: 1.9, x: 56, y: -22, r: 0 }],
  [HOOK + 0.05, { z: 2.2, x: 54, y: -18, r: 3 }],
  [UPT, { z: 2.7, x: 68, y: -38, r: -4 }, "cut"],
  [UPT + 0.22, { z: 2.4, x: 70, y: -40, r: -3 }],
  [UPT + 0.3, { z: 1.25, x: 82, y: -28, r: 0 }, "cut"],
  [LANDT, { z: 1.3, x: 86, y: -22 }],
  [END, { z: 1.1, x: 76, y: -24 }],
]);

const B = rival([
  [-0.25, READY],
  [0.1, GUARD, "out"],
  [DASH, { ...RUN, x: 4 }, "snap"],
  [CLASH - 0.06, { ...RUN, x: 38 }],
  [CLASH, { ...CROSS, x: 44, ghost: true }, "out"],
  [CLASH + 0.35, { ...GUARD, x: 28, crouch: 9, lean: -4 }, "out"],
  [KICKT - 0.22, { ...GUARD, x: 40, lean: -2 }],
  [KICKT, { ...KICK, x: 46 }, "out"],
  [KICKT + 0.2, { ...GUARD, x: 44 }],
  [JABT, { ...PARRY, x: 44 }, "snap"],
  [CROSST, { ...PARRY2, x: 44 }, "snap"],
  [HOOK - 0.1, { ...WIND, x: 44 }, "out"],
  [HOOK, { ...HAYMAKER, x: 48 }, "snap"],
  [UPT - 0.02, { ...HAYMAKER, x: 48, lean: 10 }],
  [UPT + 0.02, { ...FLY, x: 42, y: -6 }, "snap"],
  [UPT + 0.25, { ...FLY, x: 18, y: -16 }],
  [LANDT, { ...LAND, x: -2, y: 0 }, "in"],
  [LANDT + 0.25, { ...LAND, x: -10 }, "out"],
  [END - 0.3, { ...GUARD, x: -10 }],
  [END, { ...GUARD, x: -10 }],
], BX);
const rHand = (name) => (t) => {
  const s = B(t);
  return jointOf(s.q, name, s.x, s.y, -1);
};

export const create = play([], () => ({
  drawBack(p, t) {
    speedLines(p, -50, -70, 220, -4, t, smooth(DASH, DASH + 0.1, t) * (1 - smooth(CLASH - 0.05, CLASH + 0.05, t)), 1);
    if (t > DASH && t < CLASH) rivalGhosts(p, B, t);
    drawRival(p, B, t);
  },
  draw(p, t) {
    const b = bodyAt(act.poses, t), at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    // the smears of every blow
    if (t > CLASH - 0.1 && t < CLASH + 0.02) {
      smear(p, at("handF"), t);
      smear(p, rHand("handF"), t);
    }
    if (t > KICKT - 0.12 && t < KICKT + 0.04) smear(p, rHand("ankleN"), t, { w: 5 });
    if (t > JABT - 0.08 && t < JABT + 0.03) smear(p, at("handN"), t, { w: 3 });
    if (t > CROSST - 0.08 && t < CROSST + 0.03) smear(p, at("handF"), t, { w: 3 });
    if (t > HOOK - 0.1 && t < HOOK + 0.08) smear(p, rHand("handN"), t, { w: 5, n: 8 });
    if (t > UPT - 0.1 && t < UPT + 0.04) smear(p, at("handN"), t, { w: 6, n: 8 });
    // the clash: two impact frames, a ring of air
    const cx = 60, cy = -27;
    if (t >= CLASH && t < CLASH + 0.06) p.circle(cx, cy, 12, WHITE);
    clashRing(p, cx, cy, t - CLASH - 0.1);
    hitSpark(p, cx, cy, t - CLASH - 0.1, { big: true });
    // the kick on the guard, the parries, the uppercut on the jaw
    blockSpark(p, b.handN[0] + 2, b.handN[1], t - KICKT, { dir: -1 });
    if (t > JABT) blockSpark(p, ...bodyAt(act.poses, JABT).handN, t - JABT, { dir: -1, c: hex("#ffe8a0") });
    if (t > CROSST) blockSpark(p, ...bodyAt(act.poses, CROSST).handF, t - CROSST, { dir: -1, c: hex("#ffe8a0") });
    if (t >= UPT && t < UPT + 0.05) p.circle(...bodyAt(act.poses, UPT).handN, 9, WHITE);
    if (t > UPT) hitSpark(p, ...bodyAt(act.poses, UPT).handN, t - UPT - 0.05, { big: true });
    // the rival's skid when he lands
    if (t > LANDT && t < LANDT + 0.5) {
      const s = B(t), k = 1 - (t - LANDT) / 0.5;
      for (let i = 0; i < 4; i++) p.px(s.x + 6 + i * 3, -1 - (i % 2), hex("#c9bfb8"));
      p.line(s.x - 4, 0, s.x + 14 * k, 0, hex("#5a5468"), k);
    }
  },
}));
