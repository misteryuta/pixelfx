// Jashin's curse ritual (Hidan of the Akatsuki). The Jashin ritual: Hidan gets a taste of the target's blood (the tip
// of his three-bladed scythe nicks it), licks it, and draws Jashin's symbol on the ground in his own blood: a circle
// with an inverted triangle inside; standing in it his skin turns black with white skeleton markings and he is linked
// to the target; any wound he gives himself, the target receives. Here: he whips the scythe out on its cable; a nick, a
// drop of blood on the blade; he licks it; draws the circle and triangle with his foot; his skin goes black, the white
// bones of a skeleton painted over it; he raises a long black spike and drives it into his own chest: the target
// jolts, a wound opens at the same place on it, red light; Hidan laughs (he can't die).
// New: the scythe on its cable, the blood circle and triangle, the skeleton skin, the mirrored wound.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const WHIP = 0.35, NICK = 0.6, BACKS = 0.85, LICK = 1.05, DRAW0 = 1.4, DRAW1 = 1.95, SKIN = 2.1, RAISE = 2.45, STAB = 2.65, LAUGH = 3.0, END = 4.2, TX = 170;
const BLOOD = ["#3a0408", "#8a0a14", "#d01a2a"].map(hex), STEEL = ["#5a3040", "#c83848", "#ffb0b8"].map(hex), INK = hex("#0c080a");

export const meta = {
  name: "Jashin ritual",
  desc: "Hidan: his three-bladed scythe whips out on its cable and nicks the target; he licks the blood, draws Jashin's circle and triangle on the ground, his skin turning black with white bones; he drives a spike into his own chest and the target takes the wound.",
  tags: ["jutsu", "hidan", "akatsuki", "curse", "ritual", "one-shot"],
  size: [290, 190],
  origin: [56, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0408", "#8a0a14", "#d01a2a", "#ffb0b8"], seed: 148 },
};

const THROWP = { ...READY, crouch: 5, lean: 10, fx: 24, fy: -30, bx: -6, by: -20, ffx: 11, fbx: -10 };
const LICKP = { ...READY, crouch: 2, lean: -2, fx: 6, fy: -32, bx: -4, by: -20, ffx: 7, fbx: -7 };
const DRAWP = { ...READY, crouch: 4, lean: 4, fx: 6, fy: -20, bx: -6, by: -20, ffx: 16, ffy: -1, fbx: -8 };
const SPIKE = { ...READY, crouch: 6, lean: -6, armsFront: true, fx: 4, fy: -40, bx: 6, by: -40, ffx: 8, fbx: -8 };
const STABP = { ...READY, crouch: 9, lean: 10, armsFront: true, fx: 6, fy: -24, bx: 7, by: -24, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [WHIP, THROWP, "out"],
    [BACKS, { ...THROWP, lean: 2, fx: 10, fy: -24 }, "out"],
    [LICK, LICKP, "out"],
    [DRAW0, DRAWP, "out"],
    [DRAW1, { ...DRAWP, ffx: -6, fbx: 12 }],
    [RAISE, SPIKE, "out"],
    [STAB, STABP, "in"],
    [LAUGH, { ...STABP, lean: -10, crouch: 4 }, "out"],
    [END, { ...STABP, lean: -6 }],
  ],
  hits: [
    { t: WHIP, target: false, sfx: "whoosh" },
    { t: NICK, stop: 0.06, shake: 0.1, amp: 1, push: 1, straw: 4, flash: 0.03, sfx: "parry" },
    { t: SKIN, stop: 0.06, shake: 0.3, amp: 1, target: false, sfx: "cast" },
    { t: STAB, stop: 0.3, shake: 0.6, amp: 4, push: 3, straw: 30, skin: "red", shiver: 0.8, sfx: "heavy" },
    { t: STAB + 0.8, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const CC = [4, 0];
  return {
    update(t, dt) {
      if (t >= STAB && !this.s) { this.s = 1; lights.add(TX, -30, 100, BLOOD[2], 1, 0.3); for (let i = 0; i < 12; i++) ps.spawn(P.SPARK, TX + 2, -32, R.range(-80, 80), -R.range(20, 120), R.range(0.2, 0.4), BLOOD[R.int(1, 2)]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the symbol of Jashin in blood: the circle drawn round him by his foot, then the triangle inside it
      if (t > DRAW0) {
        const u = smooth(DRAW0, DRAW1, t), k = 1 - smooth(END - 0.3, END, t);
        for (let a = 0; a < TAU * Math.min(1, u * 1.4); a += 0.06) p.px(CC[0] + Math.cos(a) * 22, CC[1] + Math.sin(a) * 3, BLOOD[1], k);
        if (u > 0.7) { const v = smooth(0.7, 1, u); const pts = [[CC[0] - 19, -1.5], [CC[0] + 19, -1.5], [CC[0], 2.5]]; p.line(pts[0][0], pts[0][1], pts[0][0] + (pts[1][0] - pts[0][0]) * v, pts[0][1], BLOOD[1], k); if (v > 0.5) { p.line(pts[1][0], pts[1][1], pts[2][0], pts[2][1], BLOOD[1], k); p.line(pts[2][0], pts[2][1], pts[0][0], pts[0][1], BLOOD[1], k); } }
        if (t > SKIN) p.ellipse(CC[0], 0, 24, 3.5, BLOOD[2], 0.25 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "akatsuki", t0: 0.04, t1: WHIP, label: "JASHIN", head: b.head });
      // the scythe on its cable: out to the target, the nick, back to his hand
      if (t > WHIP && t < BACKS + 0.15) {
        const u = t < NICK ? ease.outQuad((t - WHIP) / (NICK - WHIP)) : 1 - ease.inQuad(clamp((t - NICK) / (BACKS + 0.15 - NICK))), [hx, hy] = b.handN, x = hx + (TX - 8 - hx) * u, y = hy + (-30 - hy) * u - Math.sin(u * Math.PI) * 14;
        p.line(hx, hy, x, y, hex("#3a3a48"));
        for (let i = 0; i < 3; i++) { const a = t * 20 + i * 2.1; p.beam(x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 1.6, STEEL[1]); }
        if (t > NICK) p.px(x + 2, y + 2, BLOOD[2]);
      }
      // licking the blood off the blade
      if (t > LICK - 0.1 && t < DRAW0) { const [hx, hy] = b.handN; for (let i = 0; i < 3; i++) p.beam(hx, hy, hx + Math.cos(i * 2.1) * 5, hy + Math.sin(i * 2.1) * 5, 1.4, STEEL[1]); p.px(b.head[0] + 4, b.head[1] + 3, hex("#c84a6a")); }
      // the skeleton skin: black over him, white bones painted on top
      if (t > SKIN) {
        const k = smooth(SKIN, SKIN + 0.2, t);
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: INK, k: 0.85 * k });
        const [hx, hy] = b.head, [cx, cy] = b.chest;
        p.circle(hx + 1, hy - 1, 2.2, WHITE, k); p.px(hx, hy - 1, INK, k); p.px(hx + 2, hy - 1, INK, k);
        for (let i = 0; i < 4; i++) p.line(cx - 4, cy - 4 + i * 3, cx + 4, cy - 4 + i * 3, WHITE, k);
        p.line(cx, cy - 6, cx, cy + 10, WHITE, k);
        p.line(b.handN[0], b.handN[1], b.chest[0] + 3, b.chest[1] - 4, WHITE, 0.6 * k);
      }
      // the spike: raised, driven into his own chest
      if (t > RAISE - 0.15 && t < END) { const [hx, hy] = b.handN, d = t < STAB ? -1.6 : 1.4; p.beam(hx, hy, hx + Math.cos(d) * 18, hy + Math.sin(d) * 18, 1.6, INK); p.line(hx, hy, hx + Math.cos(d) * 18, hy + Math.sin(d) * 18, hex("#5a5068")); }
      // the mirrored wound on the target, red light out of it
      if (t > STAB) { const k = 1 - smooth(STAB + 0.8, END, t); p.glow(TX + 2, -32, 11, BLOOD[2], 0.4 * k); p.circle(TX + 2, -32, 2, BLOOD[2], k); p.line(TX + 2, -32, TX + 3, -24, BLOOD[1], k); }
      // the laugh
      if (t > LAUGH && t < LAUGH + 0.8) p.text("HAHAHA", b.head[0] - 4, b.head[1] - 14, BLOOD[2], { font: "mini", align: "center", outline: INK, a: 1 - smooth(LAUGH + 0.5, LAUGH + 0.8, t) });
      void rand;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
