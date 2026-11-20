// Hakkeshou Kaiten (Eight Trigrams Palms Revolving Heaven, Neji). Narutopedia: a secret Hyuuga taijutsu; with the
// Byakugan's sight all round them, the user lets chakra out of every tenketsu at once and spins, turning the chakra into
// a whirling dome that blocks any attack and throws back whatever touches it. Here: the Byakugan, veins standing out at
// his temples, the Gentle Fist stance, then he spins on his heel and a dome of chakra whirls up round him, grows, slams
// the target away, and leaves a ring gouged in the floor.
// New: the dome (a shaded half-sphere, see-through, with bands of chakra spinning round it), the spin (yaw on the rig),
// the gouged ring, the veins. The target charges in at him and is caught by the dome as it opens: it is in range.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, STANCE = OPEN + 0.1, SPIN = STANCE + 0.3, FULL = SPIN + 0.35, STOP = FULL + 0.6, TX = 70, RD = 40;
const BK = ["#1a2a5a", "#3a5aa8", "#7aa8e8", "#c8e0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Revolving heaven",
  desc: "Neji: the Byakugan with veins at his temples, the Gentle Fist stance, then he spins and a whirling dome of chakra rises round him, grows, throws the target away and leaves a ring gouged in the floor.",
  tags: ["jutsu", "neji", "hyuuga", "byakugan", "defense", "aoe", "knockback", "one-shot"],
  size: [240, 140],
  origin: [90, 112],
  duration: STOP + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a2a5a", "#3a5aa8", "#7aa8e8", "#c8e0ff", "#ffffff"], seed: 49 },
};

const JUUKEN = { ...READY, crouch: 8, lean: 4, fx: 18, fy: -24, bx: -10, by: -22, ffx: 12, fbx: -10 };
const ARMS = { ...READY, crouch: 6, fx: 13, fy: -26, bx: -13, by: -26, ffx: 7, fbx: -7 };
const spinKeys = Array.from({ length: 12 }, (_, i) => [SPIN + (i + 1) * ((STOP - SPIN) / 12), { ...ARMS, yaw: (i + 1) * Math.PI * 0.6 }, "line"]);
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [STANCE, JUUKEN, "out"],
    [SPIN, ARMS, "snap"],
    ...spinKeys,
    [STOP + 0.15, { ...JUUKEN, yaw: Math.PI * 7.2 }, "out"],
    [STOP + 0.5, JUUKEN],
    [meta.duration, JUUKEN],
  ],
  hits: [
    { t: FULL, stop: 0.14, shake: 0.35, amp: 3, push: 5, straw: 34 },
    { t: FULL + 0.2, stop: 0.03, flash: 0, push: 1, straw: 8 },
  ],
  dust: [{ t: SPIN, x: 0, n: 10 }],
};

// the target rushes him, meets the dome right as it opens, is hurled back and walks back to its spot
export const targetState = (t) => {
  if (t < STANCE) return null;
  if (t < FULL) {
    const u = ease.inQuad(smooth(STANCE, FULL, t));
    return { dx: -34 * u, rot: -0.18 * u };
  }
  if (t < FULL + 0.5) {
    const v = ease.outCubic((t - FULL) / 0.5);
    return { dx: -34 + 78 * v, dy: -20 * Math.sin(Math.PI * v), rot: 0.7 * Math.sin(Math.PI * v) };
  }
  const w = smooth(STOP + 0.2, meta.duration - 0.1, t);
  return { dx: 44 * (1 - w) };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const radius = (t) => (t < SPIN ? 0 : t < FULL ? 14 + (RD - 14) * ease.outCubic((t - SPIN) / (FULL - SPIN)) : RD * (1 - 0.08 * smooth(FULL, STOP, t)));
  return {
    update(t, dt) {
      if (t > SPIN && t < STOP && R.chance(70 * dt)) {
        const r = radius(t), s = R.chance(0.5) ? 1 : -1;
        ps.spawn(P.DUST, s * r, -1, s * R.range(40, 120), -R.range(4, 30), R.range(0.3, 0.6), hex("#a08c7a"), R.range(2, 3), 0, 0);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      if (t > SPIN) {
        const k = 1 - smooth(STOP + 0.4, STOP + 1.2, t), r = radius(Math.min(t, STOP));
        p.ellipse(0, 0.5, r, 3, hex("#120c18"), 0.75 * k);
        p.ellipse(0, 0, r - 2, 1.5, BK[1], 0.5 * k);
      }
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugan", t0: EYE, t1: OPEN, label: "BYAKUGAN", head: b.head });
      drawGlint(p, t, "byakugan", OPEN + 0.05, meta.duration - 0.3, b.head);
      if (t > OPEN) for (const s of [-1, 1]) {
        p.line(hx + 2 + s * 1.5, hy - 1, hx + 2 + s * 3, hy - 2.5, hex("#b97a8e"));
        p.px(hx + 2 + s * 3.5, hy, hex("#b97a8e"));
      }
      // the dome: a see-through half-sphere of chakra with bright bands whirling round it
      if (t > SPIN && t < STOP + 0.15) {
        const r = radius(t), k = 1 - smooth(STOP - 0.05, STOP + 0.15, t);
        p.glow(0, -r * 0.4, r * 1.6, BK[2], 0.5 * k);
        p.shade(-r - 1, -r - 1, r + 1, 0, (x, y, out) => {
          const dx = x / r, dy = y / r, d2 = dx * dx + dy * dy;
          if (d2 > 1 || y > 0) return;
          const z = Math.sqrt(1 - d2), lon = Math.atan2(z, dx) + t * 22, lat = Math.asin(Math.min(1, -dy));
          const band = Math.sin(lon * 3 + lat * 4);
          if (d2 > 0.9) {
            out.a = k;
            return band > 0 ? BK[4] : BK[3];
          }
          if (band > 0.8) {
            out.a = k;
            out.k = 0.2;
            return BK[3];
          }
          p.blend(x, y, band > 0.2 ? BK[2] : BK[1], 0.3 * k);
        });
        if (t - SPIN < 0.05) p.circle(0, -14, 14, WHITE);
      }
      ps.draw(p, "front");
    },
  };
});
