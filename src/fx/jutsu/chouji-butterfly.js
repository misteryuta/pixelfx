// Chou Dan Bakugeki (Butterfly Bullet Bombing, Chouji Akimichi in Butterfly Mode). Narutopedia: the third of the
// Akimichi's three coloured pills, the red one, turns all of Chouji's fat into chakra at once: he becomes gaunt, and
// the surplus chakra bursts out of his back as a pair of butterfly wings; with it he can focus a huge amount of chakra
// into one blow, the Butterfly Bullet Bombing, a fist enlarged by Partial Multi-Size, strong enough to smash the
// ground for hundreds of metres. Here: the pill case at his belt; he swallows the red pill; steam pours off him as his
// body thins; two great butterfly wings of chakra spread out of his back, glowing, their patterns pulsing; he leaps,
// wings beating once, and in the air his right fist swells to giant size; he drives it down onto the target: a crater,
// a column of dust, a ring of chakra; the wings fade into sparkles.
// New: the wings (four lobes, veined, an inner pattern, flutter), the swollen fist, the crater.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const PILL = 0.3, SWALLOW = 0.55, BURN = 0.75, WINGS = 1.05, LEAP = 1.6, APEX = 1.95, GROW = 2.0, SMASH = 2.35, END = 4.2, TX = 160;
const WING = ["#2a1a5a", "#5a4ad0", "#8fb0ff", "#e0f0ff"].map(hex), PINK = hex("#ff8ac8"), SKIN = hex("#e8b890"), RED = hex("#d01a2a");

export const meta = {
  name: "Butterfly bullet bombing",
  desc: "Chouji: the red pill; steam pours off him as he thins and two great butterfly wings of chakra spread from his back; he leaps, his fist swells to giant size, and he smashes it down onto the target, cratering the ground.",
  tags: ["jutsu", "chouji", "akimichi", "butterfly", "taijutsu", "melee", "one-shot"],
  size: [260, 220],
  origin: [56, 188],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a5a", "#5a4ad0", "#8fb0ff", "#ff8ac8"], seed: 157 },
};

const EAT = { ...READY, crouch: 2, lean: -6, fx: 6, fy: -33, bx: -4, by: -22, ffx: 7, fbx: -7 };
const POWER = { ...READY, crouch: 10, lean: 2, fx: 12, fy: -16, bx: -10, by: -16, ffx: 13, fbx: -12 };
const AIR = { ...READY, x: TX - 30, y: -70, crouch: 6, lean: -6, fx: -12, fy: -40, bx: 8, by: -30, ffx: 6, ffy: -6, fbx: -8, fby: -4, gait: false };
const DOWN = { ...READY, x: TX - 14, y: -18, crouch: 8, lean: 20, fx: 20, fy: -10, bx: -8, by: -28, ffx: 4, ffy: -8, fbx: -10, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [PILL, { ...READY, crouch: 3, fx: 4, fy: -14 }, "out"],
    [SWALLOW, EAT, "out"],
    [BURN + 0.1, POWER, "out"],
    [LEAP - 0.05, { ...POWER, crouch: 13 }],
    [APEX, AIR, "out"],
    [GROW + 0.15, { ...AIR, y: -74, fx: -14, fy: -44 }],
    [SMASH, DOWN, "in"],
    [SMASH + 0.4, { ...POWER, x: TX - 16, crouch: 12, fx: 22, fy: -4, gait: false }, "out"],
    [END, { ...POWER, x: TX - 16, gait: false }],
  ],
  hits: [
    { t: SWALLOW, target: false, sfx: "step" },
    { t: BURN, shake: 0.8, amp: 1, target: false, sfx: "cast" },
    { t: WINGS, stop: 0.08, target: false, sfx: "whoosh" },
    { t: LEAP, target: false, sfx: "whoosh" },
    { t: SMASH, stop: 0.3, shake: 1.4, amp: 8, push: 0, straw: 60, flash: 0.1, sfx: "explosion" },
    { t: SMASH + 1.0, flash: 0, push: 0, straw: 0 },
  ],
  dust: [{ t: LEAP, x: 0, n: 10 }, { t: SMASH, x: TX - 30, n: 26, dir: -1 }, { t: SMASH, x: TX + 30, n: 26, dir: 1 }],
};
// flattened under the fist
export const targetState = (t) => (t > SMASH && t < SMASH + 1.4 ? { s: 1 - 0.2 * (1 - smooth(SMASH, SMASH + 1.4, t)), dy: 3 * (1 - smooth(SMASH + 0.3, SMASH + 1.4, t)) } : null);

// one butterfly wing pair seen from the side, rooted at the shoulder blade (x, y), spreading up and back: the big
// forewing with its scalloped trailing edge and the rounder hindwing below; veins from the root, an eye-spot pattern;
// flap 0..1 squashes it as it beats; s scales it; k fades it
const FORE = [[0, 0], [-4, -12], [-12, -26], [-24, -38], [-36, -44], [-44, -40], [-44, -32], [-38, -26], [-40, -18], [-32, -12], [-20, -6], [-8, -2]];
const HIND = [[0, 2], [-10, 4], [-22, 8], [-30, 16], [-30, 26], [-24, 32], [-16, 30], [-10, 20], [-4, 10]];
function wing(p, x, y, s, flap, t, k, dark) {
  if (s <= 0.02 || k <= 0) return;
  const at = ([u, v]) => [x + u * s, y + v * s * (0.45 + 0.55 * flap)];
  for (const [shape, eye] of [[HIND, [-20, 18]], [FORE, [-30, -32]]]) {
    const pts = shape.map(at);
    p.poly(pts, dark ? WING[0] : WING[1], 0.8 * k);
    // the veins
    for (let i = 2; i < pts.length - 1; i += 2) p.line(pts[0][0], pts[0][1], pts[i][0], pts[i][1], WING[2], 0.55 * k);
    // the eye spot and a pink band along the outer edge
    const [ex, ey] = at(eye), pulse = 0.7 + 0.3 * Math.sin(t * 8);
    p.ellipse(ex, ey, 5 * s, 4 * s * (0.45 + 0.55 * flap), PINK, 0.75 * k * pulse);
    p.ellipse(ex, ey, 2.5 * s, 2 * s * (0.45 + 0.55 * flap), WING[3], k);
    p.polyline(pts.slice(2, -2), PINK, 0.7 * k);
    p.polyline([...pts, pts[0]], WING[3], k);
  }
  p.glow(x - 18 * s, y - 14 * s, 34 * s, WING[2], 0.22 * k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t > BURN && t < WINGS + 0.3 && R.chance(40 * dt)) { const b = bodyAt(act.poses, t); ps.spawn(P.SMOKE, b.chest[0] + R.range(-6, 6), b.chest[1] + R.range(-8, 8), R.range(-10, 10), -R.range(30, 60), R.range(0.5, 0.9), hex("#d8d4e0"), 1.2); }
      if (t >= SMASH && !this.s) { this.s = 1; lights.add(TX, -10, 140, WING[2], 0.8, 0.4); for (let i = 0; i < 30; i++) ps.spawn(P.GRIT, TX + R.range(-20, 20), -2, R.range(-180, 180), -R.range(60, 240), R.range(0.5, 1.0), hex("#5a5068")); }
      if (t > SMASH + 0.3 && t < END - 0.6 && R.chance(30 * dt)) { const b = bodyAt(act.poses, t); ps.spawn(P.SPARK, b.chest[0] + R.range(-20, 10), b.chest[1] - R.range(0, 20), R.range(-10, 10), -R.range(10, 30), R.range(0.4, 0.8), R.chance(0.5) ? PINK : WING[2]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), [cx, cy] = b.chest;
      // the wings: spread on the burn, beat once on the leap, held open, then fade to sparkles after the smash
      const s = ease.outBack(smooth(WINGS - 0.1, WINGS + 0.35, t), 1.5), k = 1 - smooth(SMASH + 0.4, SMASH + 1.2, t);
      const beat = t > LEAP && t < APEX ? Math.sin(((t - LEAP) / (APEX - LEAP)) * TAU) : 0, flap = 0.8 + 0.2 * Math.sin(t * 5) - 0.6 * Math.max(0, beat);
      wing(p, cx - 5, cy - 5, s * 0.8, flap, t + 1, k * 0.85, true);
      wing(p, cx - 2, cy - 3, s, flap, t, k, false);
      // the crater
      if (t > SMASH) { const v = smooth(SMASH, SMASH + 0.15, t), kk = 1 - smooth(END - 0.4, END, t); p.ellipse(TX, 1, 40 * v, 4 * v, hex("#08060c"), kk); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI, L = 30 + rand(i, 2) * 30; p.line(TX + Math.cos(a) * 30 * v, 0, TX + Math.cos(a) * (30 + L) * v, 1.5, hex("#0c0a12"), kk); } }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "akimichi", t0: 0.04, t1: PILL, label: "CHOU DAN BAKUGEKI", head: b.head });
      // the pill case and the red pill
      if (t > PILL - 0.1 && t < SWALLOW) { const [x, y] = b.handN; p.circle(x + 1, y - 1, 1.5, RED); p.px(x, y - 2, WHITE); }
      // the giant fist: swelling at the apex, a huge fist with knuckles and a glowing chakra rim, driven down
      if (t > GROW - 0.05 && t < SMASH + 0.6) {
        const g = ease.outBack(smooth(GROW - 0.05, GROW + 0.25, t), 1.6) * (1 - smooth(SMASH + 0.3, SMASH + 0.6, t)), [hx, hy] = b.handN, r = 4 + 18 * g;
        const fy = Math.min(hy, -r * 0.8);
        p.glow(hx, fy, r * 1.6, WING[2], 0.35 * g);
        const D2 = hex("#3a2420"), SH2 = hex("#b07850");
        p.ellipse(hx, fy, r * 1.05 + 1, r * 0.85 + 1, D2);
        p.ellipse(hx, fy, r * 1.05, r * 0.85, SKIN);
        // the four curled fingers along the front, each a knuckle bump with a crease
        for (let i = 0; i < 4; i++) { const yy = fy - r * 0.6 + i * r * 0.4; p.ellipse(hx + r * 0.75, yy, r * 0.32, r * 0.2, SKIN); p.arc(hx + r * 0.75, yy, r * 0.3, 1, -1.4, 1.4, SH2); p.line(hx + r * 0.3, yy + r * 0.18, hx + r * 0.95, yy + r * 0.18, SH2); }
        // the thumb wrapped across the fingers
        p.beam(hx - r * 0.1, fy + r * 0.35, hx + r * 0.6, fy + r * 0.05, Math.max(2, r * 0.3), SKIN); p.line(hx - r * 0.1, fy + r * 0.5, hx + r * 0.6, fy + r * 0.2, SH2);
        p.ellipse(hx - r * 0.4, fy - r * 0.3, r * 0.3, r * 0.2, hex("#f4d4b0"));
        p.arc(hx, fy, r + 2, 1, -1.2, 1.2, WING[3], 0.8 * g);
        p.beam(b.chest[0], b.chest[1], hx - r * 0.6, fy, 3 + 4 * g, SKIN);
      }
      // the smash: a ring of chakra along the floor, a column of dust over the crater
      if (t > SMASH) {
        const v = clamp((t - SMASH) / 0.5);
        p.ellipse(TX, 0, 20 + 110 * v, 4 + 8 * v, (d) => (d > 0.85 ? WING[3] : 0), 1 - v);
        p.shade(TX - 40, -100 * v - 10, TX + 40, 1, (x, y, out) => { const w = 20 + 10 * (y / -100), d = Math.abs(x - TX) / w + 0.3 * noise2(x * 0.1, y * 0.1 - t * 4, 2); if (d > 1 || -y > 100 * v) return; out.a = 0.7 * (1 - smooth(SMASH + 0.3, SMASH + 1.2, t)); return d > 0.6 ? hex("#4a4250") : hex("#6a6270"); });
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
