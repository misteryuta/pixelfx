// Chidori Eisou (Chidori Sharp Spear, Sasuke). Narutopedia: the Chidori given a shape, a spear or blade of lightning
// reaching about five metres, for mid-range; once it pierces, the user can split it into more blades inside the
// target. Here: the Sharingan, the Chidori chirping in his hand, his arm thrust out and the lightning shoots out into a
// long straight spear that runs the target through, sprouts a burst of blades out of it, and draws back.
// New: the spear (_lib bolt along a straight line, a hard white core), the blades it splits into. From the library:
// the zap hit, where the spear goes in.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as zap from "../lightning/zap-hit.js";
import { play, sealRun, drawSeals, bodyAt, bolt, drawChidori } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["ushi", "u", "saru"], 0.1, { hold: 0.15, kind: "lightning" });
const CHIRP = SEALS.end, THRUST = CHIRP + 0.55, OUT = 0.08, SPLIT = THRUST + OUT + 0.08, BACK = SPLIT + 0.5, TX = 140;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"];

export const meta = {
  name: "Chidori sharp spear",
  desc: "Sasuke: the Sharingan, a Chidori chirping in his hand, thrust out into a long spear of lightning that runs the target through, splits into blades inside it and draws back.",
  tags: ["jutsu", "sasuke", "lightning", "raiton", "sharingan", "beam", "move", "one-shot"],
  size: [250, 140],
  origin: [46, 110],
  duration: BACK + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: LT, seed: 32 },
};

const HOLDC = { ...READY, crouch: 6, lean: 2, fx: -4, fy: -16, bx: 10, by: -24, ffx: 9, fbx: -9 };
const LUNGE = { ...READY, crouch: 7, lean: 10, fx: 21, fy: -26, bx: -6, by: -20, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [CHIRP + 0.1, HOLDC, "out"],
    [THRUST - 0.05, { ...HOLDC, crouch: 8, lean: -2 }],
    [THRUST, LUNGE, "snap"],
    [BACK, { ...LUNGE, lean: 8 }],
    [BACK + 0.3, { ...READY, crouch: 4 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: THRUST + OUT, stop: 0.12, shake: 0.25, amp: 2, push: 1.2, straw: 16, skin: "shock", shiver: 0.4 },
    { t: SPLIT, stop: 0.1, shake: 0.2, amp: 2, push: 0.8, straw: 22, shiver: 0.5 },
    { t: meta.duration - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: THRUST, x: 10, n: 6, dir: -1 }],
};

export const create = play([{ fx: zap, t: THRUST + OUT, x: TX - 6, y: -26, palette: ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let split = false;
  return {
    update(t, dt) {
      if (t > CHIRP && t < BACK && R.chance(40 * dt)) {
        const b = bodyAt(act.poses, t);
        ps.spawn(P.SPARK, b.handN[0], b.handN[1], R.range(-80, 80), R.range(-80, 40), R.range(0.08, 0.2), R.chance(0.5) ? WHITE : C[3]);
      }
      if (!split && t >= SPLIT) {
        split = true;
        lights.add(TX, -26, 70, C[3], 0.9, 0.2);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sharingan", t0: 0.05, t1: SEALS.end, label: "SHARINGAN", head: b.head });
      drawGlint(p, t, "sharingan", SEALS.end + 0.05, meta.duration - 0.4, b.head);
      const [hx, hy] = b.handN, f = Math.floor(t * 24);
      drawChidori(p, hx, hy, t, C, t < CHIRP ? 0 : smooth(CHIRP, CHIRP + 0.2, t) * (1 - smooth(BACK, BACK + 0.3, t)), 1);
      // the spear: out in a blink, a long hard line of lightning with a white core, thinning as it draws back
      if (t >= THRUST && t < BACK + 0.15) {
        const out = ease.outCubic(clamp((t - THRUST) / OUT)) * (1 - ease.inCubic(smooth(BACK - 0.05, BACK + 0.15, t)));
        const x1 = hx + (TX + 22 - hx) * out, y1 = hy + (-26 - hy) * out;
        p.glowLine(hx, hy, x1, y1, 12, C[2], 0.6);
        p.beam(hx, hy, x1, y1, 3, C[3]);
        p.line(hx, hy, x1, y1, WHITE);
        bolt(p, hx, hy, x1, y1, f, C, { jag: 0.06, glow: 0 });
        bolt(p, hx, hy - 1, x1, y1 + 1, f + 9, C, { jag: 0.05, seed: 4, glow: 0 });
        p.tri(x1 + 5, y1, x1 - 2, y1 - 2.5, x1 - 2, y1 + 2.5, WHITE);
      }
      // the split: blades bursting out of the spear inside the target in every direction
      if (t >= SPLIT && t < SPLIT + 0.35) {
        const k = ease.outCubic(clamp((t - SPLIT) / 0.06)) * (1 - smooth(SPLIT + 0.2, SPLIT + 0.35, t));
        for (let i = 0; i < 9; i++) {
          const a = rand(i, 3) * TAU, L = (16 + rand(i, 4) * 22) * k, x0 = TX - 8 + i * 2.5, y0 = -26;
          const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
          p.beam(x0, y0, x1, y1, 2, C[3]);
          p.line(x0, y0, x1, y1, WHITE);
          p.px(x1, y1, WHITE);
        }
        p.glow(TX, -26, 40, C[3], 0.8 * k);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
