// Suiken (Drunken Fist, Rock Lee). Narutopedia: Lee has an extreme intolerance to alcohol: one sip and he turns into a
// Drunken Fist master, wildly unpredictable, swaying and stumbling into blows no one can read (even Gaara's sand
// can't keep up), until he passes out. Here: a sip from a small sake cup, a hiccup; his cheeks flush red; he sways and
// staggers forward in a zigzag, his stance lolling; a lurching backhand out of a stumble; he topples backwards and
// kicks up out of the fall; two loose spinning sweeps; a dizzy pause, a hiccup, then a sudden headlong lunge into an
// elbow that blows the target away; he wobbles, grins, hiccups again.
// New: the swaying, irregular rhythm (keys at uneven beats), the cup, the flushed face, the hiccups, the loose
// trailing smears.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { smear, hitSpark, speedLines, KICK, LOWKICK } from "./_taijutsu.js";

const SIP = 0.25, HIC1 = 0.6, STAG = 0.8, BACKH = 1.55, TOPPLE = 1.7, UPKICK = 1.86, SW1 = 2.15, SW2 = 2.35, DIZZY = 2.55, HIC2 = 2.7, LUNGE = 2.95, ELBOW = 3.07, END = 4.4, TX = 150;
const FLUSH = hex("#e0506a"), GREEN = hex("#6cb83a"), CUP = hex("#e8e0c8");

export const meta = {
  name: "Drunken fist",
  desc: "Rock Lee: one sip of sake and a hiccup, his cheeks flush; he sways and staggers forward in a zigzag, a lurching backhand, a fall that turns into a kick, loose spinning sweeps, a dizzy hiccup, then a sudden lunging elbow that blows the target away.",
  tags: ["jutsu", "lee", "taijutsu", "drunken-fist", "melee", "combo", "one-shot"],
  size: [240, 170],
  origin: [50, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#123818", "#2f7a2a", "#6cb83a", "#e0506a"], seed: 153 },
};

const SIPP = { ...READY, crouch: 2, lean: -8, fx: 6, fy: -33, bx: -4, by: -20, ffx: 7, fbx: -7 };
const LOLL = { ...READY, crouch: 3, lean: 10, fx: 8, fy: -14, bx: 12, by: -16, ffx: 6, fbx: -10 };
const LOLLB = { ...LOLL, lean: -9, fx: 2, fy: -18, bx: -4, by: -14 };
const BACKHAND = { ...READY, gait: false, crouch: 6, lean: 16, fx: 26, fy: -30, bx: -4, by: -16, ffx: 14, fbx: -6, twist: 3 };
const FALL = { ...READY, gait: false, crouch: 9, lean: -12, fx: -8, fy: -12, bx: -10, by: -10, ffx: 10, ffy: -4, fbx: -4 };
const UPK = { ...KICK, gait: false, lean: -12, ffx: 23, ffy: -30 };
const SWEEP = { ...LOWKICK, gait: false, crouch: 10 };
const ELB = { ...READY, gait: false, crouch: 6, lean: 16, fx: 14, fy: -30, bx: 4, by: -22, ffx: 16, fbx: -12, twist: 2, ghost: true };
const X = (v) => TX - v;
export const act = {
  target: { x: TX },
  ghost: "#6cb83a",
  poses: [
    [-0.25, READY],
    [SIP, SIPP, "out"],
    [HIC1, { ...SIPP, crouch: 4, lean: -4 }, "snap"],
    [HIC1 + 0.12, { ...SIPP, lean: -10 }, "out"],
    // the stagger: the body lolls forwards and back at uneven beats while he zigzags in
    [STAG, { ...LOLL, x: 0 }, "out"],
    [STAG + 0.22, { ...LOLLB, x: X(118) }],
    [STAG + 0.37, { ...LOLL, x: X(98), lean: 12 }],
    [STAG + 0.62, { ...LOLLB, x: X(66) }],
    [BACKH - 0.1, { ...LOLLB, x: X(34), lean: -11 }, "out"],
    [BACKH, { ...BACKHAND, x: X(26) }, "snap"],
    [TOPPLE, { ...FALL, x: X(32) }, "in"],
    [UPKICK, { ...UPK, x: X(24) }, "snap"],
    [SW1 - 0.08, { ...LOLL, x: X(22), crouch: 12, yaw: 0 }, "out"],
    [SW1, { ...SWEEP, x: X(20), yaw: Math.PI * 1.2 }, "line"],
    [SW2, { ...SWEEP, x: X(20), yaw: Math.PI * 2.4 }, "line"],
    [DIZZY, { ...LOLLB, x: X(30), yaw: Math.PI * 2, lean: -12 }, "out"],
    [HIC2, { ...LOLL, x: X(36), lean: 10, yaw: Math.PI * 2 }, "snap"],
    [LUNGE, { ...LOLL, x: X(40), crouch: 10, lean: 16, yaw: Math.PI * 2 }, "out"],
    [ELBOW, { ...ELB, x: X(20), yaw: Math.PI * 2 }, "snap"],
    [ELBOW + 0.5, { ...LOLLB, x: X(22), yaw: Math.PI * 2 }, "out"],
    [END - 0.5, { ...LOLL, x: X(24), yaw: Math.PI * 2 }],
    [END, { ...LOLLB, x: X(24), yaw: Math.PI * 2 }],
  ],
  hits: [
    { t: HIC1, target: false, sfx: "step" },
    { t: BACKH, stop: 0.08, shake: 0.2, amp: 2, push: 3, straw: 14, sfx: "punch" },
    { t: UPKICK, stop: 0.1, shake: 0.3, amp: 2, push: 2, straw: 18, sfx: "punch" },
    { t: SW1, stop: 0.04, push: 2, straw: 8, sfx: "whoosh" },
    { t: SW2, stop: 0.06, shake: 0.2, amp: 1, push: 3, straw: 12, sfx: "punch" },
    { t: HIC2, target: false, sfx: "step" },
    { t: ELBOW, stop: 0.2, shake: 0.6, amp: 5, push: 22, straw: 40, flash: 0.06, sfx: "heavy" },
  ],
  dust: [{ t: TOPPLE, x: X(32), n: 6 }, { t: SW2, x: X(20), n: 8 }, { t: LUNGE, x: X(40), n: 6, dir: -1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      if (t >= ELBOW && !this.e) { this.e = 1; for (let i = 0; i < 10; i++) ps.spawn(P.SPARK, TX, -26, R.range(40, 160), R.range(-80, 20), R.range(0.2, 0.4), WHITE); }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "youth", t0: 0.04, t1: SIP, label: "SUIKEN", head: b.head });
      // the sake cup
      if (t < STAG) { const [x, y] = b.handN; p.rect(x - 1, y - 2, 3, 2, CUP); if (t < SIP + 0.1) p.px(x, y - 2, hex("#c0d8ff")); }
      // the flush on his cheeks, wobbling a little with him
      if (t > SIP + 0.15) { const k = smooth(SIP + 0.15, HIC1, t); p.px(hx + 2, hy + 1, FLUSH, k); p.px(hx - 1, hy + 1, FLUSH, k); p.px(hx + 2, hy, FLUSH, 0.5 * k); }
      // the hiccups
      for (const h of [HIC1, HIC2, END - 0.45]) if (t > h && t < h + 0.45) { const v = (t - h) / 0.45; p.text("HIC", hx + 6, hy - 8 - v * 6, FLUSH, { font: "mini", align: "center", outline: hex("#120c18"), a: 1 - smooth(0.6, 1, v) }); p.circle(hx + 1 + v * 3, hy - 4 - v * 8, 1.5, WHITE, 0.6 * (1 - v)); }
      // dizzy swirls over his head while he lolls
      if (t > DIZZY - 0.1 && t < LUNGE) for (let i = 0; i < 3; i++) { const a = t * 9 + i * 2.1; p.px(hx + Math.cos(a) * 5, hy - 7 + Math.sin(a) * 1.5, hex("#ffd040")); }
      // loose, lazy smears on the strikes (the limbs flail rather than snap)
      if (t > BACKH - 0.05 && t < BACKH + 0.12) smear(p, (tt) => bodyAt(act.poses, tt).handN, t, { n: 7, w: 3, c: WHITE, c2: GREEN });
      if (t > UPKICK - 0.05 && t < UPKICK + 0.12) smear(p, (tt) => bodyAt(act.poses, tt).footN, t, { n: 7, w: 3, c: WHITE, c2: GREEN });
      if (t > SW1 - 0.1 && t < SW2 + 0.1) smear(p, (tt) => bodyAt(act.poses, tt).footN, t, { n: 8, w: 3, c: WHITE, c2: GREEN });
      if (t > LUNGE && t < ELBOW + 0.05) speedLines(p, b.chest[0] - 40, b.chest[1] - 8, b.chest[0] - 4, b.chest[1] + 8, t, smooth(LUNGE, ELBOW, t), -1);
      for (const [h, big] of [[BACKH, 0], [UPKICK, 0], [SW2, 0], [ELBOW, 1]]) if (t > h && t < h + 0.3) hitSpark(p, TX - 4, h === SW2 ? -6 : h === UPKICK ? -34 : -26, t - h, { big: !!big });
      void rand; void clamp; void ease;
      ps.draw(p, "front");
    },
  };
});
