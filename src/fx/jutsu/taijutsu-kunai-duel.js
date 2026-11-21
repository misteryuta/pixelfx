// Taijutsu: kunai duel. Both draw kunai; they close and the blades meet three times, high, low, high, sparks off each
// clash; on the third they lock, straining, the blades grinding, faces close; the hero gives way an inch, twists, and
// the rival's kunai is wrenched out of his hand and spins away to stick quivering in the floor; a spinning back kick
// sends him sliding away.
// New: both fighters armed (the rig's dagger), the lock and the grind, the disarm with the kunai spinning off.
// From _taijutsu.js: rival, sparks, clash ring, smears, shots.
import { READY, smooth, ease, clamp, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { shots, GUARD, KICK, FLY, LAND, RECOIL, rival, drawRival, jointOf, smear, hitSpark, blockSpark, clashRing } from "./_taijutsu.js";

const BX = 110, DRAW = 0.2, C1 = 0.62, C2 = 0.82, C3 = 1.02, LOCK = 1.02, TWIST = 1.55, DISARM = 1.62, SPINK = 1.86, LANDT = 2.4, END = 3.2;

export const meta = {
  name: "Taijutsu: kunai duel",
  desc: "Both draw kunai; the blades meet high, low and high; on the third they lock and grind; the hero twists and the rival's kunai spins out of his hand into the floor, and a spinning back kick sends him sliding.",
  tags: ["taijutsu", "melee", "duel", "weapon", "kunai", "one-shot"],
  size: [270, 160],
  origin: [50, 132],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#6a3a20", "#c8502a", "#ffb060", "#fff0c0"], seed: 92 },
};

const K = { weapon: "dagger" };
const KG = { ...GUARD, ...K, sa: -0.6, fx: 12, fy: -24 };
const KHIGH = { ...GUARD, ...K, crouch: 4, lean: 10, fx: 22, fy: -30, sa: 0.2 };
const KLOW = { ...GUARD, ...K, crouch: 9, lean: 12, fx: 20, fy: -16, sa: -0.3 };
const KLOCK = { ...GUARD, ...K, crouch: 7, lean: 12, fx: 17, fy: -26, sa: 0.5, bx: 14, by: -22 };
const SPINKICK = { ...KICK, ...K, sa: -1.2, fx: -8, fy: -22, yaw: Math.PI * 2 };
export const act = {
  ghost: "#ffd8a0",
  poses: [
    [-0.25, READY],
    [DRAW, KG, "out"],
    [C1 - 0.12, { ...KG, x: 24 }],
    [C1, { ...KHIGH, x: 30 }, "snap"],
    [C2, { ...KLOW, x: 32 }, "snap"],
    [C3, { ...KLOCK, x: 34 }, "snap"],
    [TWIST - 0.05, { ...KLOCK, x: 33, crouch: 9, lean: 8 }],
    [TWIST, { ...KLOCK, x: 35, sa: 1.4, fy: -32, lean: 4 }, "snap"],
    [SPINK - 0.12, { ...KG, x: 36, yaw: Math.PI }, "out"],
    [SPINK, { ...SPINKICK, x: 40, yaw: 0 }, "snap"],
    [LANDT, { ...KG, x: 40 }, "out"],
    [END, { ...KG, x: 40 }],
  ],
  hits: [
    { t: DRAW, target: false, sfx: "parry" },
    { t: C1, stop: 0.06, shake: 0.12, amp: 1, target: false, sfx: "clash" },
    { t: C2, stop: 0.06, shake: 0.12, amp: 1, target: false, sfx: "clash" },
    { t: C3, stop: 0.14, shake: 0.2, amp: 2, target: false, sfx: "clash" },
    { t: DISARM, stop: 0.08, shake: 0.2, amp: 1, target: false, sfx: "parry" },
    { t: SPINK, stop: 0.18, shake: 0.5, amp: 4, target: false, sfx: "heavy" },
    { t: LANDT, shake: 0.15, amp: 1, target: false, sfx: "land" },
  ],
  dust: [{ t: SPINK, x: 54, n: 12, dir: 1 }, { t: LANDT, x: 100, n: 10, dir: 1 }],
};

export const camera = shots([
  [0, { z: 1.4, x: 56, y: -26 }],
  [C1, { z: 2.0, x: 64, y: -30, r: 1 }],
  [C2, { z: 2.1, x: 64, y: -22, r: -1 }],
  [C3, { z: 2.7, x: 66, y: -28, r: 0 }, "cut"],
  [TWIST, { z: 2.9, x: 66, y: -28, r: 2 }],
  [DISARM, { z: 1.7, x: 68, y: -30 }, "cut"],
  [SPINK, { z: 2.2, x: 66, y: -26, r: -3 }, "cut"],
  [SPINK + 0.25, { z: 1.4, x: 80, y: -26 }, "cut"],
  [END, { z: 1.3, x: 76, y: -26 }],
]);

const RK = { ...GUARD, ...K, sa: -0.6, fx: 12, fy: -24 };
const B = rival([
  [-0.25, READY],
  [DRAW, RK, "out"],
  [C1 - 0.12, { ...RK, x: 24 }],
  [C1, { ...KHIGH, x: 30 }, "snap"],
  [C2, { ...KLOW, x: 32 }, "snap"],
  [C3, { ...KLOCK, x: 34 }, "snap"],
  [TWIST, { ...KLOCK, x: 35, crouch: 8 }],
  [DISARM, { ...RECOIL, x: 33 }, "snap"],
  [SPINK, { ...RECOIL, x: 33 }],
  [SPINK + 0.04, { ...FLY, x: 26, y: -4 }, "snap"],
  [LANDT, { ...LAND, x: -10, y: 0 }, "in"],
  [END - 0.2, { ...GUARD, x: -14 }],
], BX);
const rJ = (n) => (t) => { const s = B(t); return jointOf(s.q, n, s.x, s.y, -1); };

export const create = play([], () => ({
  drawBack(p, t) {
    drawRival(p, B, t);
  },
  draw(p, t) {
    const at = (n) => (tt) => bodyAt(act.poses, tt)[n];
    // the clashes: a burst where the blades meet
    for (const [c, big] of [[C1, false], [C2, false], [C3, true]]) {
      const [hx, hy] = bodyAt(act.poses, c).handN, [rx, ry] = rJ("handN")(c), mx = (hx + rx) / 2 + 6, my = (hy + ry) / 2;
      if (t > c - 0.06 && t < c + 0.02) { smear(p, at("handN"), t, { w: 3 }); smear(p, rJ("handN"), t, { w: 3 }); }
      if (t > c) blockSpark(p, mx, my, t - c, { dir: 1, c: hex("#ffe8a0") });
      if (big) clashRing(p, mx, my, t - c);
    }
    // the lock: the blades grinding, sparks crawling along the edge
    if (t > LOCK && t < TWIST) {
      const [hx, hy] = bodyAt(act.poses, t).handN, f = Math.floor(t * 24);
      for (let i = 0; i < 3; i++) p.px(hx + 8 + rand(f, i) * 6, hy - 4 + rand(f, i + 3) * 4, i % 2 ? WHITE : hex("#ffd040"));
    }
    // the disarm: the rival's kunai spinning off up and away, sticking in the floor
    if (t > DISARM) {
      const u = clamp((t - DISARM) / 0.6), sx = BX - 40, x = sx - 40 * u, y = -30 - Math.sin(u * Math.PI) * 50 + 30 * u * u, a = u < 1 ? t * 20 : -2.0;
      const yy = u < 1 ? y : -3, c = Math.cos(a), s = Math.sin(a);
      p.beam(x - c * 4, yy - s * 4, x + c * 5, yy + s * 5, 1.4, hex("#e8edf6"));
      p.beam(x - c * 4, yy - s * 4, x - c * 7, yy - s * 7, 1.6, hex("#2a2230"));
      if (u >= 1 && t < DISARM + 0.9) p.arc(x, yy, 4, 1, -2.4, -1.6, WHITE, 1 - smooth(DISARM + 0.6, DISARM + 0.9, t));
    }
    // the spinning back kick
    if (t > SPINK - 0.1 && t < SPINK + 0.03) smear(p, at("footN"), t, { w: 6, n: 10 });
    if (t > SPINK) hitSpark(p, ...bodyAt(act.poses, SPINK).footN, t - SPINK, { big: true });
    void ease;
  },
}));
