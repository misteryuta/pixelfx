// Tsuutenkyaku (Heavenly Foot of Pain, Tsunade, the Fifth Hokage). Narutopedia: she leaps high and brings her heel down
// with chakra-enhanced strength, an axe kick that splits the ground into a huge fissure. Here: the diamond on her brow
// (Strength of a Hundred) glows; she crouches and springs straight up, so high she leaves the frame almost; at the top
// she flips forward once, the leg raised straight above her head, a white glint on the heel; she drops like a stone
// and the heel comes down on the target: the floor caves in, a fissure tearing away from the point in both directions,
// slabs of floor tipping up along it, rocks and dust flung high; she stands up in the middle of it.
// New: the leap and flip (the figure turned, from _lib), the fissure with tilting slabs. Library: ground slam.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as slam from "../impacts/ground-slam.js";
import { play, bodyAt, drawChunk, drawFigureTurned, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 150, MARK = 0.3, CROUCH = 0.6, SPRING = 0.72, TOP = 1.15, FLIP = 1.35, HIT = 1.55, STAND = 2.6, END = 3.8;
const ROCK = ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex), PURP = hex("#9b4fd0");
const HX = TX - 6;

export const meta = {
  name: "Heavenly foot of pain",
  desc: "Tsunade: the diamond on her brow glows, she springs straight up, flips at the top with her leg raised high, and drops her heel onto the target: the floor caves in and a fissure tears away both ways, slabs tipping up along it.",
  tags: ["jutsu", "tsunade", "hokage", "strength", "kick", "aoe", "one-shot"],
  size: [300, 260],
  origin: [56, 228],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670", "#d8c8a8"], seed: 47 },
};

const LOW = { ...READY, crouch: 14, lean: 6, fx: 8, fy: -12, bx: -6, by: -12, ffx: 8, fbx: -8 };
const UP = { ...READY, x: HX - 20, y: -120, crouch: 2, lean: -2, fx: 4, fy: -40, bx: -2, by: -38, ffx: 4, ffy: -6, fbx: -3, fby: -6, gait: false };
const AXE = { ...READY, x: HX - 8, y: -120, crouch: 2, lean: -10, fx: -6, fy: -24, bx: -10, by: -22, ffx: 12, ffy: -46, fbx: -4, fby: -4, gait: false };
const HEEL = { ...READY, x: HX - 8, crouch: 10, lean: 8, fx: -4, fy: -20, bx: -12, by: -24, ffx: 16, ffy: -4, fbx: -10, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#d9a5ff",
  poses: [
    [-0.25, READY],
    [CROUCH, LOW, "out"],
    [SPRING, { ...UP, y: -40, crouch: 0, lean: 4, fx: 4, fy: -36 }, "snap"],
    [TOP, UP, "out"],
    [FLIP + 0.05, AXE, "out"],
    [HIT, HEEL, "in"],
    [STAND, { ...HEEL, crouch: 12 }],
    [STAND + 0.4, { ...READY, x: HX - 8, crouch: 3, gait: false }, "out"],
    [END, { ...READY, x: HX - 8, gait: false }],
  ],
  hits: [
    { t: MARK, target: false, sfx: "cast" },
    { t: SPRING, stop: 0.04, shake: 0.2, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.28, shake: 1.2, amp: 9, push: 3, straw: 60, skin: "char", shiver: 0.6, sfx: "explosion" },
    { t: HIT + 0.4, shake: 0.8, amp: 3, target: false, sfx: "rumble" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SPRING, x: 0, n: 14 }, { t: HIT, x: TX - 40, n: 24, dir: -1 }, { t: HIT, x: TX + 40, n: 24, dir: 1 }],
};
// the flip: a full forward turn at the top of the leap
export const actorAlpha = (t) => (t > TOP && t < FLIP ? 0 : 1);
// crushed into the floor, then back up
export const targetState = (t) => (t < HIT ? null : { dy: 10 * Math.exp(-(t - HIT) * 2), s: 1 - 0.2 * Math.exp(-(t - HIT) * 3) });

export const create = play([{ fx: slam, t: HIT, x: TX, reach: 140, palette: ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670", "#d8c8a8", "#ffffff", "#ffffff"] }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), rocks = [];
  let hit = false;
  // the slabs along the fissure: tipping up on either side of the crack, more the nearer the heel
  const SLABS = Array.from({ length: 10 }, (_, i) => ({ x: TX - 95 + i * 21, w: 18, tilt: (i % 2 ? 1 : -1) * (0.5 - Math.abs(i - 4.5) * 0.08), d: Math.abs(TX - 95 + i * 21 + 9 - TX) }));
  return {
    update(t, dt) {
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(TX, -10, 200, PURP, 0.8, 0.4);
        for (let i = 0; i < 26; i++) rocks.push({ x: TX + R.range(-20, 20), y: -2, vx: R.range(-200, 200), vy: -R.range(150, 380), a: R.range(0, TAU), va: R.range(-10, 10), s: R.range(2, 6), age: 0 });
      }
      for (const r of rocks) { r.vy += 520 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt; r.age += dt; if (r.y > -1 && r.vy > 0) { r.y = -1; r.vy *= -0.25; r.vx *= 0.5; } }
      if (t > HIT && t < HIT + 1.2 && R.chance(40 * dt)) ps.spawn(P.DUST, TX + R.range(-90, 90), -2, R.range(-20, 20), -R.range(10, 40), R.range(0.8, 1.4), ROCK[R.int(1, 3)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the fissure: a jagged crack racing out both ways from the heel, slabs heaving up along it
      if (t > HIT) {
        const g = ease.outCubic(clamp((t - HIT) / 0.35));
        for (const s of SLABS) {
          const reach = s.d < 100 * g ? 1 : 0, k = ease.outBack(clamp((t - HIT - s.d / 400) / 0.2), 1.6) * reach;
          if (k <= 0) continue;
          const lift = s.tilt * 16 * k, x0 = s.x, x1 = s.x + s.w;
          p.poly([[x0, 0], [x1, 0], [x1, -Math.max(0, lift) - 2 * k], [x0, -Math.max(0, -lift) - 2 * k]], ROCK[1]);
          p.line(x0, -Math.max(0, -lift) - 2 * k, x1, -Math.max(0, lift) - 2 * k, ROCK[3]);
        }
        let x = TX, y = 0;
        for (const dir of [-1, 1]) {
          x = TX; y = 0;
          for (let i = 0; i < 24 * g; i++) { const nx = x + dir * 4.5, ny = (rand(i, dir + 3) - 0.5) * 3; p.beam(x, y, nx, ny, 2.2 - i * 0.07, hex("#08060c")); x = nx; y = ny; }
        }
        p.ellipse(TX, 1, 30 * g, 4 * g, hex("#08060c"));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), q = b.q;
      drawBadge(p, t, { kind: "byakugou", t0: 0.04, t1: CROUCH, label: "BYAKUGOU", head: b.head });
      // the diamond glowing on her brow the whole way
      if (t > MARK) { p.glow(b.head[0] + 1, b.head[1] - 3, 6, PURP, 0.6); p.px(b.head[0] + 1, b.head[1] - 3, hex("#d9a5ff")); }
      // the flip at the top: the whole body turned head over heels
      if (t > TOP && t < FLIP) {
        const a = ease.inOutCubic(smooth(TOP, FLIP, t)) * TAU, cy = (q.y ?? 0) - 20;
        drawFigureTurned(p, q, q.x ?? 0, q.y ?? 0, (q.x ?? 0) + 2, cy, a);
        p.arc((q.x ?? 0) + 2, cy, 24, 1, a - 1, a, WHITE, 0.5);
      }
      // the drop: a streak above her, the heel glinting
      if (t > FLIP && t < HIT) {
        const fx = b.footN[0], fy = b.footN[1];
        p.beam(fx, fy - 60, fx, fy - 4, 4, hex("#d9a5ff"), 0.35);
        p.px(fx, fy, WHITE);
        p.glow(fx, fy, 10, WHITE, 0.6);
      }
      if (t >= HIT && t < HIT + 0.05) impactFrame(p, -56, -228, 244, 32, TX, -6, false, 9, { style: "shards", ink: hex("#100818"), paper: hex("#f2e4ff") });
      else if (t >= HIT + 0.05 && t < HIT + 0.1) impactFrame(p, -56, -228, 244, 32, TX, -6, true, 10, { style: "shards", ink: hex("#100818"), paper: hex("#f2e4ff") });
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK, 1 - smooth(1.2, 1.8, r.age));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
