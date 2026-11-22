// Jinton: Genkai Hakuri no Jutsu (Dust Release: Detachment of the Primitive World, Onoki, the Third Tsuchikage).
// Narutopedia: a blend of earth, wind and fire; between his hands he forms a small cube of light inside a larger one
// and fires it as a widening cone; whatever the cone's cube closes round is broken down to the molecule and simply
// isn't there any more. Here: he floats up off the ground (his weightless rock technique), knees drawn up, an old man's
// stoop; his hands part and a cube of white light is born between them with a bright sphere turning at its centre; he
// aims; a cone of light widens from his hands to the target and a great translucent cube unfolds round it; it hangs
// for a breath, edges humming; then the sphere inside bursts, the blast held in by the cube's walls, and the cube is empty: the target and a cube of the floor under it are
// gone, a clean square hole in the ground; dust slides into the hole. The target comes back at the end.
// New: the float, the nested cubes, the cone, the erasing cube and the hole it leaves.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 170, FLOAT = 0.3, FORM = 0.75, FORMED = 1.4, FIRE = 1.55, BOX = 1.75, ERASE = 2.35, BACK = 3.9, END = 4.6;
const LT = ["#3a4a5a", "#7a96b0", "#c8e4f4", "#f4fcff"].map(hex);
const HALF = 26, CY = -24;

export const meta = {
  name: "Dust release: detachment of the primitive world",
  desc: "Onoki floats up, a cube of light born between his hands with a smaller one turning inside; a cone of light widens to the target and a great cube unfolds round it; a flash, and the cube is empty: target and floor erased, a clean square hole.",
  tags: ["jutsu", "onoki", "tsuchikage", "dust", "jinton", "kekkei-tota", "one-shot"],
  size: [300, 190],
  origin: [56, 158],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a4a5a", "#7a96b0", "#c8e4f4", "#f4fcff"], seed: 31 },
};

const SIT = { ...READY, y: -18, crouch: 6, lean: 6, fx: 6, fy: -22, bx: 4, by: -22, ffx: 7, ffy: -10, fbx: -4, fby: -8, gait: false };
const SPREAD = { ...SIT, fx: 12, fy: -26, bx: 0, by: -20, armsFront: true };
const AIM = { ...SIT, lean: 9, fx: 18, fy: -25, bx: 14, by: -24, armsFront: true };
export const act = {
  target: { x: TX },
  ghost: "#c8e4f4",
  poses: [
    [-0.25, READY],
    [FLOAT, { ...READY, crouch: 4 }, "out"],
    [FLOAT + 0.35, SIT, "out"],
    [FORM, SPREAD, "out"],
    [FIRE - 0.05, { ...AIM, lean: 4 }, "out"],
    [FIRE, AIM, "snap"],
    [ERASE + 0.5, AIM],
    [END - 0.6, SIT],
    [END, { ...SIT, y: -14 }],
  ],
  hits: [
    { t: FLOAT, target: false, sfx: "cast" },
    { t: FIRE, stop: 0.05, shake: 0.2, amp: 1, target: false, sfx: "whoosh" },
    { t: BOX, stop: 0.08, push: 0, straw: 0, flash: 0, skin: "holy" },
    { t: ERASE, stop: 0.2, shake: 0.6, amp: 4, push: 0, straw: 0, target: false, sfx: "explosion" },
    { t: meta.duration - 0.25, flash: 0, push: 0, straw: 0, skin: null }, // RESET SKIN: the target back to its own colours
  ],
};
// the target inside the cube: still, lit by it, then simply not there; back at the end
export const targetState = (t) => {
  if (t < BOX) return null;
  if (t < ERASE) return { tint: [LT[3], 0.35 * smooth(BOX, ERASE, t)], shiver: 1 };
  return { a: smooth(BACK, BACK + 0.4, t) };
};

// a wireframe cube centred at (x, y), half size h, turned by a about the vertical and tilted toward us
function cube(p, x, y, h, a, c, k = 1, fill = 0) {
  const pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const X = sx * h * Math.cos(a) - sz * h * Math.sin(a), Z = sx * h * Math.sin(a) + sz * h * Math.cos(a), Y = sy * h;
    pts.push([x + X, y + Y * 0.92 + Z * 0.28]);
  }
  if (fill) p.poly([pts[0], pts[2], pts[6], pts[4]], c, fill * k);
  for (const [i, j] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) p.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], c, k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  return {
    update(t, dt) {
      if (t >= ERASE) once("e", () => { lights.add(TX, CY, 220, LT[3], 1, 0.5); });
      // dust sliding into the hole afterwards
      if (t > ERASE + 0.15 && t < ERASE + 1.2 && R.chance(40 * dt)) {
        const s = R.chance(0.5) ? -1 : 1;
        ps.spawn(P.GRIT, TX + s * (HALF + 2), -1, -s * R.range(10, 40), R.range(10, 40), R.range(0.3, 0.6), hex(["#3a3048", "#5a4c66"][R.int(0, 1)]));
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the hole: a clean square cut out of the floor where the cube's bottom was
      if (t > ERASE) {
        p.rect(TX - HALF, 0, HALF * 2, 30, hex("#050308"));
        p.rect(TX - HALF, 0, HALF * 2, 1, hex("#1a1424"));
        p.rect(TX - HALF, 0, 1, 30, LT[1], 0.6 * (1 - smooth(ERASE, ERASE + 1.2, t)));
        p.rect(TX + HALF - 1, 0, 1, 30, LT[1], 0.6 * (1 - smooth(ERASE, ERASE + 1.2, t)));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), mid = [(b.handN[0] + b.handF[0]) / 2 + 3, (b.handN[1] + b.handF[1]) / 2];
      drawBadge(p, t, { kind: "iwa", t0: 0.04, t1: FLOAT + 0.2, label: "JINTON", head: b.head });
      // floating: a faint ring of force under him, pebbles hanging in the air
      if (t > FLOAT) {
        const k = smooth(FLOAT, FLOAT + 0.3, t);
        p.ellipse(b.footN[0], 0, 9, 1.5, LT[1], 0.4 * k);
        for (let i = 0; i < 4; i++) p.px(-8 + i * 6, -4 - (i % 2) * 3 - Math.sin(t * 3 + i) * 2, hex("#6a5a4a"), k);
      }
      // the cube born between his hands, the small one turning inside it
      if (t > FORM && t < FIRE + 0.1) {
        const g = ease.outBack(smooth(FORM, FORMED, t), 1.5), k = 1 - smooth(FIRE, FIRE + 0.1, t);
        p.glow(mid[0], mid[1], 16 * g, LT[2], 0.6 * k);
        cube(p, mid[0], mid[1], 5 * g, t * 1.5, LT[2], k, 0.25);
        // the sphere at its centre (Narutopedia): the heart of the technique
        p.circle(mid[0], mid[1], 2.4 * g, WHITE, k);
        p.ring(mid[0], mid[1], 3.4 * g, 1, LT[2], k);
      }
      // the cone: from his hands out to the target, widening to the cube's face, humming
      if (t > FIRE && t < ERASE + 0.05) {
        const u = ease.outCubic(clamp((t - FIRE) / (BOX - FIRE))), x1 = mid[0] + (TX - HALF - mid[0]) * u, h = 3 + (HALF - 3) * u, k = 0.55 + 0.15 * Math.sin(t * 50);
        p.poly([[mid[0], mid[1] - 2], [x1, CY - h], [x1, CY + h], [mid[0], mid[1] + 2]], LT[2], 0.22 * k);
        p.line(mid[0], mid[1] - 2, x1, CY - h, LT[3], k);
        p.line(mid[0], mid[1] + 2, x1, CY + h, LT[3], k);
        p.line(mid[0], mid[1], x1, CY, WHITE, k * 0.6);
      }
      // the great cube round the target: unfolds, hangs humming, then the flash
      if (t > BOX - 0.1 && t < ERASE + 0.1) {
        const g = ease.outBack(smooth(BOX - 0.1, BOX + 0.15, t), 1.2), k = 1 - smooth(ERASE, ERASE + 0.1, t), a = 0.4 + 0.08 * Math.sin(t * 2);
        p.glow(TX, CY, HALF * 2, LT[2], 0.35 * k);
        cube(p, TX, CY, HALF * g, a, LT[3], k, 0.18);
        // the sphere inside, swelling and pulsing toward the moment it bursts
        const sp = 4 + 6 * smooth(BOX, ERASE, t) + Math.sin(t * 40) * 0.8;
        p.glow(TX, CY, sp * 3, WHITE, 0.6 * k);
        p.circle(TX, CY, sp, WHITE, k);
        p.ring(TX, CY, sp + 2, 1, LT[2], k);
        // the humming edges: little sparks crawling along them
        for (let i = 0; i < 6; i++) { const e = (t * 3 + i / 6) % 1; p.px(TX - HALF + e * HALF * 2, CY - HALF * 0.92 + (i % 2) * HALF * 1.84, WHITE, k); }
      }
      if (t >= ERASE + 0.05 && t < ERASE + 0.1) p.rect(TX - HALF, CY - HALF, HALF * 2, HALF * 2 + 30, WHITE);
      // the blast churning inside the walls and dying away: held to the cube, nothing gets out
      if (t >= ERASE + 0.1 && t < ERASE + 0.45) { const u = (t - ERASE - 0.1) / 0.35; p.shade(TX - HALF, CY - HALF, TX + HALF, CY + HALF, (x, y, out) => { const n = noise2(x * 0.15 + t * 9, y * 0.15, 3); if (n < u * 1.6 - 0.6) return; out.a = 1 - u; return n > 0.4 ? WHITE : n > 0 ? LT[3] : LT[2]; }); }
      // the empty space, a ghost of the cube's outline fading
      if (t > ERASE + 0.1 && t < ERASE + 1) { const k = 1 - smooth(ERASE + 0.1, ERASE + 1, t); cube(p, TX, CY, HALF, 0.4, LT[1], k * 0.6); }
      void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
