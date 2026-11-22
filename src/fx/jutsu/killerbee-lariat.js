// Raiton: Rariatto (Lightning Release: Lariat, Killer B with the Eight-Tails' cloak). Narutopedia: a charging clothesline
// wrapped in lightning chakra, the Raikage brothers' signature (their Double Lariat); B uses it in the Eight-Tails'
// Version 1 cloak, the chakra shroud with horns, rapping as he goes. Here: B in his shades; "Yeah! Wheeee!"; the
// Eight-Tails' chakra cloak floods over him, two horns, a tentacle tail curling up behind; lightning sparks round his
// right arm; he charges with the arm out stiff, lowering his shoulder, and the lariat catches the target across the
// chest, flipping it backwards head over heels; he skids to a stop, rhyming.
// New: the Version 1 cloak (purple-red shroud, horns, tentacle tail), the lariat arm, the flipped target.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawOutline } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { speedLines } from "./_taijutsu.js";

const RAP = 0.2, CLOAK = 0.7, CHARGE = 1.1, HIT = 1.55, SKID = 1.9, END = 3.1, TX = 170;
const SH = ["#3a0a2a", "#8a1a4a", "#d84a7a", "#ffa0c0"].map(hex), LT = ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Lariat",
  desc: "Killer B: the Eight-Tails' chakra cloak floods over him, horns and a tentacle tail; lightning crackles round his arm and he charges, the stiff-armed lariat catching the target across the chest and flipping it head over heels.",
  tags: ["jutsu", "killer-b", "hachibi", "kumo", "lightning", "taijutsu", "melee", "one-shot"],
  size: [260, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0a2a", "#8a1a4a", "#d84a7a", "#ffa0c0"], seed: 190 },
};

const POSE = { ...READY, crouch: 4, lean: -4, fx: 18, fy: -34, bx: -4, by: -22, ffx: 9, fbx: -9 };
const RUN = { ...READY, crouch: 9, lean: 18, fx: 26, fy: -28, bx: -10, by: -18, ffx: 14, fbx: -14, ghost: true };
export const act = {
  target: { x: TX },
  ghost: "#d84a7a",
  poses: [
    [-0.25, READY],
    [RAP, POSE, "out"],
    [CLOAK, { ...POSE, crouch: 8 }],
    [CHARGE, RUN, "out"],
    [HIT, { ...RUN, x: TX - 24 }, "in"],
    [SKID, { ...RUN, x: TX + 20, lean: -6, crouch: 12, gait: false }, "out"],
    [END, { ...POSE, x: TX + 20, gait: false }],
  ],
  hits: [
    { t: RAP, target: false, sfx: "cast" },
    { t: CLOAK, stop: 0.08, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
    { t: CHARGE, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.26, shake: 1.0, amp: 6, push: 0, straw: 50, flash: 0.06, skin: "shock", sfx: "heavy" },
    { t: HIT + 1.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: CHARGE, x: 0, n: 10, dir: -1 }, { t: SKID, x: TX + 20, n: 14 }],
};
// flipped backwards head over heels
export const targetState = (t) => (t > HIT && t < HIT + 0.9 ? { rot: -TAU * ease.outCubic(clamp((t - HIT) / 0.7)), dy: -30 * Math.sin(Math.PI * clamp((t - HIT) / 0.7)) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -26, 110, LT[3], 0.6, 0.3); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      // the Version 1 cloak: a purple-red shroud traced round him, two horns, the tentacle tail curling up behind
      if (t > CLOAK) {
        const k = smooth(CLOAK, CLOAK + 0.15, t);
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, SH[2], { w: 2, a: k, flick: t * 16 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, SH[1], { w: 3, a: 0.6 * k, flick: t * 12 + 3 });
        const [cx, cy] = b.chest;
        let px = cx - 6, py = cy + 8;
        for (let i = 1; i <= 10; i++) { const u = i / 10, x = cx - 6 - 18 * u + Math.sin(t * 6 + u * 4) * 3, y = cy + 8 - 26 * u * u; p.beam(px, py, x, y, 5 - u * 3, SH[1], k); p.beam(px, py, x, y, 3 - u * 2, SH[2], k); px = x; py = y; }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head, f = Math.floor(t * 30);
      drawBadge(p, t, { kind: "kumo", t0: 0.04, t1: RAP, label: "LARIAT", head: b.head });
      // the shades, the horns of the cloak
      p.line(hx, hy - 1, hx + 4, hy - 1, hex("#1a1a1a"));
      if (t > CLOAK) { const k = smooth(CLOAK, CLOAK + 0.15, t); p.tri(hx - 3, hy - 5, hx - 1, hy - 5, hx - 6, hy - 12, SH[2], k); p.tri(hx + 1, hy - 5, hx + 3, hy - 5, hx + 1, hy - 13, SH[2], k); }
      if (t > RAP && t < CLOAK) p.text("WHEEE!", hx, hy - 16, SH[3], { font: "mini", align: "center", outline: SH[0] });
      if (t > SKID + 0.2 && t < END - 0.2) p.text("YEAH!", hx, hy - 16, SH[3], { font: "mini", align: "center", outline: SH[0] });
      // the lightning round the lariat arm
      if (t > CLOAK + 0.2 && t < HIT + 0.2 && f % 2) bolt(p, b.chest[0], b.chest[1] - 2, b.handN[0] + 4, b.handN[1], f, LT, { jag: 0.4, seed: f, glow: 0.2 });
      if (t > CHARGE && t < HIT) speedLines(p, b.chest[0] - 50, b.chest[1] - 12, b.chest[0] - 6, b.chest[1] + 12, t, 0.8, -1);
      if (t > HIT && t < HIT + 0.25) { const v = (t - HIT) / 0.25; p.ring(TX - 4, -30, 6 + 30 * v, 2, LT[3], 1 - v); }
      void rand; void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
