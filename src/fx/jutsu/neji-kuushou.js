// Hakke Kuushou (Eight Trigrams Vacuum Palm) into Hakke Hasangeki (Eight Trigrams Mountain Crusher), Neji Hyuuga.
// Narutopedia: Vacuum Palm: a palm thrust at blinding speed that fires a ball of compressed air/chakra at the target
// from a distance, strong enough to blow it away (the vacuum pocket). Mountain Crusher: a far bigger blast of chakra
// from the palm, wide as a wall, that can crush a giant. Here: the Byakugan (veins round the eyes), the Gentle Fist
// stance with the palm out; one, two Vacuum Palms: the palm snaps, a clear shell of compressed air (a refracting
// ring, a pressure cone) blows across and slams the target back; then he draws his palm to his hip, chakra flaring
// blue round the hand, and drives it out: the Mountain Crusher, a huge palm-shaped wave of chakra that rolls over the
// target and leaves a gouge in the floor.
// New: the vacuum shell (a lens of warped air), the palm-shaped chakra wave.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, STANCE = 0.35, P1 = 0.75, P2 = 1.2, DRAW = 1.7, FIRE = 2.15, WAVEHIT = 2.4, END = 3.8, TX = 170;
const CH = ["#1a3a6a", "#3a7ad0", "#8fd0ff", "#e8f8ff"].map(hex);

export const meta = {
  name: "Eight trigrams vacuum palm",
  desc: "Neji: Byakugan, the Gentle Fist stance; two Vacuum Palms fire shells of compressed air that slam the target back, then the Mountain Crusher, a huge palm-shaped wave of chakra that rolls over it and gouges the floor.",
  tags: ["jutsu", "neji", "hyuuga", "byakugan", "gentle-fist", "projectile", "one-shot"],
  size: [270, 170],
  origin: [50, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a3a6a", "#3a7ad0", "#8fd0ff", "#e8f8ff"], seed: 152 },
};

const JUKEN = { ...READY, crouch: 9, lean: 4, fx: 18, fy: -27, bx: -4, by: -30, ffx: 14, fbx: -11 };
const THRUST = { ...JUKEN, crouch: 8, lean: 12, fx: 27, fy: -26, bx: -8, by: -22, ffx: 16, fbx: -12 };
const HIP = { ...JUKEN, crouch: 12, lean: -2, fx: -4, fy: -18, bx: 14, by: -28, ffx: 15, fbx: -12, twist: -3 };
const CRUSH = { ...JUKEN, crouch: 11, lean: 16, fx: 29, fy: -24, bx: -10, by: -24, ffx: 18, fbx: -13, twist: 2 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [STANCE, JUKEN, "out"],
    [P1 - 0.1, { ...JUKEN, fx: 10 }, "out"],
    [P1, THRUST, "snap"],
    [P1 + 0.2, JUKEN, "out"],
    [P2 - 0.1, { ...JUKEN, fx: 10 }, "out"],
    [P2, THRUST, "snap"],
    [P2 + 0.2, JUKEN, "out"],
    [DRAW, HIP, "out"],
    [FIRE - 0.02, { ...HIP, crouch: 13 }],
    [FIRE, CRUSH, "snap"],
    [END - 0.6, CRUSH],
    [END, JUKEN],
  ],
  hits: [
    { t: P1, target: false, sfx: "whoosh" },
    { t: P1 + 0.18, stop: 0.08, shake: 0.2, amp: 2, push: 5, straw: 12, sfx: "punch" },
    { t: P2, target: false, sfx: "whoosh" },
    { t: P2 + 0.18, stop: 0.08, shake: 0.3, amp: 2, push: 6, straw: 16, sfx: "punch" },
    { t: FIRE, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: WAVEHIT, stop: 0.22, shake: 0.8, amp: 5, push: 12, straw: 40, flash: 0.08, skin: "frost", sfx: "explosion" },
    { t: WAVEHIT + 0.9, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= WAVEHIT && !this.w) { this.w = 1; lights.add(TX, -20, 110, CH[2], 0.8, 0.3); for (let i = 0; i < 24; i++) ps.spawn(P.GRIT, TX + R.range(-20, 30), -1, R.range(20, 160), -R.range(40, 160), R.range(0.4, 0.8), hex("#5a5068")); }
      if (t > DRAW && t < FIRE && R.chance(40 * dt)) { const b = bodyAt(act.poses, t); ps.spawn(P.SPARK, b.handN[0] + R.range(-4, 4), b.handN[1] + R.range(-4, 4), R.range(-20, 20), -R.range(10, 40), R.range(0.15, 0.3), CH[R.int(1, 3)]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the gouge the wave leaves in the floor
      if (t > FIRE + 0.05) { const b = bodyAt(act.poses, FIRE), x0 = b.handN[0], x1 = x0 + (TX + 30 - x0) * smooth(FIRE, WAVEHIT + 0.1, t); p.shade(x0, -2, x1, 2, (x, y, out) => { if (Math.abs(y) > 1.2 + 0.5 * noise2(x * 0.2, 1, 2)) return; out.a = 1 - smooth(END - 0.5, END, t); return hex("#0a0810"); }); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "byakugan", t0: EYE, t1: STANCE, label: "HAKKE KUUSHOU", head: b.head });
      drawGlint(p, t, "byakugan", STANCE, END - 0.3, b.head);
      // the veins round the eyes
      if (t > EYE + 0.1) { const [hx, hy] = b.head, k = smooth(EYE + 0.1, EYE + 0.3, t) * (1 - smooth(END - 0.4, END, t)); p.line(hx + 1, hy - 2, hx - 2, hy - 4, CH[0], k); p.line(hx + 1, hy + 1, hx - 2, hy + 3, CH[0], k); }
      // the vacuum shells: a lens of warped air flying from the palm, ringed by pressure, punching the target back
      for (const t0 of [P1, P2]) {
        const age = t - t0;
        if (age < 0 || age > 0.35) continue;
        const pal = bodyAt(act.poses, t0), sx = pal.handN[0] + 3, sy = pal.handN[1], u = clamp(age / 0.18), x = sx + (TX - 4 - sx) * ease.outQuad(u), r = 4 + 6 * u;
        if (age < 0.18) {
          warp(p, x, sy, r + 2, 0.15, 0.5);
          p.ring(x, sy, r, 1, WHITE, 0.7);
          p.arc(x - 2, sy, r + 2, 1, -1, 1, CH[2], 0.7);
          for (let i = 0; i < 4; i++) p.line(x - r - 4 - i * 6, sy - r * 0.6 + i * r * 0.4, x - r - 10 - i * 6, sy - r * 0.6 + i * r * 0.4, CH[3], 0.5);
          // the palm print of air left at the hand
          if (age < 0.06) p.ring(sx, sy, 3 + age * 60, 1, WHITE, 1 - age / 0.06);
        } else {
          const v = (age - 0.18) / 0.17;
          p.ring(TX - 2, sy, 6 + 14 * v, 1, WHITE, 1 - v);
          p.ring(TX - 2, sy, 3 + 8 * v, 1, CH[2], 1 - v);
        }
      }
      // the chakra flaring round his hand as he draws it to his hip
      if (t > DRAW - 0.2 && t < FIRE + 0.05) { const [hx, hy] = b.handN, k = smooth(DRAW - 0.2, FIRE, t); p.glow(hx, hy, 8 * k, CH[2], 0.6 * k); p.circle(hx, hy, 2 + 2 * k, CH[3], k); }
      // the Mountain Crusher: a palm-shaped wall of chakra (a broad palm with four finger-lobes), rolling forward from
      // the hand, turbulent, swallowing the target
      if (t > FIRE && t < END - 0.3) {
        const pal = bodyAt(act.poses, FIRE), sx = pal.handN[0] + 4, sy = pal.handN[1], u = ease.outCubic(clamp((t - FIRE) / (WAVEHIT - FIRE + 0.15))), x = sx + (TX + 20 - sx) * u, H = 14 + 24 * u, k = 1 - smooth(WAVEHIT + 0.3, END - 0.3, t);
        p.shade(sx - 4, sy - H - 16, x + 18, 1, (X, Y, out) => {
          const dx = (X - x) / 14, dy = (Y - sy) / H;
          // the palm: an ellipse; four finger-lobes on its leading edge
          let d = Math.hypot(Math.min(0, dx + 0.4) * 1.0 + Math.max(0, dx) * 1.0, dy);
          for (let f = 0; f < 4; f++) { const fy = -0.75 + f * 0.5, fd = Math.hypot((dx - 0.7) / 0.6, (dy - fy) / 0.18); d = Math.min(d, fd); }
          // the trailing body back to the hand, thinning
          const tail = (X - sx) / Math.max(1, x - sx), td = Math.abs(dy) / (0.2 + 0.8 * tail);
          if (X < x && X > sx) d = Math.min(d, td + 0.15);
          d += 0.18 * noise2(X * 0.12 - t * 10, Y * 0.12, 3);
          if (d > 1 || Y > 0) return;
          out.a = k * (d > 0.75 ? 0.6 : 0.85);
          return d > 0.75 ? CH[1] : d > 0.45 ? CH[2] : CH[3];
        });
        p.glow(x, sy, H, CH[2], 0.35 * k);
      }
      void rand;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
