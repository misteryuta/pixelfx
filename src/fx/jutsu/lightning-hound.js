// Raiton: Raijuu Tsuiga (lightning beast tracking fang). Narutopedia: Kakashi first forms a Raikiri in his hand; out of
// it a bolt shoots at the enemy and just before it becomes a hound. Meant for mid range, unlike the plain Raikiri. The
// wiki picture: a hound of white-blue lightning, jaws wide open. The wiki lists no seals; the Raikiri it is born from is
// the Chidori's, so the run is Ox, Hare, Monkey.
// Built from: the lightning kit (zigzag, crackle, stroke) to ink a running hound's outline that re-strikes every frame,
// the toolkit's sparks, and the library's zap hit and thunderclap (small) where it bites.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, rng, lerp, WHITE, TAU, sparkle } from "../../core/index.js";
import * as zap from "../lightning/zap-hit.js";
import { VOLT, PLASMA, zigzag, crackle, stroke } from "../lightning/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const SEALS = sealRun(0.05, ["ushi", "u", "saru"], 0.13, { hold: 0.1 });
const FORM = SEALS.end, LOOSE = FORM + 0.55, BITE = LOOSE + 0.62, TX = 150;
const HAND = [16, -22];

export const meta = {
  name: "Lightning hound",
  desc: "Raiton: Ox, Hare, Monkey, a Raikiri flaring in the outstretched hand, and out of it a bolt that races along the ground into a hound of lightning that leaps jaws first.",
  tags: ["jutsu", "lightning", "raiton", "beast", "move", "one-shot"],
  size: [260, 120],
  origin: [40, 100],
  duration: BITE + 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: VOLT, sparks: PLASMA, seed: 11 },
};

const AIM = { ...READY, x: -2, crouch: 6, lean: 3, fx: HAND[0], fy: HAND[1], bx: 9, by: -21, armsFront: true, ffx: 11, fbx: -10 };
const SEND = { ...AIM, crouch: 5, lean: 6, fx: 18, fy: -20, bx: -4, by: -22, toeB: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [FORM + 0.1, AIM],
    [LOOSE, SEND, "snap"],
    [BITE + 0.4, { ...SEND, crouch: 4, lean: 3 }],
    [BITE + 1, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: BITE, stop: 0.16, shake: 0.32, amp: 2, push: 3.2, straw: 22, skin: "shock", shiver: 1.1, y: -20 },
    { t: BITE + 0.3, stop: 0.03, push: 1, straw: 6, y: -20 },
    { t: meta.duration - 0.4, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: LOOSE, x: 12, n: 5, dir: 1 }],
};

// the hound, facing right, chest at (0, 0), in two running frames: legs stretched out, legs gathered under
const BODY = [[-17, -13], [-12, -10], [-2, -11], [5, -14], [7, -21], [9, -16], [13, -16], [21, -14], [23, -11]];
const JAW_UP = [[23, -11], [16, -9]], JAW_LO = [[16, -9], [22, -5], [15, -5]];
const LEGS = [
  [[15, -5], [9, -3], [17, 3], [14, 4], [5, -1], [-6, -1], [-15, 4], [-18, 3], [-12, -4], [-17, -13]],
  [[15, -5], [9, -3], [8, 4], [5, 4], [3, -1], [-6, -1], [-6, 4], [-9, 4], [-12, -4], [-17, -13]],
];
const shape = (f, open) => [...BODY, [23, -11 - open], [16, -9], [22, -5 + open], ...LEGS[f].slice(0)];

// the hound's run: out of the hand along the ground, a last leap onto the target; scale grows as it takes shape
function houndAt(t) {
  const u = (t - LOOSE) / (BITE - LOOSE);
  if (u < 0 || u > 1.05) return null;
  const x = lerp(HAND[0] + 10, TX - 30, ease.inQuad(Math.min(1, u)) * 0.5 + Math.min(1, u) * 0.5);
  const leap = smooth(0.7, 1, u), y = -4 - 10 * Math.sin(Math.PI * clamp((u - 0.7) / 0.3)) * 0.8 - 2 * leap;
  return { x, y, s: 0.4 + 0.9 * smooth(0, 0.45, u), u };
}

export const create = play(
  [
    { fx: zap, t: BITE - 0.02, x: TX - 6, y: -20 },
    { fx: zap, t: BITE + 0.25, x: TX - 4, y: -14, seed: 4 },
  ],
  (o) => {
    const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
    const ps = new Particles({ rng: R, ground: floor, sparks: o.sparks });
    let bit = false;
    return {
      update(t, dt) {
        const [hx, hy] = HAND;
        if (t > FORM && t < LOOSE + 0.2 && R.chance(40 * dt)) {
          const a = R.range(0, TAU), sp = R.range(60, 200);
          ps.spawn(P.SPARK, hx, hy, Math.cos(a) * sp, Math.sin(a) * sp - 30, R.range(0.1, 0.25));
        }
        const h = houndAt(t);
        if (h && h.u < 1) {
          // paws strike the floor: sparks kicked up behind it
          if (R.chance(30 * dt)) ps.spawn(P.SPARK, h.x - R.range(0, 12), -1, -R.range(40, 140), -R.range(30, 120), R.range(0.12, 0.3));
          if (R.chance(8 * dt)) lights.add(h.x, h.y - 10, 50, C[5], 0.5, 0.1);
        }
        if (!bit && t >= BITE) {
          bit = true;
          lights.add(TX - 6, -18, 80, C[5], 0.9, 0.22);
          for (let j = 0; j < 26; j++) {
            const a = R.range(0, TAU), sp = R.range(80, 280);
            ps.spawn(P.SPARK, TX - 6, -18, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.15, 0.4));
          }
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(2));
        const f = Math.floor(t * 30 + 1e-4), [hx, hy] = HAND;
        // the Raikiri in the hand: a crackling knot that flares as the hound leaves it
        const k = t > FORM ? smooth(FORM, FORM + 0.25, t) * (1 - smooth(LOOSE + 0.1, LOOSE + 0.4, t)) : 0;
        if (k > 0.02) {
          const r2 = rng(o.seed, 2, f);
          for (let j = 0; j < 5; j++) {
            const a = r2.range(0, TAU), L = r2.range(5, 12);
            crackle(p, zigzag(r2, hx, hy, hx + Math.cos(a) * L, hy + Math.sin(a) * L, 0.45, 0.4), r2.range(0.5, 0.9) * k, C, 0.3);
          }
          p.circle(hx, hy, 3.5, C[6]);
          p.circle(hx, hy, 2, WHITE);
          p.glow(hx, hy, 24, C[4], 0.6 * k);
        }
        const h = houndAt(t);
        if (h) {
          // the bolt that leaves the hand, still linking it to the hound for the first moments
          if (h.u < 0.3) crackle(p, zigzag(rng(o.seed, 9, f), hx + 2, hy, h.x - 10 * h.s, h.y - 8 * h.s, 0.3, 0.4), 0.8 * (1 - h.u / 0.3), C, 0.4);
          // the hound: its outline inked as lightning, re-struck every other frame, jaws opening for the bite
          const open = 3 * smooth(0.6, 0.95, h.u), legs = Math.floor(t * 12) % 2, pts = shape(legs, open).map(([x, y]) => [h.x + x * h.s, h.y + y * h.s]);
          const fade = h.u > 1 ? 1 - (h.u - 1) / 0.05 : 1, r2 = rng(o.seed, 13, f >> 1), paths = [];
          for (let i = 0; i < pts.length - 1; i++) {
            const seg = zigzag(r2, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0.25, 0.15);
            paths.push(...seg.paths.map((q, j) => (j ? q : { ...q, w: 1 })));
          }
          if (fade > 0.5) p.poly(pts, C[3]);
          stroke(p, { paths }, 0.9 * fade, C, 0.7, { light: 0.4 });
          // the eye and a white-hot heart in the chest
          p.px(h.x + 15 * h.s, h.y - 14 * h.s, WHITE);
          p.glow(h.x, h.y - 8 * h.s, 30 * h.s, C[5], 0.5 * fade);
          // arcs crackling off its back like fur standing up
          for (let j = 0; j < 3; j++) {
            const i = r2.int(0, 4), [ax, ay] = pts[i];
            crackle(p, zigzag(r2, ax, ay, ax - r2.range(4, 10), ay - r2.range(2, 8), 0.4, 0.3), 0.6 * fade, C, 0.25);
          }
        }
        if (t - BITE > 0 && t - BITE < 0.12) sparkle(p, TX - 6, -18, Math.round(16 * (1 - (t - BITE) / 0.12)), WHITE, C[5], 0.8);
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);
