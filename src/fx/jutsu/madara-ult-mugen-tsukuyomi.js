// ULTIMATE: Mugen Tsukuyomi (Infinite Tsukuyomi, Madara Uchiha as the Ten-Tails' jinchuuriki). Narutopedia: with the
// Rinne Sharingan opened on his forehead, Madara projects his eye onto the moon; the moon turns into the Rinne
// Sharingan (red, ringed, nine tomoe) and its light catches every living thing in a dream; the God Tree's roots then
// wrap the dreamers in cocoons. Here: Madara (the Six Paths form: white hair, the forehead eye) rises into the air,
// the night falls, the full moon hangs over the field; he lifts a hand and the third eye flares; the moon's face
// clouds over and opens into the Rinne Sharingan, its rings turning; a pillar of red light pours down onto the target
// and the world around it goes pale; roots erupt from the ground, climb and wrap the target into a cocoon; the moon's
// eye stares on; then the light withdraws.
// New: the moon becoming the eye, the pillar of light, the roots and the cocoon; ULTIMATE staging; one impact frame
// (a red ring burst) when the eye opens.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";

const RISE = 0.4, NIGHT = 0.6, RAISE = 1.4, OPEN = 2.0, LIGHT = 2.35, ROOTS = 2.9, WRAPPED = 3.7, LIFT = 4.6, END = 5.4, TX = 200;
const MOON = [120, -170], MR = 30;
const RED = ["#2a0204", "#6a0810", "#c01a24", "#ff4a50", "#ffb0a8"].map(hex), PALE = hex("#e8e4ee"), ROOT = ["#1a1410", "#3a2e24", "#6a5644", "#9a8a74"].map(hex);

export const meta = {
  name: "Infinite Tsukuyomi",
  desc: "ULTIMATE. Madara with the Rinne Sharingan: night falls, the full moon opens into his ringed eye and pours a pillar of red light onto the target; roots erupt from the ground and wrap it in a cocoon of the endless dream.",
  tags: ["jutsu", "ultimate", "madara", "rinne-sharingan", "genjutsu", "six-paths", "bind", "one-shot"],
  size: [360, 260],
  origin: [60, 232],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0204", "#6a0810", "#c01a24", "#ff4a50"], seed: 168 },
};

const HOVER = { ...READY, y: -30, crouch: 1, lean: -3, fx: 6, fy: -20, bx: -6, by: -20, ffx: 3, ffy: -5, fbx: -4, fby: -5, gait: false };
const RAISEP = { ...HOVER, fx: 14, fy: -44, lean: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE + 0.5, HOVER, "out"],
    [RAISE, HOVER],
    [OPEN, RAISEP, "out"],
    [LIFT, RAISEP],
    [END - 0.2, { ...HOVER, y: -30 }],
    [END, HOVER],
  ],
  hits: [
    { t: RISE, target: false, sfx: "cast" },
    { t: OPEN, stop: 0.25, shake: 0.6, amp: 3, target: false, sfx: "thunder" },
    { t: LIGHT, stop: 0.12, shake: 0.6, amp: 3, push: 0, straw: 20, flash: 0.05, skin: "red", sfx: "explosion" },
    { t: ROOTS, shake: 1.0, amp: 3, push: 0, straw: 10, flash: 0, sfx: "rumble" },
    { t: WRAPPED, stop: 0.1, shake: 0.4, amp: 2, push: 0, straw: 20, flash: 0, sfx: "heavy" },
    { t: LIFT, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the dreamer: hangs limp in the light, then is lifted a little inside the cocoon
export const targetState = (t) => (t > LIGHT && t < END ? { dy: -10 * smooth(ROOTS, WRAPPED, t), rot: -0.1 * smooth(LIGHT, ROOTS, t), a: t > WRAPPED + 0.15 ? 0 : 1 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  // the roots: each grows from the ground near the target, climbing and curling round it
  const ROOTSD = Array.from({ length: 9 }, (_, i) => ({ x0: TX - 34 + i * 8.5 + (rand(i, 1) - 0.5) * 6, tw: (rand(i, 2) - 0.5) * 2.4, d: rand(i, 3) * 0.3, h: 52 + rand(i, 4) * 14 }));
  return {
    update(t, dt) {
      if (t > LIGHT && t < LIFT && R.chance(30 * dt)) ps.spawn(P.SPARK, TX + R.range(-30, 30), -R.range(0, 80), R.range(-6, 6), -R.range(10, 40), R.range(0.6, 1.2), RED[4]);
      if (t > ROOTS && t < ROOTS + 0.4 && R.chance(50 * dt)) ps.spawn(P.GRIT, TX + R.range(-36, 36), -1, R.range(-60, 60), -R.range(60, 160), R.range(0.4, 0.8), ROOT[2]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: NIGHT, t1: END + 1, tone: "#04020a", glow: "#1a0610", k: 0.85 });
      // the moon: full and pale, then clouding red and opening into the Rinne Sharingan, its rings turning
      const mk = smooth(NIGHT, NIGHT + 0.5, t), eye = smooth(OPEN - 0.3, OPEN + 0.15, t);
      if (mk > 0) {
        const [mx, my] = MOON;
        p.glow(mx, my, MR * 3, eye > 0.3 ? RED[3] : PALE, 0.35 * mk);
        p.shade(mx - MR, my - MR, mx + MR, my + MR, (x, y, out) => {
          const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy) / MR;
          if (d > 1) return;
          out.a = mk;
          if (eye < 0.05) return noise2(dx * 0.15, dy * 0.15, 71) > 0.25 ? hex("#c8c4cc") : PALE;
          // the eye: red, concentric rings, nine tomoe on the rings
          const ring = Math.abs(Math.sin(d * 4 * Math.PI)) < 0.12 && d > 0.15;
          if (ring) return RED[0];
          if (d < 0.12) return RED[0];
          const base = d < 0.95 ? (eye > 0.6 ? RED[2] : RED[1]) : RED[0];
          return noise2(dx * 0.2, dy * 0.2, 72) < -0.3 - 0.8 * eye ? PALE : base;
        });
        if (eye > 0.5) for (let r = 1; r <= 3; r++) for (let i = 0; i < 3; i++) { const a = t * 0.8 * (r % 2 ? 1 : -1) + i * (TAU / 3) + r, rr = MR * (r * 0.25); p.circle(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, 2, RED[0]); p.px(mx + Math.cos(a) * rr + 1, my + Math.sin(a) * rr + 2, RED[0]); }
      }
      // the pillar of red light poured down onto the target, the ground under it gone pale
      if (t > LIGHT - 0.1 && t < LIFT + 0.4) {
        const k = smooth(LIGHT - 0.1, LIGHT + 0.15, t) * (1 - smooth(LIFT, LIFT + 0.4, t)), [mx, my] = MOON;
        p.shade(Math.min(mx, TX) - 40, my, Math.max(mx, TX) + 40, 1, (x, y, out) => {
          const v = (y - my) / -my, cx = mx + (TX - mx) * (1 - v) * 0 + (TX - mx) * ((y - my) / (0 - my)), w = 10 + 26 * ((y - my) / (0 - my));
          const d = Math.abs(x - cx) / w;
          if (d > 1) return;
          out.a = k * (0.35 + 0.35 * (1 - d)) * (0.85 + 0.15 * Math.sin(y * 0.3 - t * 10));
          return d < 0.3 ? RED[4] : RED[3];
        });
        p.ellipse(TX, 0, 46, 4, PALE, 0.6 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      ultBanner(p, t, box, { t0: 0.05, name: "MUGEN TSUKUYOMI", hold: 1.1, color: "#ff4a50" });
      drawBadge(p, t, { kind: "madara", t0: 0.1, t1: RISE, label: "RINNE SHARINGAN", head: b.head });
      drawGlint(p, t, "rinnegan", RISE, END - 0.3, b.head);
      // the Six Paths form: white hair, the Rinne Sharingan on his brow, flaring as he raises his hand
      if (t > RISE) { const k = smooth(RISE, RISE + 0.3, t), fl = smooth(RAISE, OPEN, t); for (let i = 0; i < 6; i++) p.line(hx - 3 + i, hy - 3, hx - 6 + i * 0.6, hy + 5 + (i % 3) * 2, PALE, k); p.circle(hx + 1, hy - 4, 1.6, RED[2], k); p.px(hx + 1, hy - 4, RED[0], k); if (fl > 0) p.glow(hx + 1, hy - 4, 10 + 14 * fl, RED[3], 0.6 * fl); }
      // the roots: they burst out of the ground round the target, climb twisting and wrap it into a cocoon
      if (t > ROOTS - 0.05) {
        const k = 1 - smooth(END - 0.3, END, t);
        for (const r of ROOTSD) {
          const g = ease.outCubic(smooth(ROOTS + r.d, WRAPPED + r.d * 0.5, t));
          let px = r.x0, py = 0;
          for (let s = 1; s <= 16; s++) {
            const u = (s / 16) * g, y = -r.h * u, wrap = Math.sin(u * 7 + r.tw) * (14 - 8 * u) * smooth(0.2, 0.6, u), x = r.x0 + (TX - r.x0) * smooth(0.1, 0.5, u) + wrap;
            p.beam(px, py, x, y, 3.4 - u * 2, ROOT[1], k); p.line(px, py - 1, x, y - 1, ROOT[2], k);
            px = x; py = y;
          }
        }
        // the cocoon: a swollen bulb of bark round the dreamer, a dim red light seeping through its seams
        if (t > WRAPPED - 0.2) {
          const c = smooth(WRAPPED - 0.2, WRAPPED + 0.15, t) * k;
          p.shade(TX - 18, -64, TX + 18, -2, (x, y, out) => { const d = Math.hypot((x - TX) / 16, (y + 34) / 30); if (d > 1) return; out.a = c; const seam = Math.abs(noise2(x * 0.25, y * 0.12, 73)) < 0.06; if (seam) return RED[2]; return d > 0.85 ? ROOT[0] : noise2(x * 0.3, y * 0.5, 74) > 0.2 ? ROOT[2] : ROOT[1]; });
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= OPEN && t < OPEN + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], MOON[0], MOON[1], false, 168, { style: "rings", ink: hex("#1a0204"), paper: hex("#ffe4e0"), lines: 20 });
      void clamp;
    },
  };
});
