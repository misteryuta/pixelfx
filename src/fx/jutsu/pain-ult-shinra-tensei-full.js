// ULTIMATE: Shinra Tensei, full power (Pain, the Deva Path, over Konoha). Narutopedia: the Deva Path's repulsion
// pushes everything away from the user; ordinarily he needs five seconds between uses, but at full power, rising high
// over Konoha and pouring in Nagato's chakra, it flattened the whole village into a vast crater. Here: the Rinnegan;
// the Deva Path rises slowly into the sky, coat flapping; he stops high over the target, arms spread, and speaks the
// words ("Feel pain. Contemplate pain. Accept pain. Know pain."), a beat of silence, the air going still and dark;
// then: SHINRA TENSEI: a sphere of force falls from him and slams into the ground, a wall of dust and debris racing
// outward along the floor, the floor itself pressed down into a crater, the target flattened at the centre, rubble
// flung out to both edges; the dust slowly settles round the crater, he hangs above it.
// New: the slow rise, the words, the falling sphere, the crater pressed into the floor, the debris wave; ULTIMATE
// staging; one impact frame (burst in Rinnegan violet).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawChunk, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";

const RISE = 0.4, HIGH = 1.6, WORDS = 1.7, STILL = 3.3, FALL = 3.55, SLAM = 3.75, SETTLE = 5.0, END = 6.0, TX = 170, HY = -150;
const PU = ["#2a1a4a", "#6a4aa0", "#a890e0", "#e8e0ff"].map(hex), DUST = ["#2a2430", "#4a4250", "#7a7284", "#a8a0b0"].map(hex), ROCK = ["#2a2430", "#4a4250", "#6a6274", "#8a8494"].map(hex);
const LINES = ["FEEL PAIN.", "CONTEMPLATE PAIN.", "ACCEPT PAIN.", "KNOW PAIN."];

export const meta = {
  name: "Shinra Tensei: full power",
  desc: "ULTIMATE. Pain's Deva Path rises high over the target and speaks the four lines of pain; a beat of silence, then a sphere of repulsion falls and slams the ground into a vast crater, a wall of debris racing out to both edges.",
  tags: ["jutsu", "ultimate", "pain", "deva-path", "rinnegan", "repulsion", "aoe", "one-shot"],
  size: [380, 270],
  origin: [20, 230],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a4a", "#6a4aa0", "#a890e0", "#e8e0ff"], seed: 171 },
};

const FLOAT = { ...READY, crouch: 1, lean: -2, fx: 6, fy: -18, bx: -6, by: -18, ffx: 3, ffy: -5, fbx: -3, fby: -5, gait: false };
const SPREAD = { ...FLOAT, fx: 18, fy: -32, bx: -16, by: -32, lean: -4 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE, { ...READY, crouch: 4 }, "out"],
    [HIGH, { ...FLOAT, x: TX - 4, y: HY + 30 }, "out"],
    [STILL, { ...FLOAT, x: TX - 4, y: HY + 26 }],
    [FALL, { ...SPREAD, x: TX - 4, y: HY + 26 }, "out"],
    [END, { ...SPREAD, x: TX - 4, y: HY + 22 }],
  ],
  hits: [
    { t: RISE, target: false, sfx: "cast" },
    { t: STILL, stop: 0.2, target: false },
    { t: FALL, target: false, sfx: "whoosh" },
    { t: SLAM, stop: 0.35, shake: 1.6, amp: 10, push: 0, straw: 90, flash: 0.1, sfx: "explosion" },
    { t: SLAM + 0.4, shake: 1.2, amp: 4, target: false, sfx: "rumble" },
  ],
};
// pressed into the crater floor
export const targetState = (t) => (t > SLAM ? { s: 1 - 0.25 * (1 - smooth(SLAM + 0.5, SETTLE, t) * 0.5), dy: 10 * smooth(SLAM, SLAM + 0.1, t) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta), rocks = [];
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // the crater's depth profile at x (0 outside its rim)
  const crater = (x, t) => { const u = ease.outCubic(smooth(SLAM, SLAM + 0.25, t)), r = 120 * u, d = (x - TX) / Math.max(1, r); return Math.abs(d) < 1 ? 14 * u * (1 - d * d) : 0; };
  return {
    update(t, dt) {
      if (t >= SLAM) once("slam", () => {
        lights.add(TX, -10, 220, PU[3], 0.9, 0.6);
        for (let i = 0; i < 40; i++) rocks.push({ x: TX + R.range(-40, 40), y: -2, vx: R.range(-340, 340), vy: -R.range(80, 300), a: R.range(0, TAU), s: R.range(2, 5), age: 0 });
      });
      for (const r of rocks) { r.vy += 520 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.vx * 0.02 * dt; r.age += dt; if (r.y > -1) { r.y = -1; r.vy *= -0.25; r.vx *= 0.5; } }
      if (t > SLAM && t < SETTLE && R.chance(70 * dt)) { const s = R.chance(0.5) ? 1 : -1; ps.spawn(P.DUST, TX + s * R.range(60, 180), -R.range(0, 20), s * R.range(20, 80), -R.range(10, 40), R.range(0.8, 1.6), DUST[R.int(1, 3)], 2); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: RISE, t1: END + 1, tone: "#06040c", glow: "#2a1a4a", k: 0.6 + 0.25 * smooth(WORDS, STILL, t) });
      // the crater pressed into the floor: a dark bowl, its rim cracked and raised
      if (t > SLAM) {
        p.shade(TX - 130, -4, TX + 130, 16, (x, y) => { const d = crater(x, t); if (y > d || y < -1) return; return y > d - 2 ? ROCK[2] : y > d * 0.5 ? DUST[0] : hex("#0a080e"); });
        for (const sd of [-1, 1]) { const rx = TX + sd * 120 * ease.outCubic(smooth(SLAM, SLAM + 0.25, t)); p.tri(rx - 8, 0, rx + 8, 0, rx, -6, ROCK[2]); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      ultBanner(p, t, box, { t0: 0.05, name: "SHINRA TENSEI", hold: 1.0, color: "#a890e0" });
      drawBadge(p, t, { kind: "rinnegan", t0: 0.1, t1: RISE, label: "DEVA PATH", head: b.head });
      drawGlint(p, t, "rinnegan", RISE, END - 0.3, b.head);
      // the piercings and the Akatsuki coat's tails flapping as he hangs in the air
      if (t > RISE) { for (let i = 0; i < 3; i++) p.px(hx + 3, hy + i * 1.5 - 1, hex("#9a9aa8")); const [cx, cy] = b.chest; for (let i = 0; i < 3; i++) p.line(cx - 4 + i * 3, cy + 12, cx - 6 + i * 3 + Math.sin(t * 9 + i) * 2, cy + 20, hex("#1a1420")); }
      // the words, one line at a time
      LINES.forEach((ln, i) => { const t0 = WORDS + i * 0.38; if (t > t0 && t < STILL) p.text(ln, hx, hy - 36 + i * 7, PU[3], { font: "mini", align: "center", outline: hex("#08060c"), a: smooth(t0, t0 + 0.1, t) * (1 - smooth(STILL - 0.2, STILL, t)) }); });
      // the stillness: a thin ring tightening round him
      if (t > STILL - 0.2 && t < FALL) { const v = smooth(STILL - 0.2, FALL, t); p.ring(hx, hy + 10, 40 * (1 - v) + 6, 1, PU[3], v); }
      // the sphere falling from him and hitting the ground
      if (t > FALL && t < SLAM + 0.05) { const u = ease.inQuad(clamp((t - FALL) / (SLAM - FALL))), y = hy + 10 + (-14 - hy - 10) * u, r = 14 + 30 * u; p.glow(TX, y, r * 2, PU[2], 0.5); p.ring(TX, y, r, 2, PU[3]); p.ring(TX, y, r * 0.6, 1, PU[2], 0.6); }
      // the shock: a wall of dust racing out along the floor both ways, a dome of force
      if (t > SLAM && t < SETTLE + 0.6) {
        const v = ease.outCubic(clamp((t - SLAM) / 0.7)), k = 1 - smooth(SETTLE - 0.5, SETTLE + 0.6, t);
        for (const sd of [-1, 1]) {
          const fx = TX + sd * 200 * v;
          p.shade(Math.min(TX, fx) - 10, -60, Math.max(TX, fx) + 10, 1, (x, y, out) => { const w = Math.abs(x - TX) / (200 * v + 1), h = 50 * (1 - 0.5 * w) * Math.min(1, (Math.abs(fx - x) + 4) / 30); if (-y > h + 8 * noise2(x * 0.06, y * 0.06 - t * 2, 8)) return; out.a = k * 0.85; return -y > h * 0.6 ? DUST[3] : noise2(x * 0.1, y * 0.1, 9) > 0 ? DUST[2] : DUST[1]; });
        }
        if (t < SLAM + 0.4) { const d = (t - SLAM) / 0.4; p.ellipse(TX, -10, 30 + 150 * d, 20 + 90 * d, (dd) => (dd > 0.9 ? PU[3] : 0), 1 - d); }
      }
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK.slice(1), 1 - smooth(1.2, 1.8, r.age));
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= SLAM && t < SLAM + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -10, false, 171, { style: "burst", ink: hex("#0e0818"), paper: hex("#ece4ff"), lines: 50 });
      void rand; void WHITE;
    },
  };
});
