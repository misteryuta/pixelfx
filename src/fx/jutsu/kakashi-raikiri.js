// Raikiri (Lightning Cutter, Kakashi). Narutopedia: Kakashi's own Chidori; seals Ox, Hare, Monkey; it got its name when
// he used it to cut a bolt of lightning in two. Here: the three seals, the headband pushed up off his Sharingan (the
// scar across it), the lightning gathered in his hand held low and screaming like a thousand birds; a bolt falls from the
// sky at him and he cuts it in half with it, the halves forking away; then he runs, the hand ploughing a furrow, and
// drives it through the target.
// New: the split bolt, the furrow with sparks, the chirp. From _lib: the Chidori and bolts. From the library: crit hit.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, sealRun, drawSeals, bodyAt, bolt, drawChidori } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["ushi", "u", "saru"], 0.1, { hold: 0.18, kind: "lightning" });
const CHARGE = SEALS.end, SKY = CHARGE + 0.45, CUT = SKY + 0.08, RUN = CUT + 0.4, HIT = RUN + 0.26, TX = 160;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"];

export const meta = {
  name: "Lightning cutter",
  desc: "Kakashi: Ox, Hare, Monkey, the headband pushed off his Sharingan, lightning screaming in his low hand; a bolt falls at him from the sky and he cuts it in two, then runs ploughing a furrow and drives it through the target.",
  tags: ["jutsu", "kakashi", "lightning", "raiton", "sharingan", "move", "melee", "one-shot"],
  size: [290, 210],
  origin: [50, 176],
  duration: HIT + 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: LT, seed: 42 },
};

const LOW = { ...READY, crouch: 9, lean: 6, fx: 14, fy: -8, bx: 2, by: -22, ffx: 10, fbx: -9 };
const UP = { ...READY, crouch: 5, lean: -4, fx: 8, fy: -42, bx: -4, by: -22, ffx: 10, fbx: -9 };
const RUNP = { ...LOW, x: TX - 34, crouch: 10, lean: 16, fx: 16, fy: -6, bx: -8, by: -20, ffx: 12, fbx: -12, ghost: true };
const PIERCE = { ...READY, x: TX - 28, crouch: 7, lean: 12, fx: 22, fy: -26, bx: -8, by: -20, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  ghost: "#9adaff",
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [CHARGE + 0.1, LOW, "out"],
    [SKY - 0.02, UP, "out"],
    [CUT + 0.15, { ...UP, crouch: 8 }],
    [RUN, LOW, "out"],
    [HIT - 0.04, RUNP, "in"],
    [HIT, PIERCE, "snap"],
    [HIT + 0.6, { ...PIERCE, lean: 6 }],
    [meta.duration, { ...READY, x: TX - 30 }],
  ],
  hits: [
    { t: CUT, stop: 0.1, shake: 0.3, amp: 2, target: false },
    { t: HIT, stop: 0.16, shake: 0.4, amp: 3, push: 4, straw: 30, skin: "shock", shiver: 0.6 },
    { t: meta.duration - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RUN, x: 6, n: 8, dir: -1 }],
};

export const create = play([{ fx: crit, t: HIT, x: TX - 10, height: 25, aim: 0, palette: ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff", "#ffffff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let cut = false;
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the furrow: the hand dragging through the floor throws up grit and sparks
      if (t > RUN && t < HIT && R.chance(120 * dt)) {
        ps.spawn(P.GRIT, b.handN[0], -1, -R.range(30, 120), -R.range(30, 100), R.range(0.3, 0.6), hex(["#3a3048", "#5a4c66"][R.int(0, 1)]));
        ps.spawn(P.SPARK, b.handN[0], b.handN[1], -R.range(40, 140), -R.range(10, 80), R.range(0.1, 0.25), R.chance(0.5) ? WHITE : C[3]);
      }
      if (!cut && t >= CUT) {
        cut = true;
        lights.add(b.handN[0], b.handN[1], 100, C[3], 1, 0.2);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the furrow left in the floor, glowing out
      if (t > RUN) {
        const b = bodyAt(act.poses, Math.min(t, HIT)), k = 1 - smooth(HIT + 0.3, HIT + 1.2, t);
        p.line(16, 0, b.handN[0], 0, hex("#120c18"), k);
        p.line(16, -1, b.handN[0], -1, C[2], 0.6 * k * (1 - smooth(HIT, HIT + 0.5, t)));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "kakashi", t0: 0.05, t1: CHARGE, label: "SHARINGAN", head: b.head });
      drawGlint(p, t, "kakashi", CHARGE + 0.05, meta.duration - 0.4, b.head);
      // the headband, pushed up off the eye
      if (t > CHARGE) p.line(b.head[0] - 2, b.head[1] - 3, b.head[0] + 3, b.head[1] - 4, hex("#3a3a4a"));
      const [hx, hy] = b.handN;
      drawChidori(p, hx, hy, t, C, t < CHARGE ? 0 : smooth(CHARGE, CHARGE + 0.2, t) * (1 - smooth(HIT + 0.3, HIT + 0.6, t)) * 1.2, 5);
      // the chirp: little arcs of sound flicking off the hand
      if (t > CHARGE && t < HIT) for (let i = 0; i < 2; i++) {
        const ph = ((t * 5 + i * 0.5) % 1), a = -0.6 + i * 1.6;
        p.arc(hx, hy, 6 + ph * 14, 1, a - 0.4, a + 0.4, C[3], 1 - ph);
      }
      // the bolt from the sky: falls on him, meets the blade and splits, the halves forking off to either side
      if (t > SKY && t < CUT + 0.3) {
        const k = 1 - smooth(CUT + 0.05, CUT + 0.3, t);
        if (t < CUT) {
          const u = (t - SKY) / (CUT - SKY);
          bolt(p, hx + 30, -170, hx + (30 * (1 - u)), -170 + (hy + 170) * u, f, C, { jag: 0.12, glow: 0.6 });
        } else {
          bolt(p, hx + 30, -170, hx, hy - 2, f, C, { jag: 0.1, glow: 0.6 * k });
          bolt(p, hx, hy, hx - 40, 0, f + 3, C, { jag: 0.18, seed: 2, glow: 0.4 * k });
          bolt(p, hx, hy, hx + 44, 0, f + 5, C, { jag: 0.18, seed: 3, glow: 0.4 * k });
          if (t < CUT + 0.05) p.circle(hx, hy, 10, WHITE);
          p.ellipse(hx - 40, 0, 6, 1.5, C[3], k);
          p.ellipse(hx + 44, 0, 6, 1.5, C[3], k);
        }
      }
      // through the target: lightning bursting out of its back
      if (t > HIT && t < HIT + 0.5) {
        const k = 1 - smooth(HIT + 0.2, HIT + 0.5, t);
        for (let i = 0; i < 4; i++) bolt(p, TX + 4, -26, TX + 30 + rand(f, i) * 30, -26 + (rand(f, i + 4) - 0.5) * 40, f + i, C, { jag: 0.25, seed: i, glow: 0.3 * k });
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
