// Chibaku Tensei (Planetary Devastation, Pain / Deva Path). Narutopedia: hands clapped, the user forms a small black
// sphere between them and throws it into the sky; once active it pulls everything round it in until a great satellite of
// earth and rock is made, its size the user's to choose. Here: the Rinnegan, the clap, a black sphere thrown up; it pulls:
// slabs tear out of the floor and fly up, the target is dragged up and slammed into the forming moon, the rock packs
// over it until only its chest shows in a crater; then Pain raises his hand and swings it down, and the moon comes down
// on the spot it was taken from: impact frames, the moon shatters in a blast of rock and dust, a crater is left.
// New: the sphere, the rocks packing into a moon round the captured target (targetState: lifted, turned, shrunk, grey),
// the crater window it stays fused in, the fall, impact frames (_lib impactFrame), the shatter (_lib drawChunk).
// From the library: the dirt explosion for the plume.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, mix, WHITE, TAU } from "../../core/index.js";
import * as dirt from "../explosions/dirt-explosion.js";
import { play, sealRun, drawSeals, bodyAt, warp, impactFrame, drawChunk } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["gassho"], 0.12, { hold: 0.55 });
const FORM = SEALS.end - 0.3, THROW = SEALS.end + 0.05, RISE = 0.45, PULL = THROW + RISE + 0.15;
const LIFT = PULL + 0.15, CAUGHT = PULL + 1.0, PACKED = PULL + 1.9, RAISE = PACKED + 0.45, SLAM = RAISE + 0.3, FALL = 0.26, IMPACT = SLAM + FALL, END = IMPACT + 3.7;
const TX = 150, SX = 92, SY = -122, LAND = -34;
const RG = ["#08040e", "#1c1030", "#3c2070", "#7a4ad0", "#c8b0ff"].map(hex), ROCK = ["#231c2a", "#3e3446", "#615468", "#8a7c8a", "#b0a2ac"].map(hex);
const N = 64, MOON = 44;

export const meta = {
  name: "Planetary devastation",
  desc: "Pain: a black sphere thrown into the sky pulls the floor and the target up into a moon of rock, the target fused into its crater; then he swings his hand down and the moon crashes back in a shattering blast.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "pull", "aoe", "one-shot"],
  size: [344, 258],
  origin: [60, 216],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#08040e", "#1c1030", "#3c2070", "#7a4ad0", "#c8b0ff"], seed: 48 },
};

const UPTHROW = { ...READY, crouch: 3, lean: -6, fx: 10, fy: -46, bx: 6, by: -44, ffx: 8, fbx: -8 };
const HOLDUP = { ...UPTHROW, fx: 8, fy: -40, bx: 2, by: -38 };
const RAISED = { ...READY, crouch: 1, lean: -8, fx: 6, fy: -52, bx: -4, by: -30, ffx: 7, fbx: -7 };
const SWUNG = { ...READY, crouch: 7, lean: 10, fx: 22, fy: -12, bx: -6, by: -26, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [THROW, UPTHROW, "snap"],
    [PULL, HOLDUP],
    [PACKED, { ...HOLDUP, crouch: 4, lean: -4 }],
    [RAISE, RAISED, "out"],
    [SLAM - 0.04, { ...RAISED, fy: -54, lean: -10 }],
    [SLAM + 0.06, SWUNG, "in"],
    [IMPACT + 0.5, SWUNG],
    [END - 0.6, { ...READY, crouch: 3 }],
    [END, READY],
  ],
  hits: [
    { t: PULL, stop: 0.08, shake: 0.3, amp: 2, flash: 0, target: false },
    { t: CAUGHT, stop: 0.1, shake: 0.35, amp: 3, target: false },
    { t: PACKED, stop: 0.06, shake: 0.25, amp: 2, target: false },
    { t: SLAM + 0.06, stop: 0.04, shake: 0.2, amp: 2, target: false },
    { t: IMPACT, stop: 0.06, shake: 0.9, amp: 7, push: 6, straw: 54, flash: 0 },
    { t: IMPACT + 0.4, stop: 0.02, flash: 0, push: 1.5, straw: 12, skin: "char" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SLAM + 0.06, x: 4, n: 8, dir: -1 }],
};

// the moon's center: hung where the sphere stopped, rumbling as it packs, then flung down onto the target's spot
const moonAt = (t) => {
  if (t < SLAM) {
    const r = t > CAUGHT && t < PACKED + 0.2 ? Math.sin(t * 70) * 0.8 : 0;
    return [SX + r, SY - (t > RAISE ? 6 * ease.outCubic(smooth(RAISE, SLAM, t)) : 0)];
  }
  const u = ease.inCubic(clamp((t - SLAM) / FALL));
  return [SX + (TX - SX) * u, SY - 6 + (LAND - SY + 6) * u];
};
// where the target is: on its post, then dragged up into the moon, then wherever the moon is
const targetAt = (t) => {
  if (t < LIFT) return [TX, -26];
  const [mx, my] = moonAt(t);
  if (t >= CAUGHT) return [mx - 2, my + 2];
  const u = ease.inOutCubic((t - LIFT) / (CAUGHT - LIFT)), sw = Math.sin(u * Math.PI) * 14;
  return [TX + (mx - 2 - TX) * u + sw, -26 + (my + 2 + 26) * u];
};

export const targetState = (t) => {
  if (t < LIFT || t >= IMPACT) return null;
  const [x, y] = targetAt(t), u = smooth(LIFT, CAUGHT, t), fused = smooth(CAUGHT, PACKED, t);
  return {
    dx: x - TX,
    dy: y + 26,
    rot: u * (1 - u) * 2.4 * Math.sin(t * 9) + (t >= CAUGHT ? -0.35 : -0.35 * u),
    s: 1 - 0.32 * u,
    tint: [ROCK[2], 0.15 + 0.45 * fused],
  };
};

// the rocks: where each is torn from (x on the floor), when, its size, where in the moon it ends up (angle, depth)
const rocks = Array.from({ length: N }, (_, i) => ({ x: -10 + rand(i, 1) * 250, t0: PULL + rand(i, 2) * 1.3, s: 3 + rand(i, 3) * 5, a: rand(i, 4) * TAU, d: 0.35 + rand(i, 5) * 0.65, sp: 0.4 + rand(i, 6) * 0.3 }));
// the moon's own craters, in moon space
const craters = Array.from({ length: 7 }, (_, i) => ({ a: rand(i, 11) * TAU, d: 0.3 + rand(i, 12) * 0.55, r: 3 + rand(i, 13) * 5 }));

export const create = play([{ fx: dirt, t: IMPACT, x: TX, y: 0, light: 0.6 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let caught = false, landed = false;
  const chunks = [];
  const sphere = (t, b) => {
    if (t < THROW) return [b.handN[0] + 1, b.handN[1] - 3];
    const u = ease.outCubic(clamp((t - THROW) / RISE));
    return [12 + (SX - 12) * u, -40 + (SY + 40) * u];
  };
  return {
    update(t, dt) {
      for (const r of rocks) if (!r.out && t >= r.t0) {
        r.out = true;
        for (let j = 0; j < 4; j++) ps.spawn(P.DUST, r.x, -2, R.range(-30, 30), -R.range(10, 40), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
      }
      // the target torn off its post: straw and dust where it stood
      if (!caught && t >= CAUGHT) {
        caught = true;
        const [mx, my] = moonAt(t);
        for (let j = 0; j < 14; j++) ps.spawn(P.GRIT, mx + R.range(-8, 8), my + R.range(-8, 8), R.range(-90, 90), R.range(-90, 40), R.range(0.3, 0.6), ROCK[R.int(1, 3)]);
      }
      // the air under the falling moon, shoved out along the floor
      if (t > SLAM + FALL * 0.5 && t < IMPACT && R.chance(140 * dt)) ps.spawn(P.DUST, TX + R.range(-50, 50), -1, R.range(-160, 160), -R.range(2, 16), R.range(0.3, 0.6), hex("#8a7c86"), R.range(2, 4), 0, 0);
      if (!landed && t >= IMPACT) {
        landed = true;
        // the moon breaks: big chunks thrown out and up, grit and dust everywhere
        for (let j = 0; j < 30; j++) {
          const a = R.range(-Math.PI * 0.95, -Math.PI * 0.05), s = R.range(90, 300);
          chunks.push({ x: TX + Math.cos(a) * 20, y: LAND + Math.sin(a) * 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s, s: R.range(3, 9), a: R.range(0, TAU), w: R.range(-12, 12), bounced: false });
        }
        for (let j = 0; j < 60; j++) ps.spawn(P.GRIT, TX + R.range(-20, 20), -R.range(2, 40), R.range(-260, 260), -R.range(60, 300), R.range(0.6, 1.3), ROCK[R.int(0, 3)], R.chance(0.4) ? 2 : 1);
        for (let j = 0; j < 46; j++) {
          const dir = R.chance(0.5) ? 1 : -1;
          ps.spawn(P.DUST, TX + dir * R.range(10, 40), -R.range(1, 12), dir * R.range(120, 340), -R.range(4, 50), R.range(0.6, 1.3), j % 3 ? hex("#8a7c86") : hex("#b0a2ac"), R.range(3, 6), 0, 0);
        }
      }
      for (const c of chunks) {
        c.vy += 420 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.a += c.w * dt;
        if (c.y > -c.s * 0.6) {
          c.y = -c.s * 0.6;
          if (!c.bounced) { c.bounced = true; c.vy *= -0.35; c.vx *= 0.5; c.w *= 0.5; } else { c.vy = 0; c.vx *= 0.8; c.w = 0; }
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      const k = 1 - smooth(END - 0.7, END - 0.1, t);
      // the pits the rocks are torn from, and the crater the moon leaves
      for (const r of rocks) if (t >= r.t0 && t < IMPACT) p.ellipse(r.x, 0.5, r.s, 1.2, hex("#120c18"), 0.8);
      if (t >= IMPACT) {
        const a = smooth(IMPACT, IMPACT + 0.15, t);
        p.ellipse(TX, 0.5, 56 * a, 4, hex("#120c18"), 0.9 * k);
        p.ellipse(TX, 0, 46 * a, 1.6, RG[3], 0.6 * (1 - smooth(IMPACT + 0.2, IMPACT + 1.2, t)));
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, RG.slice(1));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "rinnegan", t0: 0.05, t1: SEALS.end, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", SEALS.end + 0.05, END - 0.4, b.head);
      const [sx, sy] = sphere(t, b), sr = t < FORM ? 0 : 2 + 2 * smooth(FORM, THROW, t);
      const [mx, my] = moonAt(t), [tx, ty] = targetAt(t);
      // the rock packing round it: a rough moon with its own craters, lit from the upper left, a violet rim of gravity;
      // the target stays in a crater window, the rock closing in round it until only its chest shows
      const packed = smooth(PULL + 0.4, PACKED, t);
      if (packed > 0 && t < IMPACT) {
        const MR = MOON * packed, fused = smooth(CAUGHT, PACKED, t), holeR = t < CAUGHT ? 30 : 26 - 15 * fused, hx = tx - mx, hy = ty - my;
        p.glow(mx, my, MR + 20, RG[3], 0.35 * packed);
        p.shade(mx - MR - 3, my - MR - 3, mx + MR + 3, my + MR + 3, (x, y) => {
          const dx = x - mx, dy = y - my, a = Math.atan2(dy, dx), edge = MR * (0.86 + 0.14 * noise2(Math.cos(a) * 2 + 4, Math.sin(a) * 2, 2)), d = Math.hypot(dx, dy);
          if (d > edge + 1) return;
          if (d > edge) return RG[3];
          // the crater the target is set in: a window, with a dark broken rim round it
          const dh = Math.hypot(dx - hx, dy - hy) + noise2(a * 3, d * 0.2, 5) * 3;
          if (t >= CAUGHT || dh < holeR + 4) {
            if (dh < holeR) return;
            if (dh < holeR + 2.5) return (dx - hx) + (dy - hy) > 0 ? ROCK[3] : ROCK[0];
          }
          let lit = (-dx - dy) / MR * 0.8 + noise2(dx * 0.2, dy * 0.2, 6) * 0.6;
          for (const c of craters) {
            const cx = Math.cos(c.a) * MR * c.d, cy = Math.sin(c.a) * MR * c.d, dc = Math.hypot(dx - cx, dy - cy);
            if (dc < c.r * packed) lit += dx - cx + dy - cy > 0 ? 0.5 : -0.6;
          }
          // cracks running out from the crater
          if (fused > 0.3 && Math.abs(noise2(a * 2.5 + 7, d * 0.05, 9) - 0.5) < 0.025 && dh < holeR + 18 * fused) return ROCK[0];
          return d > edge - 1.2 ? ROCK[0] : lit > 0.75 ? ROCK[4] : lit > 0.3 ? ROCK[3] : lit > -0.15 ? ROCK[2] : lit > -0.6 ? ROCK[1] : ROCK[0];
        });
        // falling: streaks behind it
        if (t > SLAM) {
          const u = clamp((t - SLAM) / FALL), ux = TX - SX, uy = LAND - SY + 6, n = Math.hypot(ux, uy);
          for (let i = 0; i < 9; i++) {
            const off = (i - 4) * MR * 0.22, px = mx - (uy / n) * off, py = my + (ux / n) * off, L = 30 + 40 * u + rand(i, 7) * 20;
            p.line(px - (ux / n) * (MR * 0.7), py - (uy / n) * (MR * 0.7), px - (ux / n) * (MR * 0.7 + L), py - (uy / n) * (MR * 0.7 + L), i % 2 ? WHITE : RG[4], 0.7);
          }
        }
      }
      // the rocks flying up to it
      for (const r of rocks) {
        const a = t - r.t0;
        if (a < 0 || t > PACKED + 0.2) continue;
        const u = ease.inOutQuad(clamp(a / r.sp)), ex = mx + Math.cos(r.a) * MOON * r.d * Math.max(0.3, packed), ey = my + Math.sin(r.a) * MOON * r.d * Math.max(0.3, packed);
        if (u >= 1 && packed > r.d) continue;
        const x = r.x + (ex - r.x) * u + Math.sin(u * Math.PI) * 20 * (r.x < mx ? -1 : 1), y = -r.s + (ey + r.s) * u;
        drawChunk(p, x, y, r.s * 0.7, r.a + a * 4, ROCK);
      }
      // the sphere: black, rimmed in violet, bending the air round it once it pulls
      if (sr > 0 && packed < 0.95) {
        if (t > PULL && packed < 0.4) warp(p, sx, sy, 22, 0.6 * Math.sin(t * 6), 0.2 * (1 - packed * 2.5));
        p.glow(sx, sy, 24, RG[3], 0.6 * (1 - packed));
        p.circle(sx, sy, sr + 1.5, RG[3]);
        p.circle(sx, sy, sr, RG[0]);
        p.px(sx - 1, sy - 1, RG[4]);
        if (t > PULL && t < PACKED) for (let i = 0; i < 2; i++) p.ring(sx, sy, 30 - ((t * 40 + i * 15) % 30), 1, RG[3], 0.5);
      }
      // the moon's pull on the target as it's dragged: violet streaks along its path
      if (t > LIFT && t < CAUGHT) for (let i = 0; i < 3; i++) p.line(tx + (i - 1) * 8, ty + 18, tx + (i - 1) * 8 + (TX - tx) * 0.2, ty + 34, RG[3], 0.5);
      // the shatter: chunks of the moon thrown out, a white dome, a shock ring along the floor
      if (t >= IMPACT) {
        const a = t - IMPACT, k = 1 - smooth(END - 0.9, END - 0.2, t);
        for (const c of chunks) drawChunk(p, c.x, c.y, c.s, c.a, ROCK, k);
        if (a < 0.35) {
          const u = a / 0.35;
          p.circle(TX, -10, 20 + 60 * ease.outCubic(u), WHITE, 1 - u);
          p.ring(TX, -10, 24 + 70 * ease.outCubic(u), 2, RG[4], 1 - u);
        }
        if (a < 0.6) {
          const u = a / 0.6;
          p.ellipse(TX, -1, 30 + 170 * ease.outCubic(u), 4 + 4 * u, RG[4], 0.7 * (1 - u));
          p.ellipse(TX, -1, 26 + 150 * ease.outCubic(u), 2, WHITE, 1 - u);
        }
        p.glow(TX, -20, 120, RG[3], 0.5 * (1 - smooth(IMPACT, IMPACT + 1, t)));
      }
      ps.draw(p, "front");
      // impact frames: the picture goes to ink and paper for a beat, then inverted
    },
  };
});
