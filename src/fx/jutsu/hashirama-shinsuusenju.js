// Mokuton: Shinsuusenju (Wood Release: True Several Thousand Hands, Hashirama in Sage Mode). Narutopedia: a colossal
// wooden Buddha with countless arms in rings behind it, called up with a single clap; its hands come down like a
// rain of mountains ("Choujou Kebutsu"). Here: the clap, the floor heaving, and behind him the statue climbing out of
// the ground, its face of plates, halo after halo of arms unfolding; then the hands: one after another, each the size
// of a house, palms down, out of the sky onto the target, every one cracking the floor wider; a last clap of his and
// all the hands come down at once, a dome of dust and splinters.
// New: the statue, its rings of arms, the palm strikes. From _lib: blast, chunks; library: ground slam.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import * as slam from "../impacts/ground-slam.js";
import { play, bodyAt, drawChunk } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const TX = 230, CLAP = 0.45, RISE = 0.6, RISEN = 1.7, PALMS = [1.95, 2.18, 2.38, 2.56], LAST = 2.95, ALL = 3.12, END = 4.9;
const WOOD = ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a", "#e0b878"].map(hex);
const SAGE = hex("#e2662b");
// the statue stands behind him, its head here (local space)
const SX = 20, HEADY = -210;

export const meta = {
  name: "Wood release: true several thousand hands",
  desc: "Hashirama in Sage Mode: one clap and a colossal wooden Buddha climbs out of the ground behind him, halo upon halo of arms; its house-sized palms come down one after another onto the target, then all at once.",
  tags: ["jutsu", "hashirama", "wood", "mokuton", "senjutsu", "summon", "aoe", "one-shot"],
  size: [440, 300],
  origin: [80, 270],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a", "#e0b878"], seed: 61 },
};

const PRAY = { ...READY, crouch: 6, lean: 2, armsFront: true, fx: 9, fy: -29, bx: 10, by: -29, ffx: 10, fbx: -10 };
const OPEN = { ...READY, crouch: 5, lean: -1, fx: -4, fy: -32, bx: 15, by: -33, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  ghost: "#b8864a",
  poses: [
    [-0.25, READY],
    [CLAP - 0.12, OPEN, "out"],
    [CLAP, PRAY, "snap"],
    [LAST - 0.12, { ...PRAY, crouch: 7 }],
    [LAST - 0.02, OPEN, "out"],
    [ALL - 0.02, { ...PRAY, crouch: 9, lean: 4 }, "snap"],
    [END - 0.4, { ...PRAY, crouch: 6 }],
    [END, READY],
  ],
  hits: [
    { t: CLAP, stop: 0.08, shake: 0.2, amp: 2, target: false, sfx: "clash" },
    { t: RISE + 0.1, shake: 1.0, amp: 2, target: false, sfx: "rumble" },
    ...PALMS.map((t, i) => ({ t, stop: 0.06, shake: 0.3, amp: 3 + i, push: 3, straw: 16, skin: "char", sfx: "heavy" })),
    { t: LAST, stop: 0.06, target: false, sfx: "clash" },
    { t: ALL, stop: 0.24, shake: 1.2, amp: 8, push: 8, straw: 70, skin: "char", shiver: 0.6, sfx: "explosion" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: SX - 40, n: 20, dir: -1 }, { t: RISE, x: SX + 60, n: 20, dir: 1 }, ...PALMS.map((t) => ({ t, x: TX, n: 14, dir: 1 })), { t: ALL, x: TX - 40, n: 24, dir: -1 }],
};
// crushed under the last hands: flattened, then springing back
export const targetState = (t) => {
  if (t < PALMS[0]) return null;
  const pulse = PALMS.reduce((s, h) => s + Math.exp(-Math.max(0, t - h) * 14) * (t >= h ? 1 : 0), 0);
  const all = t >= ALL ? Math.exp(-(t - ALL) * 3) : 0;
  return { dy: 4 * pulse + 10 * all, s: 1 - 0.08 * pulse - 0.25 * all, a: 1 - 0.6 * (t > ALL && t < ALL + 0.5 ? 1 : 0) };
};

// a hand the size of a house: palm toward the ground, coming down along `ang` (radians, 0 = straight down), shaded wood
function palm(p, x, y, s, ang, k = 1) {
  const c = Math.cos(ang), sn = Math.sin(ang), at = (u, v) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s];
  // the forearm trailing up out of the sky
  p.beam(...at(0, -60), ...at(0, -14), 18 * s, WOOD[2], k);
  p.beam(...at(-3, -60), ...at(-3, -14), 6 * s, WOOD[3], k);
  // the palm and the fingers spread, the thumb out to one side
  p.poly([at(-13, -14), at(13, -14), at(15, 6), at(-15, 6)], WOOD[3], k);
  for (let i = 0; i < 4; i++) {
    const fx = -11 + i * 7.4, L = i === 1 || i === 2 ? 16 : 13;
    p.beam(...at(fx, 4), ...at(fx * 1.05, 4 + L), 4.4 * s, WOOD[0], k);
    p.beam(...at(fx, 4), ...at(fx * 1.05, 4 + L - 0.6), 3.4 * s, WOOD[i % 2 ? 4 : 3], k);
    p.circle(...at(fx * 1.05, 4 + L - 1), 1.7 * s, WOOD[i % 2 ? 4 : 3], k);
    p.line(...at(fx + 1, 6), ...at(fx * 1.05 + 1, 4 + L), WOOD[5], 0.6 * k);
  }
  p.beam(...at(14, -6), ...at(24, 4), 3.6 * s, WOOD[3], k);
  // the grain: dark seams along the back of the hand
  for (let i = -2; i <= 2; i++) p.line(...at(i * 5, -14), ...at(i * 5.5, 4), WOOD[1], 0.7 * k);
}

export const create = play([{ fx: slam, t: ALL, x: TX, reach: 140, palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a", "#e0b878", "#ffffff"] }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), chunks = [];
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const rise = (t) => ease.outCubic(smooth(RISE, RISEN, t));
  const splinters = (x, n, s) => {
    for (let i = 0; i < n; i++) chunks.push({ x: x + R.range(-20, 20), y: -2, vx: R.range(-140, 140), vy: -R.range(80, 260) * s, a: R.range(0, TAU), va: R.range(-12, 12), s: R.range(2, 4.5), life: R.range(0.6, 1.2), age: 0 });
  };
  return {
    update(t, dt) {
      if (t > RISE && t < RISEN && R.chance(60 * dt)) ps.spawn(P.GRIT, SX + R.range(-70, 70), -1, R.range(-40, 40), -R.range(60, 200), R.range(0.5, 1), WOOD[R.int(1, 3)]);
      PALMS.forEach((h, i) => { if (t >= h) once("p" + i, () => { splinters(TX, 8, 1); lights.add(TX, -10, 80, WOOD[4], 0.6, 0.2); }); });
      if (t >= ALL) once("all", () => { splinters(TX, 26, 1.4); lights.add(TX, -30, 220, WOOD[5], 1, 0.5); });
      for (let i = chunks.length - 1; i >= 0; i--) {
        const c = chunks[i];
        c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.age += dt;
        if (c.y > -1 && c.vy > 0) { c.y = -1; c.vy *= -0.3; c.vx *= 0.6; }
        if (c.age > c.life) chunks.splice(i, 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const r = rise(t), k = 1 - smooth(END - 0.9, END - 0.2, t);
      if (r > 0 && k > 0) {
        const lift = (1 - r) * 230, hy = HEADY + lift;
        // the halo of arms: rings of them fanned out behind the body, unfolding one ring after another
        for (let ring = 0; ring < 3; ring++) {
          const open = ease.outBack(smooth(RISEN - 0.6 + ring * 0.12, RISEN + 0.1 + ring * 0.12, t), 1.2), n = 9 + ring * 3, Rr = (70 + ring * 26) * open;
          for (let i = 0; i < n; i++) {
            const a = Math.PI + (i / (n - 1)) * Math.PI, wob = Math.sin(t * 2 + i + ring) * 0.03;
            const x0 = SX + Math.cos(a + wob) * 20, y0 = hy + 70 + Math.sin(a + wob) * 14, x1 = SX + Math.cos(a + wob) * Rr, y1 = hy + 70 + Math.sin(a + wob) * Rr * 0.9;
            if (open <= 0.02) continue;
            const mx = (x0 + x1) / 2 - Math.sin(a) * 8, my = (y0 + y1) / 2 + Math.cos(a) * 6, w = 6 - ring * 1.2, col = WOOD[ring === 0 ? 3 : ring === 1 ? 2 : 1];
            p.beam(x0, y0, mx, my, w + 1, WOOD[0], k);
            p.beam(mx, my, x1, y1, w + 1, WOOD[0], k);
            p.beam(x0, y0, mx, my, w, col, k);
            p.beam(mx, my, x1, y1, w - 0.5, col, k);
            // the open hand at the end: a palm and three fingers spread outward
            p.circle(x1, y1, w * 0.75 + 1, WOOD[0], k);
            p.circle(x1, y1, w * 0.75, WOOD[ring === 0 ? 4 : 3], k);
            for (let fi = -1; fi <= 1; fi++) { const fa = a + fi * 0.35; p.beam(x1, y1, x1 + Math.cos(fa) * w * 1.6, y1 + Math.sin(fa) * w * 1.4, 1.6, WOOD[ring === 0 ? 4 : 3], k); }
          }
        }
        // the body: a great dark trunk, shoulders, the folded robe; grain running up it
        p.shade(SX - 64, hy - 30, SX + 64, 1, (x, y, out) => {
          const dx = x - SX, dy = y - hy, ground = -hy;
          // shoulders round off from the neck, the robe narrows to the waist, the crossed legs spread wide at the base
          const wide = dy < 40 ? 16 + 44 * Math.sqrt(clamp((dy - 20) / 20)) : dy < ground - 50 ? 60 - (dy - 40) * 0.18 : 60 - (ground - 90) * 0.18 + (dy - (ground - 50)) * 0.5;
          if (Math.abs(dx) > wide || dy < 20 || y > 0) return;
          out.a = k;
          const n = noise2(x * 0.12, y * 0.04, 3), edge = Math.abs(dx) > wide - 2.2;
          if (edge) return WOOD[0];
          // the prayer hands: a tall pointed shape at the chest, lit on one side
          const hdy = dy - 52;
          if (hdy > 0 && hdy < 46 && Math.abs(dx) < 10 * (1 - Math.abs(hdy - 30) / 30) + 2) return dx < 0 ? WOOD[4] : WOOD[3];
          // the robe's folds sweeping down and across
          if (Math.abs(((dx * 0.6 + dy) % 22) - 11) < 1 && dy > 30) return WOOD[1];
          if (dy > ground - 50 && Math.abs(dy - (ground - 50)) < 1.2) return WOOD[0];
          const lit = -dx / wide * 0.5 + n;
          return lit > 0.75 ? WOOD[4] : lit > 0.45 ? WOOD[3] : lit > 0.15 ? WOOD[2] : WOOD[1];
        });
        // the head: a smooth oval of wood plates, the face of the Buddha in calm lines, a crest on top
        p.ellipse(SX, hy, 22, 26, WOOD[0], k);
        p.ellipse(SX, hy, 20, 24, WOOD[3], k);
        p.ellipse(SX - 5, hy - 6, 10, 14, WOOD[4], 0.6 * k);
        for (const s of [-1, 1]) {
          p.line(SX + s * 4, hy - 2, SX + s * 12, hy - 4, WOOD[0], k);
          p.line(SX + s * 5, hy + 2, SX + s * 11, hy + 2, WOOD[1], k);
          p.rect(SX + s * 20 - (s > 0 ? 0 : 3), hy - 4, 3, 16, WOOD[2], k);
        }
        p.line(SX, hy + 2, SX, hy + 10, WOOD[1], k);
        p.line(SX - 5, hy + 15, SX + 5, hy + 15, WOOD[0], k);
        p.tri(SX - 8, hy - 24, SX + 8, hy - 24, SX, hy - 38, WOOD[2], k);
        p.circle(SX, hy - 24, 4, WOOD[4], k);
        // sage markings glowing at its eyes once it stands
        if (t > RISEN) for (const s of [-1, 1]) p.line(SX + s * 6, hy - 3, SX + s * 10, hy - 3, SAGE, 0.8 * k);
      }
      // the floor heaving where it comes out
      if (t > RISE && t < RISEN + 0.3) p.ellipse(SX, 0, 80 * rise(t) + 20, 3, WOOD[1], 0.8);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "sage", t0: 0.04, t1: CLAP - 0.02, label: "SENNIN MODO", head: b.head });
      drawGlint(p, t, "sage", CLAP, END - 0.4, b.head);
      drawBadge(p, t, { kind: "wood", t0: CLAP + 0.02, t1: RISE + 0.5, label: "MOKUTON", head: b.head, dy: -40 });
      // the clap: a ring of force off his hands
      if (t > CLAP && t < CLAP + 0.3) { const u = (t - CLAP) / 0.3; p.ring(b.handN[0], b.handN[1], 4 + 30 * u, 1, WHITE, 1 - u); }
      if (t > ALL - 0.02 && t < ALL + 0.25) { const u = (t - ALL + 0.02) / 0.27; p.ring(b.handN[0], b.handN[1], 4 + 60 * u, 1, WHITE, 1 - u); }
      // the palms: each comes out of the sky down onto the target, hangs a beat on the crushed floor, lifts away
      const drop = (h, x, s, ang) => {
        const a = t - h;
        if (a < -0.16 || a > 0.5) return;
        const u = a < 0 ? 1 - (a + 0.16) / 0.16 : 0, lift = a > 0.3 ? (a - 0.3) / 0.2 : 0;
        const y = -6 - u * 160 - lift * 140, k = 1 - lift;
        palm(p, x - Math.sin(ang) * u * 160, y, s, ang, k);
        if (a > 0 && a < 0.06) p.ellipse(x, -2, 40, 6, WHITE, 1 - a / 0.06);
      };
      PALMS.forEach((h, i) => drop(h, TX + [-6, 10, -14, 6][i], 1.1, [-0.35, 0.25, -0.15, 0.4][i]));
      // all of them at once
      if (t > ALL - 0.16 && t < ALL + 0.6) for (let i = 0; i < 6; i++) drop(ALL + (i % 2) * 0.03, TX - 40 + i * 16, 1.0 + 0.2 * rand(i, 3), -0.5 + i * 0.2);
      // the dust they raise: a dome rolling out and up from under all the hands, wood-brown and grey
      if (t > ALL && t < ALL + 2.2) {
        const a = t - ALL, u = ease.outCubic(clamp(a / 0.8)), fade = 1 - smooth(1.0, 2.2, a);
        for (let i = 0; i < 16; i++) {
          const ang = Math.PI + (i / 15) * Math.PI, d = (30 + 90 * u) * (0.7 + 0.4 * rand(i, 5)), r = (10 + 16 * u) * (0.7 + 0.5 * rand(i, 6));
          const x = TX + Math.cos(ang) * d * 1.3, y = -2 + Math.sin(ang) * d * 0.55 - a * 10 * rand(i, 7);
          p.disc(x, y, r, (dd) => (dd < 0.45 ? hex("#9a8670") : dd < 0.8 ? hex("#6e5e4e") : hex("#4a3e34")), (dd) => fade * (dd < 0.85 ? 0.9 : 0.5));
        }
        if (a < 0.1) p.ellipse(TX, -4, 80, 12, WHITE, 1 - a / 0.1);
      }
      // splinters
      for (const c of chunks) drawChunk(p, c.x, c.y, c.s, c.a, WOOD, 1 - smooth(c.life - 0.2, c.life, c.age));
      void f;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
