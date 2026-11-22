// Hakke Rokujuuyon Shou: Shugo Hakke (Eight Trigrams Sixty-Four Palms: Protection, Hinata Hyuuga). Narutopedia:
// Hinata's own defence, developed from the Gentle Fist: her hands move so fast they leave streams of chakra behind,
// forming a dome of thin chakra threads round her that cuts whatever comes in. Here: the Byakugan (veins); the Gentle
// Fist stance, palms forward; her hands blur, and from each a thin bright thread whips out and curls back round her,
// dozens of them, until she stands inside a sphere of interlacing blue-violet lines; she steps forward pushing it and
// the edge of the sphere shreds into the target with a flurry of thin cuts; it unravels.
// New: the chakra threads (each a curve traced by a hand over time), the dome, the shredding contact.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, STANCE = 0.35, WEAVE = 0.6, DOME = 1.4, PUSH = 1.6, CUTS = 1.75, UNRAVEL = 2.6, END = 3.4, TX = 90;
const TH = ["#2a2a6a", "#6a6ad0", "#b0b0ff", "#ececff"].map(hex);

export const meta = {
  name: "Protective eight trigrams sixty-four palms",
  desc: "Hinata: Byakugan, the Gentle Fist stance; her hands blur, trailing thin chakra threads that wrap round her into a dome of interlacing lines; she pushes it forward and its edge shreds into the target with a flurry of cuts.",
  tags: ["jutsu", "hinata", "hyuuga", "byakugan", "gentle-fist", "defence", "multi-hit", "one-shot"],
  size: [220, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2a6a", "#6a6ad0", "#b0b0ff", "#ececff"], seed: 179 },
};

const JUKEN = { ...READY, crouch: 9, lean: 3, fx: 16, fy: -26, bx: 4, by: -30, ffx: 13, fbx: -11 };
const BLUR = (i) => ({ ...JUKEN, fx: 10 + 10 * Math.cos(i * 1.7), fy: -28 + 10 * Math.sin(i * 1.7), bx: 8 + 10 * Math.cos(i * 1.7 + 2), by: -28 + 10 * Math.sin(i * 1.7 + 2) });
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [STANCE, JUKEN, "out"],
    ...Array.from({ length: 10 }, (_, i) => [WEAVE + i * 0.08, BLUR(i), "line"]),
    [PUSH, { ...JUKEN, x: 50, lean: 10, fx: 22, fy: -26, bx: 20, by: -28 }, "out"],
    [UNRAVEL, { ...JUKEN, x: 50 }],
    [END, { ...JUKEN, x: 50 }],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    { t: WEAVE, target: false, sfx: "whoosh" },
    ...Array.from({ length: 8 }, (_, i) => ({ t: CUTS + i * 0.1, stop: 0.02, shake: 0.15, amp: 1, push: 1, straw: 6, flash: 0.02, sfx: i % 3 ? "parry" : "punch" })),
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the threads: each a long arc round her (a great circle seen at its own tilt), drawn in as it is woven
  const THR = Array.from({ length: 22 }, (_, i) => ({ t0: WEAVE + i * 0.035, tilt: rand(i, 1) * Math.PI, a0: rand(i, 2) * TAU, len: 3.6 + rand(i, 3) * 2.4 }));
  return {
    update(t, dt) {
      if (t > CUTS && t < CUTS + 0.8 && R.chance(40 * dt)) ps.spawn(P.SPARK, TX - 6, -R.range(6, 40), R.range(-40, 40), R.range(-60, 20), R.range(0.1, 0.25), TH[3]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head, cx = b.chest[0] + 2, cy = b.chest[1] + 4, Rd = 30;
      drawBadge(p, t, { kind: "byakugan", t0: EYE, t1: STANCE, label: "SHUGO HAKKE", head: b.head });
      drawGlint(p, t, "byakugan", STANCE, END - 0.3, b.head);
      if (t > EYE + 0.1) { const k = smooth(EYE + 0.1, EYE + 0.3, t) * (1 - smooth(END - 0.4, END, t)); p.line(hx + 1, hy - 2, hx - 2, hy - 4, TH[0], k); p.line(hx + 1, hy + 1, hx - 2, hy + 3, TH[0], k); }
      const un = smooth(UNRAVEL, END - 0.2, t);
      for (const th of THR) {
        const grow = clamp((t - th.t0) / 0.35);
        if (grow <= 0) continue;
        const L = th.len * grow * (1 - un), c = Math.cos(th.tilt), s = Math.sin(th.tilt), spin = (t - th.t0) * 1.5;
        let prev = null;
        for (let j = 0; j <= 24; j++) {
          const a = th.a0 + spin + (L * j) / 24, x0 = Math.cos(a) * Rd, y0 = Math.sin(a) * Rd * 0.5, x = cx + x0 * c - y0 * s * 0.4, y = cy + x0 * s * 0.6 + y0 * c, pt = [x + (b.q.x ?? 0) * 0, y];
          if (prev) p.line(prev[0], prev[1], pt[0], pt[1], j > 20 ? TH[3] : TH[2], 0.85);
          prev = pt;
        }
      }
      if (t > DOME - 0.3 && t < UNRAVEL) { const k = smooth(DOME - 0.3, DOME, t); p.ring(cx, cy, Rd, 1, TH[1], 0.5 * k); p.glow(cx, cy, Rd * 1.3, TH[1], 0.25 * k); }
      // the cuts where the sphere's edge meets the target
      for (let i = 0; i < 8; i++) { const c0 = CUTS + i * 0.1, age = t - c0; if (age < 0 || age > 0.12) continue; const y = -10 - rand(i, 5) * 30, a = (rand(i, 6) - 0.5) * 1.4; p.line(TX - 10 + Math.cos(a) * -8, y - Math.sin(a) * 8, TX - 10 + Math.cos(a) * 8, y + Math.sin(a) * 8, WHITE, 1 - age / 0.12); }
      void noise2; void ease;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
