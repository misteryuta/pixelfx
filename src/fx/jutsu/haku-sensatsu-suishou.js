// Hijutsu: Sensatsu Suishou (Secret Technique: One Thousand Flying Water Needles of Death, Haku). Narutopedia: with
// one hand, Haku draws water from around the target (puddles, mist) up into countless needles of ice/water that hang
// in the air all round it, then fly in from every direction at once. Here: Haku (the hunter-nin mask) forms the
// one-handed seal; water rises from the puddle under the target in fine threads, and hundreds of thin needles freeze
// out of it, hanging in a ring all round the target, glinting, slowly turning to point inward; a beat; they all fly
// in at once and converge in a dense flash of white; the shattered ice glitters down.
// New: the needles (each a thin glinting line that turns to aim, then flies in), the puddle, the convergence.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEAL = 0.3, RISE = 0.6, HANG = 1.2, AIM = 1.6, FLY = 2.0, HIT = 2.15, END = 3.3, TX = 170;
const ICE = ["#1a4a6a", "#5aa0c8", "#a8e0f8", "#e8faff", "#ffffff"].map(hex);
const N = 64;

export const meta = {
  name: "Thousand flying water needles",
  desc: "Haku: a one-handed seal; water rises from the puddle under the target and freezes into hundreds of thin needles hanging in a ring round it, turning to aim inward, then all of them fly in at once.",
  tags: ["jutsu", "haku", "kiri", "ice", "water", "needles", "multi-hit", "one-shot"],
  size: [250, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a4a6a", "#5aa0c8", "#a8e0f8", "#e8faff"], seed: 193 },
};

const ONEH = { ...READY, crouch: 3, fx: 9, fy: -30, bx: -6, by: -20, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEAL, ONEH, "out"],
    [END, ONEH],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: HANG, stop: 0.06, target: false, sfx: "parry" },
    { t: FLY, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.24, shake: 0.6, amp: 4, push: 2, straw: 60, flash: 0.06, skin: "frost", sfx: "heavy" },
    ...[0.1, 0.2, 0.3].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 0.5, straw: 6, shiver: 0.6 })),
    { t: HIT + 0.8, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // each needle: its slot on a ring (an ellipse round the target), its delay
  const ND = Array.from({ length: N }, (_, i) => ({ a: (i / N) * TAU + rand(i, 1) * 0.1, r: 34 + rand(i, 2) * 16, d: rand(i, 3) * 0.3 }));
  return {
    update(t, dt) {
      if (t > RISE && t < HANG && R.chance(40 * dt)) ps.spawn(P.SPARK, TX + R.range(-20, 20), -1, R.range(-10, 10), -R.range(40, 100), R.range(0.3, 0.5), ICE[2]);
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -26, 100, ICE[3], 0.7, 0.3); for (let i = 0; i < 30; i++) ps.spawn(P.SPARK, TX + R.range(-10, 10), -26 + R.range(-10, 10), R.range(-80, 80), R.range(-120, 40), R.range(0.4, 0.8), ICE[R.int(2, 4)]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the puddle under the target
      p.ellipse(TX, 0.5, 30, 2.5, ICE[0], 0.7 * (1 - smooth(END - 0.4, END, t)));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "haku", t0: 0.04, t1: SEAL, label: "SENSATSU SUISHOU", head: b.head });
      // the hunter-nin mask
      p.ellipse(hx + 1, hy, 3, 3.5, hex("#f0f0f0")); p.px(hx + 2, hy - 1, hex("#a01a1a")); p.px(hx, hy - 1, hex("#a01a1a"));
      // the needles: rising to their places on the ring, glinting, turning to point at the target, then flying in
      for (const n of ND) {
        const up = ease.outCubic(smooth(RISE + n.d, HANG + n.d * 0.5, t));
        if (up <= 0) continue;
        const ox = TX + Math.cos(n.a) * n.r, oy = -28 + Math.sin(n.a) * n.r * 0.9, sx = TX + (rand(n.a * 10, 4) - 0.5) * 30, sy = 0;
        let x = sx + (ox - sx) * up, y = sy + (oy - sy) * up;
        const aim = smooth(AIM, FLY, t), ain = Math.atan2(-28 - y, TX - x), a0 = -Math.PI / 2, a = a0 + (ain - a0) * aim;
        if (t > FLY) { const f = ease.inQuad(clamp((t - FLY - n.d * 0.1) / (HIT - FLY))); x += (TX - x) * f; y += (-28 - y) * f; if (f >= 1) continue; }
        const L = 6, c = Math.cos(a), s = Math.sin(a);
        p.line(x - c * L, y - s * L, x + c * L * 0.4, y + s * L * 0.4, ICE[3]);
        p.px(x + c * L * 0.4, y + s * L * 0.4, WHITE);
        if ((Math.floor(t * 12) + Math.floor(n.a * 10)) % 9 === 0) p.px(x, y - 1, WHITE);
      }
      // the convergence flash
      if (t > HIT && t < HIT + 0.2) { const v = (t - HIT) / 0.2; p.circle(TX, -28, 10 * (1 - v) + 2, WHITE, 1 - v); p.ring(TX, -28, 6 + 30 * v, 1, ICE[3], 1 - v); }
      void noise2;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
