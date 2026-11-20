// Juuho Soushiken (Gentle Step Twin Lion Fists, Hinata). Narutopedia: a high-level secret Gentle Fist of the Hyuuga
// main branch; the chakra let out of both hands is shaped into two large guardian-lion heads, which greatly extend the
// reach and power, and drain the chakra network of whoever they touch. Here: the Byakugan and its veins, chakra pouring
// off her hands and taking shape as two snarling lion heads, she steps in and drives both into the target, the jaws
// close on it and its chakra streams back into them.
// New: the lion heads (shaded: a mane of flame-like points, a broad face, slanted eyes, a jaw that opens and bites).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, POUR = OPEN + 0.1, FORMED = POUR + 0.6, STEP = FORMED + 0.15, HIT = STEP + 0.22, DRAIN = HIT + 0.9, TX = 120;
const LI = ["#1a1a5a", "#3a3aa8", "#7a7ae8", "#c0c0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Twin lion fists",
  desc: "Hinata: the Byakugan, chakra pouring off both hands and shaped into two snarling lion heads, a step in, both driven into the target, the jaws closing and its chakra streaming back into them.",
  tags: ["jutsu", "hinata", "hyuuga", "byakugan", "taijutsu", "melee", "drain", "one-shot"],
  size: [240, 150],
  origin: [56, 118],
  duration: DRAIN + 1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a1a5a", "#3a3aa8", "#7a7ae8", "#c0c0ff", "#ffffff"], seed: 51 },
};

const READYL = { ...READY, crouch: 8, lean: 2, fx: 13, fy: -18, bx: 9, by: -28, ffx: 10, fbx: -9 };
const STRIKE = { ...READY, x: TX - 42, crouch: 8, lean: 12, fx: 22, fy: -20, bx: 21, by: -30, armsFront: true, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [POUR, READYL, "out"],
    [STEP, { ...READYL, crouch: 10 }],
    [HIT, STRIKE, "in"],
    [DRAIN, { ...STRIKE, crouch: 9 }],
    [DRAIN + 0.4, { ...READYL, x: TX - 46 }],
    [meta.duration, { ...READYL, x: TX - 46 }],
  ],
  ghost: "#c0c0ff",
  hits: [
    { t: HIT, stop: 0.16, shake: 0.3, amp: 2, push: 3, straw: 26, skin: "shock" },
    ...[0.3, 0.6].map((d) => ({ t: HIT + d, stop: 0.03, flash: 0, push: 0.6, straw: 6, shiver: 0.5 })),
    { t: DRAIN + 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// a lion's head at (x, y), facing right, size s, jaw open 0..1
function lion(p, x, y, s, jaw, t, k, seed) {
  if (k <= 0) return;
  const S = s * k;
  p.glow(x, y, S * 2.4, LI[2], 0.5 * k);
  p.shade(x - S * 1.3, y - S * 1.3, x + S * 1.5, y + S * 1.3, (px, py, out) => {
    const dx = (px - x) / S, dy = (py - y) / S, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
    // the mane: flame-like points all round the back of the head
    const mane = 0.95 + 0.28 * Math.max(0, Math.sin(a * 7 + t * 12 + seed)) * (Math.cos(a) < 0.3 ? 1 : 0.3);
    const face = ((dx - 0.25) / 0.75) ** 2 + (dy / 0.62) ** 2 < 1;
    const muzzleTop = dx > 0.3 && dx < 1.25 && dy > -0.35 && dy < 0.02;
    const muzzleBot = dx > 0.3 && dx < 1.1 - jaw * 0.2 && dy > 0.08 + jaw * 0.25 && dy < 0.35 + jaw * 0.4;
    if (!(r < mane || face || muzzleTop || muzzleBot)) return;
    out.k = 0.2;
    // the eyes: slanted white slits; the mouth: dark between the jaws, teeth at the edges
    if (Math.abs(dx - 0.45) < 0.16 && Math.abs(dy + 0.3 - (dx - 0.45) * 0.5) < 0.06) return WHITE;
    if (dx > 0.35 && dx < 1.15 && dy > 0.02 && dy < 0.08 + jaw * 0.25) return (Math.floor(dx * 8) % 2 && (dy < 0.06 || dy > jaw * 0.25)) ? WHITE : LI[0];
    if (r > mane - 0.12 && !face && !muzzleTop && !muzzleBot) return LI[4];
    return face || muzzleTop || muzzleBot ? (dy < -0.2 ? LI[3] : LI[2]) : r > 0.8 ? LI[3] : LI[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      if (t > POUR && t < HIT && R.chance(60 * dt)) {
        const h = R.chance(0.5) ? b.handN : b.handF;
        ps.spawn(P.STREAK, h[0] + R.range(-4, 4), h[1] + R.range(-4, 4), R.range(-30, 30), -R.range(30, 80), R.range(0.15, 0.3), R.chance(0.5) ? LI[3] : WHITE);
      }
      // the drain: the target's chakra pulled out in streams into the lions' mouths
      if (t > HIT && t < DRAIN && R.chance(80 * dt)) {
        const x = TX + R.range(-8, 10), y = -R.range(8, 46), T = R.range(0.2, 0.3), tx = b.handN[0] + 8, ty = b.handN[1];
        ps.spawn(P.STREAK, x, y, (tx - x) / T, (ty - y) / T, T, R.chance(0.5) ? LI[3] : WHITE);
      }
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugan", t0: EYE, t1: OPEN, label: "BYAKUGAN", head: b.head });
      drawGlint(p, t, "byakugan", OPEN + 0.05, meta.duration - 0.3, b.head);
      if (t > OPEN) for (const s of [-1, 1]) {
        p.line(hx + 2 + s * 1.5, hy - 1, hx + 2 + s * 3, hy - 2.5, hex("#b97a8e"));
        p.px(hx + 2 + s * 3.5, hy, hex("#b97a8e"));
      }
      // the lions over each fist: formed from the pouring chakra, snarling, jaws snapping shut on the hit
      const k = ease.outBack(clamp((t - POUR) / (FORMED - POUR)), 1.5) * (1 - smooth(DRAIN, DRAIN + 0.4, t));
      const jaw = t < HIT - 0.08 ? 0.5 + 0.3 * Math.sin(t * 14) : t < HIT ? 1 : clamp(1 - (t - HIT) * 8) * 0.2;
      lion(p, b.handF[0] + 4, b.handF[1] - 2, 11, jaw, t, k, 2);
      lion(p, b.handN[0] + 4, b.handN[1] - 1, 12, jaw, t, k, 0);
      if (t > HIT && t < HIT + 0.3) {
        const u = (t - HIT) / 0.3;
        p.ring(TX - 10, -26, 8 + 26 * ease.outCubic(u), 1, u < 0.3 ? WHITE : LI[3], 1 - u);
      }
      ps.draw(p, "front");
    },
  };
});
