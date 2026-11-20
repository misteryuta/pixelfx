// Suna no Tate (Shield of Sand, Gaara). Narutopedia: the first half of Gaara's Absolute Defence; the sand moves on its
// own to block whatever comes at him, without his will, said to be his mother's love living in it. Here: three kunai
// thrown at him from beyond the target; he doesn't move, his arms stay folded; the sand leaps out of the gourd into a
// curved wall that catches every one, then the wall breaks into a hail of sand shuriken flung back at the target.
// New: the incoming kunai, the shield (a shaded curved wall that rises and folds), the sand shuriken flung back.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, THROW = OPEN + 0.1, KT = 0.35, RISE = THROW + 0.12, CAUGHT = THROW + KT, HOLD = CAUGHT + 0.5, FLING = HOLD + 0.1, FLY = 0.3, HIT = FLING + FLY, END = HIT + 1.7, TX = 150, WX = 20;
const SAND = ["#4a3418", "#7a5a2a", "#b08a4a", "#d8b878", "#f4e0a8"].map(hex);
const KUNAI = [[-44, 0], [-30, 0.08], [-18, 0.16]];

export const meta = {
  name: "Shield of sand",
  desc: "Gaara: kunai thrown at him from beyond the target, and without him moving the sand leaps out of his gourd into a curved wall that catches them all, then breaks into a hail of sand shuriken flung back at the target.",
  tags: ["jutsu", "gaara", "sand", "defense", "counter", "one-shot"],
  size: [260, 150],
  origin: [56, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a3418", "#7a5a2a", "#b08a4a", "#d8b878", "#f4e0a8"], seed: 57 },
};

const FOLDED = { ...READY, crouch: 1, fx: 4, fy: -22, bx: 2, by: -22, armsFront: true, ffx: 5, fbx: -5 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, FOLDED, "out"],
    [FLING, { ...FOLDED, fx: 18, fy: -26, armsFront: false }, "snap"],
    [END, { ...FOLDED, fx: 16, fy: -26, armsFront: false }],
  ],
  hits: [
    { t: CAUGHT, stop: 0.08, shake: 0.12, amp: 1, target: false },
    { t: HIT, stop: 0.12, shake: 0.25, amp: 2, push: 3.5, straw: 30 },
    { t: HIT + 0.12, stop: 0.03, flash: 0, push: 1, straw: 10 },
  ],
};

// the shield: a curved wall of sand in front of him, h tall (0..1), crumbling c (0..1)
function shield(p, t, h, c) {
  const H = 50 * h;
  p.shade(WX - 14, -H - 4, WX + 10, 0, (x, y) => {
    const v = -y / 50, bow = Math.sin(Math.min(1, v / Math.max(0.01, h)) * Math.PI) * 6;
    const front = WX + bow - 2, th = 8 + 2 * noise2(y * 0.2, t * 3, 1);
    if (x < front - th || x > front || y < -H || noise2(x * 0.7, y * 0.7, 3) < c) return;
    const g = noise2(x * 0.9, y * 0.9 + t * 3, 9);
    return x > front - 1.5 ? SAND[4] : g > 0.7 ? SAND[3] : g > 0.35 ? SAND[2] : SAND[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let caught = false;
  return {
    update(t, dt) {
      if (t > RISE && t < RISE + 0.2 && R.chance(120 * dt)) ps.spawn(P.GRIT, -8, -40, R.range(80, 180), R.range(-40, 40), 0.15, SAND[R.int(2, 4)]);
      if (!caught && t >= CAUGHT) {
        caught = true;
        for (let i = 0; i < 20; i++) ps.spawn(P.GRIT, WX + 1, -R.range(14, 40), R.range(10, 60), -R.range(10, 60), R.range(0.3, 0.6), SAND[R.int(2, 4)]);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), gx = b.chest[0] - 7, gy = b.chest[1] - 2;
      p.ellipse(gx, gy + 6, 6, 8, SAND[1]);
      p.ellipse(gx, gy - 4, 4, 4, SAND[1]);
      p.ellipse(gx - 1, gy + 5, 4, 6, SAND[2]);
      p.line(gx - 5, gy - 1, gx + 5, gy + 2, hex("#7a1a1a"));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gaara", t0: EYE, t1: OPEN, label: "SUNA NO TATE", head: b.head });
      drawGlint(p, t, "gaara", OPEN + 0.05, END - 0.3, b.head);
      // the kunai, flying in from beyond the target, stuck in the sand when it catches them
      KUNAI.forEach(([y, d]) => {
        const a = t - THROW - d;
        if (a < 0 || t > FLING) return;
        const u = clamp(a / (KT - d * 0.5)), x = TX + 70 - (TX + 70 - WX - 2) * u, yy = y * 0.6 + (y - y * 0.6) * u;
        const S = hex("#e8edf6"), D = hex("#68748f");
        p.poly([[x - 5, yy], [x - 1, yy - 1.4], [x - 1, yy + 1.4]], S);
        p.line(x - 1, yy, x + 5, yy, D);
        p.ring(x + 6.5, yy, 1.2, 1, D);
        if (u < 1) p.line(x + 8, yy, x + 18, yy, hex("#c8c8d8"), 0.5);
      });
      // the shield: leaps up before the first kunai, holds them, then breaks apart into the shuriken
      if (t > RISE && t < FLING + 0.25) {
        const h = ease.outBack(clamp((t - RISE) / 0.15), 2), c = smooth(FLING - 0.05, FLING + 0.25, t);
        shield(p, t, h, c);
      }
      // the sand shuriken: four-pointed stars of sand spinning back at the target
      if (t >= FLING && t < HIT + 0.05) {
        for (let i = 0; i < 6; i++) {
          const u = clamp((t - FLING - i * 0.03) / FLY);
          if (u <= 0 || u >= 1) continue;
          const x = WX + (TX - 10 - WX) * u, y = -40 + i * 5 + Math.sin(u * Math.PI) * -8, a = t * 30 + i;
          for (let k = 0; k < 4; k++) {
            const aa = a + (k * TAU) / 4;
            p.tri(x, y, x + Math.cos(aa) * 4.5, y + Math.sin(aa) * 4.5, x + Math.cos(aa + 0.9) * 1.8, y + Math.sin(aa + 0.9) * 1.8, k % 2 ? SAND[3] : SAND[2]);
          }
          p.px(x, y, SAND[4]);
        }
      }
      ps.draw(p, "front");
    },
  };
});
