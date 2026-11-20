// Bijuudama (Tailed Beast Ball, Naruto in Kurama Chakra Mode). Narutopedia: the ultimate technique of a tailed beast,
// also used by its jinchuuriki; positive and negative chakra gathered at an 8:2 ratio in the mouth, balanced into a
// sphere and fired. Nine-Tails Chakra Mode coats the body in yellow chakra flickering like flames, with black seal
// markings. Here: Kurama's eye, the golden cloak flaring over him with its black marks, a giant chakra fox head rising
// behind, dark and light motes pulled into its open jaws and balanced into a black sphere, fired at the target, where
// it goes off in a dark dome and a white flash.
// New: the cloak (drawFigure in gold over his body, flames off its edge, the six magatama at the neck), the fox head
// (one shaded shape: skull, ears, muzzle, slit eye, jaws), the ball. The head aims: it rears back while the ball
// gathers, then drops its jaws onto the line to the target and holds there, the ball fired straight down that line,
// the head kicked up by the recoil. From the library: the dark explosion, recolored.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, rand, WHITE, TAU, posed } from "../../core/index.js";
import * as dark from "../shadow/dark-explosion.js";
import { play, bodyAt, drawFigure, drawOutline } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const MODE = 0.55, FOX = MODE + 0.35, FOXED = FOX + 0.45, GATHER = FOXED, BALL = GATHER + 1.0, FIRE = BALL + 0.12, FLY = 0.3, HIT = FIRE + FLY, TX = 210;
const GOLD = ["#5a2a06", "#c86a10", "#ff9a1c", "#ffc830", "#fff0a0"];
const BB = ["#08040e", "#1c1030", "#3c2070", "#7a4ad0", "#c8b0ff"].map(hex);
// the fox's head, in its own space (snout to the right): the mouth is at MOUTH
const FX0 = 10, FY0 = -60, MOUTH = [FX0 + 36, FY0 + 12], PIVOT = [FX0 - 10, FY0 + 34], AIMT = [TX - 10, -24];
// the head's tilt (radians, + is down toward the target): reared back while it gathers, lowered onto the aim, the recoil
const AIM = (() => {
  // solve for the tilt that puts the jaws on the line to the target (a few rounds of fixed point are plenty)
  let a = 0;
  for (let i = 0; i < 6; i++) {
    const mx = PIVOT[0] + (MOUTH[0] - PIVOT[0]) * Math.cos(a) - (MOUTH[1] - PIVOT[1]) * Math.sin(a), my = PIVOT[1] + (MOUTH[0] - PIVOT[0]) * Math.sin(a) + (MOUTH[1] - PIVOT[1]) * Math.cos(a);
    a = Math.atan2(AIMT[1] - my, AIMT[0] - mx);
  }
  return a;
})();
const tiltAt = (t) => {
  if (t < GATHER) return 0;
  if (t < BALL) return -0.14 * smooth(GATHER, GATHER + 0.4, t) + (AIM + 0.14) * ease.inOutCubic(smooth(BALL - 0.45, BALL - 0.05, t));
  if (t < FIRE) return AIM;
  const r = t - FIRE;
  return AIM - 0.22 * Math.exp(-r * 9) * Math.sin(Math.min(Math.PI, r * 14)) - AIM * smooth(HIT, HIT + 0.5, t);
};
const turn = (x, y, a) => [PIVOT[0] + (x - PIVOT[0]) * Math.cos(a) - (y - PIVOT[1]) * Math.sin(a), PIVOT[1] + (x - PIVOT[0]) * Math.sin(a) + (y - PIVOT[1]) * Math.cos(a)];
const mouthAt = (t) => turn(MOUTH[0], MOUTH[1], tiltAt(t));

export const meta = {
  name: "Tailed beast ball",
  desc: "Naruto in Kurama Chakra Mode: the golden cloak flares over him, a giant chakra fox head rises behind, dark and light chakra are balanced into a black sphere in its jaws and fired, bursting in a dark dome.",
  tags: ["jutsu", "naruto", "kurama", "bijuu", "projectile", "aoe", "one-shot"],
  size: [410, 262],
  origin: [84, 208],
  duration: HIT + 4.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: GOLD, seed: 27 },
};

const BRACE = { ...READY, crouch: 6, lean: -2, fx: 12, fy: -18, bx: -4, by: -20, ffx: 9, fbx: -9 };
const ROAR = { ...READY, crouch: 8, lean: 8, fx: 14, fy: -26, bx: 13, by: -28, armsFront: true, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  ghost: "#ffc830",
  poses: [
    [-0.25, READY],
    [0.05, { ...READY, crouch: 6, fx: 6, fy: -16, bx: 4, by: -16 }, "out"],
    [MODE, BRACE, "snap"],
    [GATHER, { ...BRACE, crouch: 7 }],
    [BALL, ROAR, "out"],
    [FIRE, { ...ROAR, lean: 2, crouch: 10 }, "snap"],
    [HIT + 0.6, { ...BRACE, crouch: 5 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: MODE, stop: 0.08, shake: 0.2, amp: 2, target: false },
    { t: FIRE, stop: 0.05, shake: 0.15, amp: 1, target: false },
    { t: HIT, stop: 0.22, shake: 0.6, amp: 5, push: 6, straw: 44, skin: "shadow" },
    { t: meta.duration - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: MODE, x: 0, n: 10 }, { t: FIRE, x: 4, n: 8, dir: -1 }],
};

// the fox head: inside test in head space (x to the snout, y down), jaw opened by j (0..1)
function inFox(x, y, j) {
  const skull = ((x + 2) / 24) ** 2 + ((y + 2) / 17) ** 2 < 1;
  const ear = (ex, ey) => y < ey + 16 && y > ey && Math.abs(x - ex) < (y - ey) * 0.42;
  const ears = ear(-6, -32) || ear(10, -30);
  const muzzle = x > 8 && x < 40 && y > -6 - (x - 8) * 0.05 && y < 6 - (x - 8) * 0.12;
  const jaw = x > 4 && x < 36 && y > 7 + j * (x - 4) * 0.3 && y < 13 + j * (x - 4) * 0.36 - (x - 4) * 0.12;
  const cheek = ((x + 14) / 12) ** 2 + ((y - 8) / 10) ** 2 < 1;
  // the shoulders and chest of the avatar, which he stands inside
  const torso = ((x + 12) / 22) ** 2 + ((y - 34) / 28) ** 2 < 1 && y < 60;
  return skull || ears || muzzle || jaw || cheek || torso;
}

export const create = play([{ fx: dark, t: HIT, x: TX - 8, y: -16, palette: ["#08040e", "#1c1030", "#3c2070", "#5a34a0", "#7a4ad0", "#a88aff", "#e0d4ff", "#ffffff"], light: 0.8 }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let fired = false;
  const ballR = (t) => (t < GATHER ? 0 : 3 + 7 * ease.outCubic(clamp((t - GATHER) / (BALL - GATHER))));
  const ballPos = (t) => {
    if (t < FIRE) return mouthAt(t);
    const m = mouthAt(FIRE), u = clamp((t - FIRE) / FLY);
    return [m[0] + (AIMT[0] - m[0]) * u, m[1] + (AIMT[1] - m[1]) * u];
  };
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the cloak burns: flames licking up off random points of the body
      if (t > MODE && R.chance(80 * dt)) {
        const r = posed(b.q), i = R.int(0, r.n - 1);
        ps.spawn(P.FIRE, (b.q.x ?? 0) + r.xs[i], r.ys[i], R.range(-8, 8), -R.range(20, 50), R.range(0.12, 0.25), 0, R.range(1, 1.8));
      }
      // light and dark chakra drawn into the jaws, about eight dark to two light
      if (t > GATHER && t < BALL) {
        for (let n = 0; n < 2; n++) if (R.chance(60 * dt)) {
          const a = R.range(0, TAU), d = R.range(30, 60), T = R.range(0.2, 0.35), v = (d * 3) / (Math.exp(3 * T) - 1);
          const m = mouthAt(t);
          ps.spawn(P.STREAK, m[0] + Math.cos(a) * d, m[1] + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.8) ? BB[3] : WHITE);
        }
      }
      if (!fired && t >= FIRE) {
        fired = true;
        const m = mouthAt(t);
        lights.add(m[0], m[1], 80, BB[3], 0.8, 0.2);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      // the fox head: rises in behind him, translucent gold with a burning rim, eye slit, jaws parting
      if (t > FOX && t < HIT + 0.5) {
        const k = ease.outCubic(clamp((t - FOX) / (FOXED - FOX))) * (1 - smooth(HIT, HIT + 0.5, t)), j = smooth(GATHER, BALL, t) * (1 - smooth(FIRE + 0.2, HIT + 0.3, t) * 0.6);
        const oy = FY0 + 20 * (1 - k), f = Math.floor(t * 20);
        // the nine tails (after the reference): great flaming tails fanned out behind, a dark red stroke, an orange rim,
        // a bright yellow body, licking at the tips
        for (let i = 0; i < 9; i++) {
          const a0 = -3.05 + i * 0.2, bend = 0.5 + 0.1 * Math.sin(t * 3 + i), L = (58 + (i % 3) * 8) * k, bx = FX0 - 16, by = oy + 26;
          for (const [pad, col] of [[2.2, hex("#8a1a06")], [1, hex("#ff5a1c")], [0, hex(GOLD[3])]]) {
            for (let sgm = 0; sgm <= 14; sgm++) {
              const u = sgm / 14, aa = a0 + bend * u * (i < 4 ? -1 : 1) * 0.6 + Math.sin(t * 6 + i + u * 4) * 0.06 * u;
              const x = bx + Math.cos(aa) * L * u, y = by + Math.sin(aa) * L * u, w = (2.5 + 6 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * (1 - 0.35 * u);
              if (y > -1) continue;
              p.circle(x, y, w + pad, col);
            }
          }
        }
        const tl = tiltAt(t), ct = Math.cos(-tl), st = Math.sin(-tl), py0 = PIVOT[1] + (oy - FY0);
        p.shade(FX0 - 46, oy - 44, FX0 + 54, Math.min(0, oy + 62), (x, y, out) => {
          // the head turned about its chest: look up the unturned point
          const rx = PIVOT[0] + (x - PIVOT[0]) * ct - (y - py0) * st, ry = py0 + (x - PIVOT[0]) * st + (y - py0) * ct;
          const hx = rx - FX0, hy = ry - oy;
          if (!inFox(hx, hy, j)) return;
          const edge = !inFox(hx - 1.5, hy, j) || !inFox(hx + 1.5, hy, j) || !inFox(hx, hy - 1.5, j) || !inFox(hx, hy + 1.5 + rand(Math.floor(hx), f) * 2, j);
          // the slit eye, the dark of the open mouth
          if (Math.abs(hx - 12) < 4 && Math.abs(hy + 6) < 1.4 - Math.abs(hx - 12) * 0.25) return hex("#1a0a04");
          if (hx > 6 && hx < 34 && hy > 6 - (hx - 4) * 0.1 && hy < 7 + j * (hx - 4) * 0.3) return hex("#3a1004");
          if (y > -0.5) return;
          const flame = rand(Math.floor(hx / 2), Math.floor((hy + t * 40) / 3)) > 0.84;
          // a shell of chakra: a burning rim, a see-through glow inside that thins down the body
          if (edge) {
            out.a = k;
            out.k = 0.3;
            return hex("#ff5a1c");
          }
          // the black seal lines of the cloak: a ring on the chest and stripes down the shoulders
          if (Math.abs(Math.hypot(hx + 10, hy - 34) - 7) < 0.8) return hex("#1a0a04");
          p.blend(x, y, flame ? hex(GOLD[4]) : hy < -6 || hx > 12 ? hex(GOLD[3]) : hex(GOLD[2]), k * (flame ? 0.75 : hy > 14 ? 0.3 : 0.62));
        });
        p.glow(FX0, oy, 70, hex(GOLD[2]), 0.35 * k);
      }
      // the cloak's flaring edge, behind the body
      if (t > MODE) {
        const k = smooth(MODE, MODE + 0.1, t);
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, hex(GOLD[3]), { w: 1, a: k, flick: t * 18 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, hex(GOLD[2]), { w: 2, a: 0.6 * k, flick: t * 13 + 3 });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "kurama", t0: 0.05, t1: MODE, label: "KURAMA", head: b.head });
      if (t > MODE) {
        // the cloak itself: gold over the body, then the black marks: six magatama round the neck and the seal on the belly
        const flare = t - MODE < 0.08;
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: flare ? WHITE : hex(GOLD[3]), k: flare ? 0.9 : 0.62 });
        const [nx, ny] = [b.chest[0], b.chest[1] - 5];
        for (let i = 0; i < 6; i++) {
          const a = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7;
          p.px(nx + Math.cos(a) * 4, ny + Math.sin(a) * 2.5, BB[0]);
        }
        p.ring(b.chest[0], b.chest[1] + 7, 2, 1, BB[0]);
        p.line(b.chest[0] - 3, b.chest[1] + 1, b.chest[0] + 3, b.chest[1] + 1, BB[0]);
      }
      drawGlint(p, t, "kurama", MODE + 0.05, meta.duration - 0.6, b.head);
      // the ball: black and dense with a violet rim and a white sheen, gone heavy and wobbling before it's let go
      const r = ballR(t);
      if (r > 0 && t < HIT) {
        const [x, y] = ballPos(t), w = t < FIRE ? Math.sin(t * 40) * 0.6 : 0;
        p.glow(x, y, r * 4, BB[3], 0.6);
        p.circle(x, y, r + 1.5 + w, BB[3]);
        p.circle(x, y, r + w, BB[1]);
        p.circle(x - 1, y - 1, r * 0.75, BB[0]);
        p.arc(x, y, r - 1, 1, Math.PI * 1.05, Math.PI * 1.45, BB[4]);
        p.px(x - r * 0.45, y - r * 0.5, WHITE);
        if (t < FIRE) for (let i = 0; i < 3; i++) p.ring(x, y, r + 4 + ((t * 30 + i * 4) % 12), 1, i ? BB[3] : BB[4], 0.6);
        if (t >= FIRE) {
          const m = mouthAt(FIRE), dx = AIMT[0] - m[0], dy = AIMT[1] - m[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
          for (let i = 1; i < 4; i++) p.line(x - ux * i * 8, y - uy * i * 8, x - ux * (i * 8 + 7), y - uy * (i * 8 + 7), BB[3]);
        }
      }
      if (t > HIT && t < HIT + 0.08) p.circle(TX - 8, -24, 40, WHITE);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
