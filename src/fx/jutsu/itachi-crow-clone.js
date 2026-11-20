// Karasu Bunshin (Crow Clone, Itachi). Narutopedia: Itachi's clone made by projecting his chakra into dozens of crows;
// it needs less chakra than a shadow clone, can still fight, and when it's dispersed the crows can gather and form a
// new body at once; his crows carry the Sharingan. Here: his Sharingan, then he bursts into a flock of crows with red
// eyes, they wheel round the target in a storm of black feathers (a genjutsu that holds it), then pour together behind
// it into Itachi, who drives a kunai in.
// New: the crows (drawn here: body, flapping wings, beak, a red eye), the flock's paths, the feathers, the body
// gathering back out of them (drawFigure in black, fading into him).
import { Rng, READY, fit, clamp, smooth, ease, hex, rand, mix, WHITE, TAU, posed } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, BURST = OPEN + 0.15, ORBIT = BURST + 0.4, GATHER = ORBIT + 1.1, REFORM = GATHER + 0.35, STAB = REFORM + 0.25, TX = 140, RX = TX + 26;
const N = 20, INK = hex("#120e18"), WING = hex("#2a2436"), BEAK = hex("#8a8496"), EYEC = hex("#ff2a2a");

export const meta = {
  name: "Crow clone",
  desc: "Itachi: his Sharingan, then he bursts into a flock of red-eyed crows that wheel round the target in a storm of black feathers, pour together behind it into Itachi again, and he drives a kunai in.",
  tags: ["jutsu", "itachi", "clone", "genjutsu", "sharingan", "teleport", "one-shot"],
  size: [260, 160],
  origin: [56, 128],
  duration: STAB + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#120e18", "#2a2436", "#5a5068", "#c8142a", "#ff5a5a"], seed: 38 },
};

export const actorAlpha = (t) => (t >= BURST && t < REFORM ? 0 : 1);

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
const BEHIND = { ...READY, x: RX, yaw: Math.PI, crouch: 3, fx: 8, fy: -22, bx: 4, by: -20, weapon: "dagger", sa: 0 };
const STABP = { ...BEHIND, x: RX - 2, crouch: 5, lean: 10, fx: 17, fy: -26, sa: 0 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [BURST, { ...CALM, crouch: 3 }],
    [REFORM, BEHIND, "snap"],
    [STAB - 0.04, { ...BEHIND, lean: -2 }],
    [STAB, STABP, "snap"],
    [STAB + 0.5, { ...STABP, lean: 4 }],
    [meta.duration, { ...BEHIND, weapon: undefined }],
  ],
  hits: [
    ...[0.3, 0.6, 0.9].map((d) => ({ t: ORBIT + d, stop: 0.02, flash: 0, push: 0.3, straw: 3, shiver: 0.5, skin: "shadow" })),
    { t: STAB, stop: 0.14, shake: 0.25, amp: 2, push: -3, straw: 22, skin: null },
  ],
};

// one crow's path: out of his body, out to a ring round the target, round it, and back in behind it
const crows = Array.from({ length: N }, (_, i) => ({ r: 22 + rand(i, 1) * 26, a0: rand(i, 2) * TAU, sp: (rand(i, 3) > 0.5 ? 1 : -1) * (3 + rand(i, 4) * 2), tilt: 0.35 + rand(i, 5) * 0.25, d: rand(i, 6) * 0.15, src: rand(i, 7) }));
function crowAt(c, i, t, body) {
  const ring = (tt) => {
    const a = c.a0 + c.sp * (tt - ORBIT);
    return [TX + Math.cos(a) * c.r, -30 + Math.sin(a) * c.r * c.tilt - c.r * 0.2];
  };
  const r = body, j = Math.floor(c.src * (r.n - 1)), start = [r.xs[j], r.ys[j]], home = [RX + (rand(i, 8) - 0.5) * 8, -36 + rand(i, 9) * 34];
  if (t < BURST + c.d) return null;
  if (t < ORBIT) {
    const u = ease.outCubic(clamp((t - BURST - c.d) / (ORBIT - BURST - c.d))), e = ring(ORBIT);
    return [start[0] + (e[0] - start[0]) * u, start[1] + (e[1] - start[1]) * u - Math.sin(Math.PI * u) * 20];
  }
  if (t < GATHER) return ring(t);
  if (t < REFORM) {
    const u = ease.inCubic(clamp((t - GATHER) / (REFORM - GATHER))), s = ring(GATHER);
    return [s[0] + (home[0] - s[0]) * u, s[1] + (home[1] - s[1]) * u];
  }
  return null;
}
function crow(p, x, y, ph, face) {
  const up = Math.sin(ph) * 5, RIM = hex("#6a6078");
  // a pale rim of light along the top so the black birds read against a dark sky
  p.glow(x, y, 7, hex("#5a1020"), 0.35);
  p.tri(x, y - 1, x - face * 6, y - up, x - face * 1, y + 0.5, WING);
  p.line(x, y - 1, x - face * 6, y - up, RIM);
  p.ellipse(x, y, 3.6, 1.8, INK);
  p.line(x - face * 2, y - 1.6, x + face * 2, y - 1.6, RIM);
  p.circle(x + face * 3.2, y - 1, 1.7, INK);
  p.line(x + face * 4.6, y - 0.8, x + face * 6, y - 0.4, BEAK);
  p.px(x + face * 3.4, y - 1.6, EYEC);
  p.tri(x - face * 3, y, x - face * 6.5, y - 1, x - face * 6.5, y + 1.5, INK);
}

export const create = play([{ fx: spark, t: STAB, x: TX + 10, flip: true, height: 26, seed: 6 }], (o) => {
  const rest = posed(CALM);
  const feathers = Array.from({ length: 22 }, (_, i) => ({ x: TX + (rand(i, 11) - 0.5) * 90, t0: ORBIT + rand(i, 12) * 1.3, sp: 14 + rand(i, 13) * 10 }));
  return {
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sharingan", t0: EYE, t1: OPEN, label: "SHARINGAN", head: b.head });
      if (actorAlpha(t) > 0) drawGlint(p, t, "sharingan", OPEN + 0.05, meta.duration - 0.3, b.head);
      // the moment he goes: his shape in black, breaking up as the crows leave it
      if (t >= BURST && t < BURST + 0.2) drawFigure(p, CALM, 0, 0, { solid: INK, a: 1 - (t - BURST) / 0.2 });
      // and the moment he comes back: the shape filling in behind the target
      if (t >= GATHER + 0.15 && t < REFORM + 0.12) drawFigure(p, BEHIND, RX, 0, { face: -1, solid: INK, a: clamp((t - GATHER - 0.15) / 0.2) * (1 - smooth(REFORM, REFORM + 0.12, t)) });
      // the feathers: shed by the flock, see-sawing down
      for (const [i, f] of feathers.entries()) {
        const a = t - f.t0;
        if (a < 0 || a > 1.6) continue;
        const x = f.x + Math.sin(a * 5 + i) * 5, y = -70 + a * f.sp * 3.2;
        if (y > -1) continue;
        p.line(x - 1, y - Math.sin(a * 5 + i), x + 1, y + Math.sin(a * 5 + i), WING);
        p.px(x, y, INK);
      }
      crows.forEach((c, i) => {
        const pos = crowAt(c, i, t, rest);
        if (!pos) return;
        const [x, y] = pos, nx = crowAt(c, i, t + 0.03, rest) ?? pos, face = nx[0] >= x ? 1 : -1;
        crow(p, x, y, t * 26 + i * 1.3, face);
      });
    },
  };
});
