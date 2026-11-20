// Fuuton: Rasenshuriken (Naruto, Sage Mode). Narutopedia: the finished Wind Release Rasengan, four great points round a
// Rasengan core like a fuuma shuriken, with a screech; in Sage Mode he can throw it, and where it lands it swells into a
// sphere of countless microscopic wind blades that cut every cell. Here: he stills himself and takes in natural energy
// (the toad-sage pigment round his eyes), raises one hand, the core spins up and grows its four blades with a ring of
// wind, he throws it, and at the target it blows up into a dome of white needles that hangs, then collapses.
// New: the shuriken (core from _lib drawRasengan, blades and ring shaded here), the dome of needles.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawRasengan } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const STILL = 0.05, SAGE = 0.75, FORM = SAGE + 0.1, FORMED = FORM + 0.85, THROW = FORMED + 0.12, FLY = 0.34, HIT = THROW + FLY, EXPAND = 0.22, HANG = HIT + 1.0, TX = 160;
const RAS = ["#0b2a5a", "#2f6fc0", "#5fb0f0", "#b8e6ff", "#eef9ff"];
const NAT = ["#3a5a1a", "#7aa83a", "#d8e070", "#fff3b0"].map(hex);

export const meta = {
  name: "Rasenshuriken",
  desc: "Naruto in Sage Mode: natural energy drawn in, a Rasengan spun up into a four-bladed shuriken of wind over his raised hand, thrown, and blown up at the target into a hanging dome of countless wind needles.",
  tags: ["jutsu", "naruto", "rasengan", "wind", "sage", "projectile", "aoe", "one-shot"],
  size: [320, 200],
  origin: [56, 158],
  duration: HANG + 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: RAS, seed: 23 },
};

const MEDITATE = { ...READY, crouch: 9, lean: 2, armsFront: true, fx: 7, fy: -18, bx: 9, by: -18, ffx: 9, fbx: -8 };
const RAISE = { ...READY, crouch: 3, lean: -3, fx: 4, fy: -44, bx: 9, by: -24, ffx: 8, fbx: -8 };
const WIND = { ...RAISE, lean: -8, fx: -6, fy: -42, bx: 6, by: -22, crouch: 4 };
const THROWN = { ...READY, crouch: 6, lean: 12, fx: 18, fy: -30, bx: -8, by: -20, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [STILL, MEDITATE, "out"],
    [SAGE, { ...MEDITATE, crouch: 8 }],
    [SAGE + 0.15, RAISE, "out"],
    [FORMED, { ...RAISE, crouch: 4 }],
    [THROW - 0.04, WIND, "out"],
    [THROW, THROWN, "snap"],
    [THROW + 0.5, { ...THROWN, lean: 6 }],
    [HANG + 0.4, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.12, shake: 0.3, amp: 2, push: 2, straw: 20 },
    ...[0.2, 0.35, 0.5, 0.65, 0.8].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 0.8, straw: 10, shiver: 0.3 })),
    { t: HANG + 0.05, stop: 0.12, shake: 0.4, amp: 3, push: 4, straw: 34, skin: "shock" },
    { t: meta.duration - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: THROW, x: 8, n: 6, dir: -1 }],
};

// the shuriken: a core with four swept blades and a thin ring, at (x, y), radius s of the blades, spin angle a
function shuriken(p, x, y, s, a, t, C, k = 1) {
  if (k <= 0) return;
  const L = s * k;
  p.glow(x, y, L * 1.8, C[3], 0.5 * k);
  p.shade(x - L - 2, y - L - 2, x + L + 2, y + L + 2, (px, py, out) => {
    const dx = px - x, dy = py - y, r = Math.hypot(dx, dy);
    if (r > L || r < 5) return;
    const th = Math.atan2(dy, dx) - a - (r / L) * 0.9, f = ((th % (TAU / 4)) + TAU) % (TAU / 4), w = 0.62 * (1 - r / L) + 0.04;
    if (f > w) return Math.abs(r - L * 0.62) < 0.6 ? C[3] : undefined;
    out.k = 0.2;
    // white along the leading edge, pale blue behind, streaks of air through it
    return f < w * 0.28 ? WHITE : Math.sin(r * 1.3 - t * 40) > 0.6 ? C[4] : C[3];
  });
  drawRasengan(p, x, y, 6, t, C, 1);
}

export const create = play([], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let hit = false;
  const flight = (t) => {
    const u = clamp((t - THROW) / FLY), b0 = [8, -48];
    return [b0[0] + (TX - 6 - b0[0]) * u, b0[1] + (-26 - b0[1]) * ease.inQuad(u) - Math.sin(Math.PI * u) * 8];
  };
  return {
    update(t, dt) {
      // natural energy: motes of the world drifting in to him while he keeps still
      if (t > STILL && t < SAGE && R.chance(50 * dt)) {
        const a = R.range(-Math.PI, 0), d = R.range(18, 34), T = R.range(0.3, 0.5), v = (d * 2) / (Math.exp(2 * T) - 1);
        ps.spawn(P.EMBER, Math.cos(a) * d, -20 + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, NAT[R.int(1, 3)]);
      }
      if (t > FORM && t < THROW && R.chance(70 * dt)) {
        const b = bodyAt(act.poses, t), a = R.range(0, TAU), d = R.range(14, 26);
        ps.spawn(P.STREAK, b.handN[0] + Math.cos(a) * d, b.handN[1] - 9 + Math.sin(a) * d, Math.sin(a) * 160, -Math.cos(a) * 160, 0.08, R.chance(0.5) ? WHITE : hex(RAS[3]));
      }
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(TX - 6, -26, 120, hex(RAS[3]), 1, 0.3);
      }
      if (t > HIT && t < HANG && R.chance(90 * dt)) {
        const a = R.range(0, TAU), s = R.range(150, 300);
        ps.spawn(P.STREAK, TX - 6 + Math.cos(a) * 10, -26 + Math.sin(a) * 10, Math.cos(a) * s, Math.sin(a) * s, R.range(0.06, 0.14), WHITE);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sage", t0: STILL + 0.25, t1: SAGE, label: "SENNIN MODO", head: b.head });
      // the sage marks: the red-orange pigment round his eyes, kept for the rest of the move
      if (t > SAGE) {
        p.px(b.head[0] + 1, b.head[1] - 1.5, hex("#e2662b"));
        p.px(b.head[0] + 3, b.head[1] - 1.5, hex("#e2662b"));
      }
      drawGlint(p, t, "sage", SAGE + 0.05, meta.duration - 0.5, b.head);
      if (t > STILL && t < SAGE + 0.2) {
        // a hush of natural energy round him: a soft ring that settles on the body
        const k = smooth(STILL, STILL + 0.3, t) * (1 - smooth(SAGE, SAGE + 0.2, t));
        p.ellipse(0, -0.5, 16, 2.2, NAT[1], 0.5 * k);
        p.glow(2, -18, 30, NAT[2], 0.25 * k);
      }
      if (t < THROW) {
        const k = t < FORM ? 0 : ease.outCubic(clamp((t - FORM) / (FORMED - FORM)));
        const hx = b.handN[0], hy = b.handN[1] - 9;
        if (k > 0) shuriken(p, hx, hy, 9 + 13 * k, -t * 26, t, C, Math.min(1, k * 1.4));
        // the screech: rings snapping off it
        if (k > 0.6) {
          const ph = (t * 6) % 1;
          p.ring(hx, hy, 24 + ph * 14, 1, C[3], 1 - ph);
        }
      } else if (t < HIT) {
        const [x, y] = flight(t);
        shuriken(p, x, y, 22, -t * 30, t, C, 1);
        for (let i = 1; i < 4; i++) p.line(x - i * 9, y - 1 + i, x - i * 9 - 8, y - 1 + i * 1.2, C[3], 1 - i * 0.25);
      } else if (t < HANG + 0.5) {
        // the dome of needles: it swells, hangs full of wind blades, and caves in
        const a = t - HIT, grow = ease.outBack(clamp(a / EXPAND), 1.6), cave = smooth(HANG, HANG + 0.25, t), Rd = 46 * grow * (1 - cave * 0.9);
        const cx = TX - 6, cy = -26 + Rd * 0.25;
        if (a < 0.05) p.circle(cx, cy, 30, WHITE);
        p.shade(cx - Rd, cy - Rd, cx + Rd, Math.min(0, cy + Rd), (px, py, out) => {
          const dx = (px - cx) / Rd, dy = (py - cy) / Rd, d2 = dx * dx + dy * dy;
          if (d2 > 1 || py > 0) return;
          const z = Math.sqrt(1 - d2), f = Math.floor(t * 30);
          // countless needles: short white strokes on random angles, re-drawn every frame
          const n = Math.sin(px * 12.9898 + py * 78.233 + f * 3.1) * 43758.5453, g = n - Math.floor(n);
          out.k = 0.2;
          if (d2 > 0.9) return g > 0.3 ? WHITE : C[3];
          if (g > 0.93) return WHITE;
          if (g > 0.8) return C[4];
          out.a = 0.35 + 0.5 * z;
          return mix(C[2], C[3], z);
        });
        p.glow(cx, cy, Rd * 1.6, C[3], 0.6 * (1 - cave));
        if (cave > 0) p.ring(cx, cy, Rd + 20 * cave, 1, WHITE, 1 - cave);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
