// Amenotejikara (Sasuke, with the Rinnegan in his left eye). Narutopedia: a space-time technique: Sasuke shifts
// himself between spaces, swapping places instantly with whatever occupies the space he targets; by swapping with a
// weapon, such as his sword, he can leave a trap for an approaching enemy or catch a powerful foe off guard. Here: the
// Rinnegan's six tomoe turn; he throws his sword, spinning, past the target, and it sticks in the floor behind it; a
// purple ripple at both places, and they have changed places: the sword is in his stance where he stood, and he is
// behind the target, in the sword's place, already drawing his second blade of chidori... (he catches the sword as it
// flies back to him across the swap) and cuts through the target from behind; one more ripple and he is home.
// New: the swap ripples (space folding at two points at once), the thrown sword, the Chidori-flowing blade.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawChidori, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, THROW = 0.6, STICK = 0.85, SWAP = 1.25, DRAW = 1.4, CUT = 1.62, SWAP2 = 2.25, END = 3.2, TX = 160, BEHIND = TX + 36;
const PU = ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"].map(hex), LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"].map(hex);
const STEEL = ["#4a5468", "#a4afc6", "#e8edf6"].map(hex);

export const meta = {
  name: "Amenotejikara",
  desc: "Sasuke's Rinnegan: he throws his sword past the target to stick in the floor behind it; a purple ripple at both places and they have changed places; from behind the target, his blade crackling with Chidori, he cuts through it, and swaps home again.",
  tags: ["jutsu", "sasuke", "rinnegan", "space-time", "teleport", "sword", "one-shot"],
  size: [300, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"], seed: 143 },
};

const TOSS = { ...READY, crouch: 5, lean: 10, fx: 24, fy: -30, bx: -6, by: -20, ffx: 11, fbx: -10 };
const HIDE = { ...READY, x: BEHIND, face: -1, crouch: 6, lean: 6, fx: 6, fy: -22, bx: 2, by: -22, ffx: 9, fbx: -9, gait: false };
const SLASH = { ...HIDE, x: BEHIND - 8, crouch: 9, lean: 14, fx: 24, fy: -20, bx: -8, by: -26 };
export const act = {
  target: { x: TX },
  ghost: "#c8a8ff",
  poses: [
    [-0.25, READY],
    [THROW - 0.12, { ...READY, crouch: 4, fx: -6, fy: -28, bx: 6, by: -22 }, "out"],
    [THROW, TOSS, "snap"],
    [SWAP - 0.02, { ...TOSS, lean: 4, fx: 14, fy: -24 }],
    [SWAP, HIDE, "snap"],
    [CUT - 0.06, { ...HIDE, fx: -6, fy: -34, lean: 2 }, "out"],
    [CUT, SLASH, "snap"],
    [SWAP2 - 0.02, { ...SLASH, lean: 8 }],
    [SWAP2, { ...READY, crouch: 3, gait: false }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    { t: THROW, target: false, sfx: "whoosh" },
    { t: STICK, stop: 0.03, target: false, sfx: "parry" },
    { t: SWAP, stop: 0.08, shake: 0.2, amp: 1, target: false, sfx: "whoosh" },
    { t: CUT, stop: 0.2, shake: 0.5, amp: 4, push: -5, straw: 40, skin: "shock", sfx: "heavy" },
    { t: SWAP2, target: false, sfx: "whoosh" },
    { t: CUT + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

function sword(p, x, y, a, k = 1) {
  const c = Math.cos(a), s = Math.sin(a);
  p.beam(x - c * 4, y - s * 4, x, y, 1.8, hex("#2a2230"), k);
  p.beam(x, y, x + c * 15, y + s * 15, 1.6, STEEL[1], k);
  p.line(x, y, x + c * 15, y + s * 15, STEEL[2], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the sword: thrown spinning past the target, stuck in the floor behind it; at the swap it stands where he stood
  const swordAt = (t) => {
    if (t < THROW) return null;
    if (t < STICK) { const u = (t - THROW) / (STICK - THROW); return { x: 20 + (BEHIND - 20) * u, y: -30 + 26 * u * u - Math.sin(u * Math.PI) * 14, a: t * 30 }; }
    if (t < SWAP) return { x: BEHIND, y: -6, a: -2.0 };
    if (t < SWAP2) return { x: 6, y: -6, a: -2.0 };
    return null;
  };
  return {
    update(t, dt) {
      if (t >= SWAP && !this.s) { this.s = 1; lights.add(BEHIND, -20, 80, PU[3], 1, 0.2); lights.add(4, -20, 80, PU[3], 1, 0.2); }
      if (t >= CUT && !this.c) { this.c = 1; lights.add(TX, -26, 120, LT[3], 1, 0.3); for (let i = 0; i < 18; i++) ps.spawn(P.SPARK, TX, -26, -R.range(40, 200), R.range(-80, 80), R.range(0.1, 0.25), R.chance(0.5) ? WHITE : LT[3]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: THROW - 0.1, label: "AMENOTEJIKARA", head: b.head });
      drawGlint(p, t, "rinnegan", THROW - 0.1, END - 0.3, b.head);
      const sw = swordAt(t);
      if (sw) sword(p, sw.x, sw.y, sw.a);
      // the swap: space folds at both points at once, a purple ripple
      const ripple = (x, at) => { const a = t - at; if (a < -0.06 || a > 0.3) return; const u = clamp((a + 0.06) / 0.36), k = 1 - u; warp(p, x, -20, 22, 1.4 * k, 0.2 * k); p.ellipse(x, -20, 6 + 16 * u, 22 - 8 * u, (d) => (d > 0.8 ? PU[3] : 0), k); p.ellipse(x, -20, 3, 18 * k, PU[4], k); };
      ripple(BEHIND, SWAP); ripple(4, SWAP);
      ripple(BEHIND - 8, SWAP2); ripple(4, SWAP2);
      // his blade crackling with Chidori after the swap, and the cut through the target from behind
      if (t > SWAP && t < SWAP2) {
        const [hx, hy] = b.handN, a = t < CUT ? -1.8 : Math.PI - 0.5;
        sword(p, hx, hy, a);
        drawChidori(p, hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, t, LT, 0.6, 3);
      }
      if (t > CUT - 0.04 && t < CUT + 0.25) { const u = clamp((t - CUT + 0.04) / 0.29); p.arc(TX + 10, -28, 24, 2, Math.PI * 0.55, Math.PI * (0.55 + 0.9 * Math.min(1, u * 3)), LT[4], 1 - u); p.arc(TX + 10, -28, 24, 1, Math.PI * 0.55, Math.PI * (0.55 + 0.9 * Math.min(1, u * 3)), WHITE, 1 - u); }
      void rand; void ease; void TAU; void f;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
