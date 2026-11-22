// Limbo: Border Jail (Rinbo: Hengoku, Madara with the Rinnegan). Narutopedia: Madara projects shadows of himself into
// Limbo, an invisible world that coexists with ours and can't ordinarily be perceived; with two Rinnegan, up to four
// shadows, each with his own abilities; they strike targets, an inexplicable force knocking them down, and can't be
// harmed by ordinary means. Here: the Rinnegan in his forehead opens (the third eye, the tomoe); Madara stands still,
// arms folded; four times the air ripples and the target is struck from a different side by nothing at all: a fist
// that isn't there, a kick, a blow from above, a slam; we glimpse each shadow only as a ghost of his outline drawn in
// the dust, for a frame; the last blow drives the target into the floor; Madara never moves.
// New: the invisible strikes (warp ripples, outline glimpses drawn in the dust), the still Madara.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, drawOutline } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPENED = 0.6, BLOWS = [1.0, 1.35, 1.7, 2.1], END = 3.6, TX = 160;
const PU = ["#120a20", "#3a2a5a", "#8a7aa8", "#d8d0e8"].map(hex), DUST = hex("#b8a8c8");
// each shadow: where it stands relative to the target, which way it faces, the pose of the blow
const SH = [
  { dx: -22, face: 1, q: { ...READY, crouch: 6, lean: 12, fx: 24, fy: -28, bx: -8, by: -22, ffx: 12, fbx: -11 }, at: [-6, -30], push: 4 },
  { dx: 24, face: -1, q: { ...READY, crouch: 2, lean: -8, fx: 2, fy: -26, bx: -6, by: -24, ffx: 25, ffy: -27, fbx: -3 }, at: [6, -24], push: -4 },
  { dx: -10, face: 1, y: -46, q: { ...READY, crouch: 0, lean: 16, fx: 18, fy: -10, bx: 14, by: -12, ffx: 4, ffy: -12, fbx: -6, fby: -10 }, at: [0, -50], push: 2 },
  { dx: -20, face: 1, q: { ...READY, crouch: 12, lean: 18, fx: 22, fy: -10, bx: 18, by: -8, ffx: 12, fbx: -12 }, at: [-4, -16], push: 6 },
];

export const meta = {
  name: "Limbo: border jail",
  desc: "Madara's Rinnegan: arms folded, he never moves, but the target is struck again and again from every side by invisible shadows of him in Limbo: the air ripples, a ghost of his outline flickers in the dust for a frame, and the last blow drives it into the floor.",
  tags: ["jutsu", "madara", "rinnegan", "invisible", "melee", "one-shot"],
  size: [290, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#120a20", "#3a2a5a", "#8a7aa8", "#d8d0e8"], seed: 145 },
};

const FOLD = { ...READY, crouch: 0, lean: -2, armsFront: true, fx: 10, fy: -24, bx: 11, by: -23, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPENED, FOLD, "out"],
    [END, FOLD],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    ...BLOWS.map((t, i) => ({ t, stop: i === 3 ? 0.2 : 0.08, shake: i === 3 ? 0.7 : 0.3, amp: i === 3 ? 5 : 3, push: SH[i].push, straw: 16 + i * 8, flash: 0.04, sfx: i === 1 ? "kick" : "heavy" })),
  ],
  dust: BLOWS.map((t, i) => ({ t, x: TX + SH[i].dx, n: 10, dir: SH[i].face })),
};
// the last blow drives the target down
export const targetState = (t) => (t < BLOWS[3] ? null : { dy: 8 * Math.exp(-(t - BLOWS[3]) * 3), s: 1 - 0.12 * Math.exp(-(t - BLOWS[3]) * 4) });

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      BLOWS.forEach((bt, i) => { if (t >= bt && !this["b" + i]) { this["b" + i] = 1; for (let j = 0; j < 14; j++) ps.spawn(P.DUST, TX + SH[i].dx + R.range(-10, 10), -R.range(0, 6), R.range(-40, 40), -R.range(10, 50), R.range(0.5, 0.9), DUST); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPENED - 0.05, label: "RINBO", head: b.head });
      drawGlint(p, t, "rinnegan", OPENED, END - 0.3, b.head);
      // the third eye on his forehead: the Rinnegan with its tomoe
      if (t > OPENED - 0.1) { const k = smooth(OPENED - 0.1, OPENED + 0.1, t); p.ellipse(hx + 1, hy - 4, 2.2, 1.4 * k + 0.2, hex("#c03040"), k); p.px(hx + 1, hy - 4, hex("#3a0a14"), k); }
      // each invisible blow: the air ripples where the shadow is, its outline flickers in the dust for an instant
      SH.forEach((s, i) => {
        const a = t - BLOWS[i];
        if (a < -0.15 || a > 0.35) return;
        const x = TX + s.dx, y = s.y ?? 0;
        if (a < 0.05) warp(p, x + s.at[0] * 0.5, y - 20, 22, 1.2 * (1 - Math.abs(a) / 0.15), 0.15);
        // the glimpse: the outline drawn by the dust it stirs, a frame either side of the blow
        if (Math.abs(a) < 0.06) drawOutline(p, { ...s.q }, x, y, PU[3], { w: 1, a: 0.7 * (1 - Math.abs(a) / 0.06), face: s.face, flick: t * 30 });
        // the impact: a ring of force on the target where the blow lands
        if (a > 0 && a < 0.25) { const u = a / 0.25, px = TX + s.at[0], py = s.at[1]; p.ring(px, py, 4 + 22 * u, 2, WHITE, 1 - u); p.ellipse(px, py, 3 + 6 * u, 10 + 10 * u, (d) => (d > 0.8 ? PU[3] : 0), 1 - u); }
      });
      // the floor cracking under the last
      if (t > BLOWS[3]) { const k = 1 - smooth(END - 0.6, END, t); for (let i = 0; i < 6; i++) { const ang = Math.PI + (i / 5) * Math.PI; p.line(TX, 0, TX + Math.cos(ang) * 24, Math.sin(ang) * 2, hex("#0c0810"), k); } }
      void rand; void clamp; void ease; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
