// Sabaku Kyuu / Sabaku Sousou (Sand Binding Coffin / Sand Waterfall Funeral, Gaara). Narutopedia: sand from the gourd
// on his back seizes the target and encases it, and once it is wrapped Gaara clenches his fist and the sand presses in
// from every side. Here: Gaara's ringed, pale eyes, the cork leaving the gourd and sand pouring out, a stream of it
// racing over the floor, rising round the target and closing over it in a coffin of sand; his open hand, then the fist,
// and the coffin crushes in on itself with a burst of sand.
// New: the gourd and its pouring sand, the stream along the floor, the coffin (a shaded mound of grains that rises and
// closes), the crush.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.05, OPEN = 0.6, CORK = OPEN + 0.1, POUR = CORK + 0.15, FLOW = POUR + 0.2, ARRIVE = FLOW + 0.35, WRAP = ARRIVE + 0.5, HAND = WRAP + 0.2, CLENCH = HAND + 0.4, END = CLENCH + 1.8, TX = 150;
const SAND = ["#4a3418", "#7a5a2a", "#b08a4a", "#d8b878", "#f4e0a8"].map(hex);

export const meta = {
  name: "Sand coffin and funeral",
  desc: "Gaara: sand pours from the gourd on his back, races over the floor, rises round the target and closes it in a coffin; his open hand clenches and the coffin crushes in with a burst of sand.",
  tags: ["jutsu", "gaara", "sand", "control", "one-shot"],
  size: [260, 150],
  origin: [56, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a3418", "#7a5a2a", "#b08a4a", "#d8b878", "#f4e0a8"], seed: 56 },
};

const CALM = { ...READY, crouch: 1, fx: 4, fy: -18, bx: -2, by: -18, armsFront: true, ffx: 5, fbx: -5 };
const OPENH = { ...CALM, fx: 19, fy: -28, armsFront: false, lean: 2 };
const FIST = { ...OPENH, fx: 17, fy: -27, lean: 4, crouch: 3 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [HAND, OPENH, "out"],
    [CLENCH, FIST, "snap"],
    [END, FIST],
  ],
  hits: [
    { t: WRAP, stop: 0.04, flash: 0, push: 0, straw: 0, shiver: 0.8 },
    { t: CLENCH, stop: 0.2, shake: 0.45, amp: 3, push: 1, straw: 40, shiver: 1, sfx: "heavy" },
  ],
};

// the camera (2026-11-25): wide while the sand runs out over the floor; in on the coffin as it closes and held there so
// the shut silhouette reads; a short cut to his open hand as it starts to close; back on the coffin exactly as the hand
// clenches (compression, the dull blow, the hit); out as the sand trickles down
export const camera = cineCam([
  [0, { z: 1.2, x: 60, y: -30 }],
  [FLOW, { z: 1.15, x: 80, y: -30 }],
  [ARRIVE, { z: 1.7, x: TX, y: -30 }],
  [WRAP + 0.1, { z: 1.9, x: TX, y: -30 }],
  [HAND + 0.05, { z: 2.4, x: 18, y: -30, r: -2 }, "cut"],
  [CLENCH - 0.06, { z: 2.5, x: 18, y: -30, r: -2 }],
  [CLENCH - 0.02, { z: 2.0, x: TX, y: -30, r: 2, shake: 0.7 }, "cut"],
  [CLENCH + 0.35, { z: 1.85, x: TX, y: -28, r: 1 }],
  [END, { z: 1.3, x: TX - 30, y: -26 }],
]);

// the coffin: a mound of sand over the target, rising with h (0..1), squeezed by s (0..1)
function coffin(p, t, h, s) {
  const W = 17 * (1 - 0.25 * s), Ht = 56 * h * (1 - 0.15 * s);
  p.shade(TX - W - 3, -Ht - 4, TX + W + 3, 0, (x, y) => {
    const dx = (x - TX) / W, top = -Ht * Math.sqrt(Math.max(0, 1 - dx * dx * 0.7)) + noise2(x * 0.3, t * 4, 2) * 3;
    if (Math.abs(dx) > 1 + noise2(y * 0.2, t * 3, 5) * 0.12 || y < top) return;
    const g = noise2(x * 0.9, y * 0.9 + t * (s > 0 ? 0 : 6), 9), lit = -dx * 0.5 + (y - top) / -60;
    return g > 0.8 ? SAND[4] : lit > 0.05 ? SAND[3] : lit > -0.3 ? SAND[2] : g < 0.25 ? SAND[0] : SAND[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let burst = false;
  return {
    update(t, dt) {
      // the sand pouring out of the gourd's mouth and down to the floor
      if (t > POUR && t < WRAP && R.chance(90 * dt)) ps.spawn(P.GRIT, -8 + R.range(-2, 2), -40, R.range(-20, 30), R.range(-20, 20), R.range(0.3, 0.5), SAND[R.int(2, 4)]);
      if (!burst && t >= CLENCH) {
        burst = true;
        for (let i = 0; i < 70; i++) {
          const a = R.range(-Math.PI, 0), s = R.range(60, 220);
          ps.spawn(P.GRIT, TX + R.range(-12, 12), -R.range(4, 50), Math.cos(a) * s, Math.sin(a) * s, R.range(0.5, 1), SAND[R.int(1, 4)], R.chance(0.4) ? 2 : 1);
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      // the gourd on his back, its cork popped
      const gx = b.chest[0] - 7, gy = b.chest[1] - 2;
      p.ellipse(gx, gy + 6, 6, 8, SAND[1]);
      p.ellipse(gx, gy - 4, 4, 4, SAND[1]);
      p.ellipse(gx - 1, gy + 5, 4, 6, SAND[2]);
      p.line(gx - 5, gy - 1, gx + 5, gy + 2, hex("#7a1a1a"));
      if (t < CORK) p.rect(gx - 1, gy - 9, 3, 2, hex("#5a3a1a"));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gaara", t0: EYE, t1: OPEN, label: "SABAKU", head: b.head });
      drawGlint(p, t, "gaara", OPEN + 0.05, END - 0.3, b.head);
      // the stream: a ribbon of sand racing over the floor from the gourd to the target, then feeding the coffin
      if (t > FLOW && t < CLENCH) {
        const u = ease.outCubic(clamp((t - FLOW) / (ARRIVE - FLOW))), x1 = -6 + (TX - 16 + 6) * u, thin = smooth(WRAP, CLENCH, t);
        p.shade(-8, -8, x1 + 2, 0, (x, y) => {
          const h = (2.5 + 2 * noise2(x * 0.15 - t * 8, 0, 3)) * (1 - thin);
          if (y < -h) return;
          const g = noise2(x * 0.8 - t * 20, y * 0.9, 4);
          return g > 0.75 ? SAND[4] : g > 0.4 ? SAND[3] : SAND[2];
        });
      }
      // the coffin rising round the target and closing over it, then crushed
      if (t > ARRIVE && t < CLENCH + 0.5) {
        const h = ease.outCubic(clamp((t - ARRIVE) / (WRAP - ARRIVE))), s = smooth(CLENCH - 0.05, CLENCH + 0.1, t), gone = smooth(CLENCH + 0.15, CLENCH + 0.5, t);
        if (gone < 1) coffin(p, t, h * (1 - gone), s);
      }
      if (t > CLENCH && t < CLENCH + 0.3) {
        const u = (t - CLENCH) / 0.3;
        p.ring(TX, -28, 10 + 30 * ease.outCubic(u), 1, SAND[4], 1 - u);
      }
      ps.draw(p, "front");
    },
  };
});
