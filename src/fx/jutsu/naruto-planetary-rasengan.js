// Planetary Rasengan (Wakusei Rasengan, Naruto in Nine-Tails Chakra Mode). Narutopedia: a Big Ball Rasengan in one hand,
// surrounded by three regular Rasengan orbiting it like moons round a planet; on contact the disordered rotations of the
// central and smaller ones, spinning in different directions, interact and form a massive, turbulent wave-like vortex.
// Here: the golden chakra cloak flares over him (the black markings, the flame-like rim); a chakra arm reaches out of
// the cloak and helps shape it: a big Rasengan grows in his raised hand; one, two, three small ones spin up and fall
// into orbit round it on tilted rings; he leaps and drives it down into the target; the orbits collapse inward and the
// whole thing tears outward as a churning vortex of wind, rings of turbulence peeling off, the floor scoured.
// New: the cloak's markings, the orbiting moons, the turbulent vortex. From _lib: the Rasengan, the outline, the figure.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawRasengan, drawOutline, drawFigure } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const CLOAK = 0.4, GROW = 0.75, MOONS = [1.1, 1.25, 1.4], LEAP = 1.75, HIT = 2.05, BURST = HIT + 0.35, END = BURST + 1.6, TX = 170;
const GOLD = ["#5a2a06", "#c86a10", "#ff9a1c", "#ffc830", "#fff0a0"].map(hex), RAS = ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"].map(hex);
const INK = hex("#1a0c04");

export const meta = {
  name: "Planetary Rasengan",
  desc: "Naruto in Nine-Tails Chakra Mode: a big Rasengan grows in his raised hand and three small ones fall into orbit round it like moons; he leaps and drives it into the target, the orbits collapse and it tears outward as a turbulent vortex of wind.",
  tags: ["jutsu", "naruto", "rasengan", "kurama", "chakra-mode", "melee", "aoe", "one-shot"],
  size: [300, 210],
  origin: [56, 178],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"], seed: 141 },
};

const RAISE = { ...READY, crouch: 4, lean: -3, fx: 6, fy: -46, bx: -6, by: -22, ffx: 9, fbx: -9 };
const JUMP = { ...RAISE, x: TX - 40, y: -40, crouch: 0, lean: 10, fx: 14, fy: -40, ffy: -10, fby: -12, gait: false };
const SLAM = { ...READY, x: TX - 30, crouch: 12, lean: 18, fx: 22, fy: -22, bx: -8, by: -26, ffx: 12, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#ffc830",
  poses: [
    [-0.25, READY],
    [CLOAK, { ...READY, crouch: 6, fx: 8, fy: -16, bx: 6, by: -16 }, "out"],
    [GROW, RAISE, "out"],
    [LEAP - 0.12, { ...RAISE, crouch: 10 }],
    [LEAP + 0.15, JUMP, "out"],
    [HIT, SLAM, "in"],
    [BURST + 0.6, { ...SLAM, crouch: 9 }],
    [END, { ...READY, x: TX - 30, gait: false }],
  ],
  hits: [
    { t: CLOAK, stop: 0.08, shake: 0.4, amp: 2, target: false, sfx: "cast" },
    ...MOONS.map((t) => ({ t, target: false, sfx: "whoosh" })),
    { t: LEAP, target: false, sfx: "step" },
    { t: HIT, stop: 0.16, shake: 0.4, amp: 3, push: 3, straw: 20, flash: 0.1, sfx: "heavy" },
    { t: BURST, stop: 0.2, shake: 1.0, amp: 7, push: 8, straw: 60, skin: "shock", shiver: 0.7, sfx: "explosion" },
    { t: BURST + 0.7, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: LEAP, x: 0, n: 10, dir: -1 }, { t: BURST, x: TX - 40, n: 22, dir: -1 }, { t: BURST, x: TX + 40, n: 22, dir: 1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // where the big ball is: in the raised hand, then driven down onto the target
  const ballAt = (t, b) => (t < HIT ? [b.handN[0] + 2, b.handN[1] - 6] : [TX + 2, -26]);
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      if (t > CLOAK && R.chance(60 * dt)) ps.spawn(P.FIRE, (b.q.x ?? 0) + R.range(-8, 8), (b.q.y ?? 0) - R.range(0, 40), R.range(-8, 8), -R.range(20, 50), R.range(0.15, 0.3), GOLD[R.int(2, 4)], R.range(1, 1.8));
      if (t >= BURST && !this.b) { this.b = 1; lights.add(TX, -26, 200, RAS[4], 1, 0.5); }
      if (t > BURST && t < BURST + 0.8) for (let n = 0; n < 3; n++) if (R.chance(80 * dt)) { const a = R.range(0, TAU); ps.spawn(P.STREAK, TX + Math.cos(a) * 20, -26 + Math.sin(a) * 20, -Math.sin(a) * 260, Math.cos(a) * 160, R.range(0.15, 0.3), R.chance(0.5) ? WHITE : RAS[3]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), k = smooth(CLOAK, CLOAK + 0.15, t);
      if (k > 0) {
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, GOLD[3], { w: 1, a: k, flick: t * 18 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, GOLD[2], { w: 2, a: 0.6 * k, flick: t * 13 + 3 });
      }
      // the scoured floor after the burst
      if (t > BURST) { const g = ease.outCubic(clamp((t - BURST) / 0.4)); p.ellipse(TX, 0.5, 60 * g, 3, hex("#100c14"), 1 - smooth(END - 0.6, END, t)); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "kurama", t0: 0.04, t1: CLOAK, label: "KURAMA MODE", head: b.head });
      drawGlint(p, t, "kurama", CLOAK, END - 0.3, b.head);
      // the cloak: golden over him, the black markings (the ring at the neck, the magatama on the chest, bars down the limbs)
      if (t > CLOAK) {
        const k = smooth(CLOAK, CLOAK + 0.1, t), flare = t - CLOAK < 0.08;
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: flare ? WHITE : GOLD[3], k: flare ? 0.9 : 0.55 });
        p.ring(b.chest[0], b.chest[1] - 6, 3, 1, INK, k);
        for (let i = 0; i < 6; i++) { const a = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7; p.px(b.chest[0] + Math.cos(a) * 4, b.chest[1] - 6 + Math.sin(a) * 2.5, INK, k); }
        p.ring(b.chest[0], b.chest[1] + 6, 2, 1, INK, k);
        // a chakra arm out of the cloak, cupping the ball as it grows
        if (t > GROW && t < LEAP) { const [bx, by] = ballAt(t, b), u = smooth(GROW, GROW + 0.2, t) * (1 - smooth(LEAP - 0.2, LEAP, t)); p.beam(b.chest[0] - 4, b.chest[1] - 4, bx - 10, by + 6, 4, GOLD[3], u); p.circle(bx - 10, by + 6, 4, GOLD[4], u); }
      }
      // the big ball and its three moons on tilted rings
      if (t > GROW && t < BURST + 0.05) {
        const [bx, by] = ballAt(t, b), R0 = 6 + 8 * ease.outBack(smooth(GROW, GROW + 0.4, t), 1.4);
        const squash = t > HIT ? 1 - smooth(HIT, BURST, t) : 1;
        MOONS.forEach((mt, i) => {
          if (t < mt - 0.1) return;
          const pop = ease.outBack(smooth(mt - 0.1, mt + 0.15, t), 1.8), tilt = [0.35, -0.5, 1.2][i], ph = t * [9, -11, 13][i] + i * 2.1, rr = (R0 + 12 + i * 3) * squash;
          // the orbit ring, behind the ball for its far half
          const ox = Math.cos(ph) * rr, oy = Math.sin(ph) * rr * 0.35, x = bx + ox * Math.cos(tilt) - oy * Math.sin(tilt), y = by + ox * Math.sin(tilt) + oy * Math.cos(tilt);
          for (let a = 0; a < TAU; a += 0.25) { const cx = Math.cos(a) * rr, cy = Math.sin(a) * rr * 0.35; p.dot(bx + cx * Math.cos(tilt) - cy * Math.sin(tilt), by + cx * Math.sin(tilt) + cy * Math.cos(tilt), RAS[3], 0.3 * pop); }
          drawRasengan(p, x, y, 4 * pop, t + i, RAS, pop);
        });
        drawRasengan(p, bx, by, R0, t, RAS, 1);
      }
      // the vortex: a turbulent whirl tearing outward, rings of wind peeling off, the target inside it
      if (t > BURST - 0.05 && t < BURST + 1.2) {
        const u = clamp((t - BURST + 0.05) / 1.25), k = 1 - smooth(0.6, 1, u), Rv = 20 + 70 * ease.outCubic(u);
        p.shade(TX - Rv - 4, -26 - Rv * 0.8, TX + Rv + 4, 2, (x, y, out) => {
          const dx = (x - TX) / Rv, dy = (y + 26) / (Rv * 0.75), d = Math.hypot(dx, dy);
          if (d > 1) return;
          const sw = Math.sin(Math.atan2(dy, dx) * 4 - d * 9 + t * 30 + noise2(dx * 3, dy * 3 + t * 4, 3) * 3);
          if (sw < 0.2) return;
          out.a = k;
          out.k = 0.25;
          return d < 0.25 ? WHITE : sw > 0.8 ? RAS[4] : sw > 0.5 ? RAS[3] : RAS[2];
        });
        for (let i = 0; i < 3; i++) { const v = (u * 2 + i / 3) % 1; p.ellipse(TX, -26, 10 + 90 * v, 6 + 50 * v, (d) => (d > 0.88 ? RAS[4] : 0), (1 - v) * k); }
      }
      void f; void rand;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
