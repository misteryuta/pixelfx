// Byakugou no In: Kai (Strength of a Hundred Seal: Release, Sakura Haruno) into her chakra-loaded punch. Narutopedia:
// for years Sakura stored a little chakra every day in the diamond seal on her forehead; releasing it, black lines run
// out of the diamond over her face and body, and the stored chakra powers her strength and healing to the extreme; with
// it she throws punches that shatter the earth (the one that cracked Kaguya's ice and floor, "SHANNAROO!"). Here: she
// tugs her glove tight; the diamond on her forehead glows violet and the black seal lines crawl out of it, down her
// cheeks and over her arms; she charges, leaps and drives a fist into the target with a scream: the impact frame, the
// floor shatters in a starburst of cracks, slabs heave up and tilt, rocks fly, a gust of cherry petals; the lines
// recede.
// New: the seal lines crawling out of the diamond, the heaving slabs, the petals. One unique impact frame (a pink spiral).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE } from "../../core/index.js";
import { play, bodyAt, impactFrame, drawChunk } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { speedLines, hitSpark } from "./_taijutsu.js";

const GLOVE = 0.3, SEAL = 0.6, LINES = 0.8, CHARGE = 1.3, LEAP = 1.55, PUNCH = 1.85, RECEDE = 3.2, END = 4.2, TX = 160;
const DIA = ["#4a1a6a", "#9a4ad0", "#e0b0ff"].map(hex), INK = hex("#120810"), PETAL = ["#ff9ac8", "#ffc8e0", "#ffffff"].map(hex), ROCK = ["#2a2430", "#4a4250", "#6a6274", "#8a8494"].map(hex);

export const meta = {
  name: "Strength of a hundred: Shannaro",
  desc: "Sakura: the diamond on her forehead glows and black seal lines crawl over her face and arms; she charges, leaps and drives a fist into the target: the floor shatters in a starburst, slabs heave up, cherry petals scatter.",
  tags: ["jutsu", "sakura", "byakugou", "taijutsu", "strength", "melee", "one-shot"],
  size: [270, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1a6a", "#9a4ad0", "#ff9ac8", "#ffc8e0"], seed: 160 },
};

const TUG = { ...READY, crouch: 3, armsFront: true, fx: 10, fy: -24, bx: 6, by: -26, ffx: 8, fbx: -8 };
const FOCUS = { ...READY, crouch: 6, lean: 2, fx: 6, fy: -18, bx: -8, by: -20, ffx: 10, fbx: -10 };
const AIR = { ...READY, x: TX - 40, y: -24, crouch: 6, lean: 6, fx: -10, fy: -34, bx: 10, by: -26, ffx: 6, ffy: -8, fbx: -10, gait: false };
const PUNCHP = { ...READY, x: TX - 22, crouch: 7, lean: 12, fx: 28, fy: -26, bx: -6, by: -18, ffx: 14, fbx: -14, twist: 3, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#ff9ac8",
  poses: [
    [-0.25, READY],
    [GLOVE, TUG, "out"],
    [SEAL, FOCUS, "out"],
    [CHARGE, { ...FOCUS, crouch: 8 }],
    [LEAP, { ...FOCUS, x: TX - 70, crouch: 10, lean: 16, ghost: true }, "in"],
    [PUNCH - 0.08, AIR, "out"],
    [PUNCH, PUNCHP, "snap"],
    [RECEDE, PUNCHP],
    [END, { ...READY, x: TX - 22, gait: false }],
  ],
  hits: [
    { t: GLOVE, target: false, sfx: "step" },
    { t: SEAL, stop: 0.08, shake: 0.4, amp: 1, target: false, sfx: "cast" },
    { t: LEAP, target: false, sfx: "whoosh" },
    { t: PUNCH, stop: 0.32, shake: 1.6, amp: 8, push: 20, straw: 60, flash: 0.1, sfx: "explosion" },
  ],
  dust: [{ t: LEAP, x: TX - 70, n: 10, dir: -1 }, { t: PUNCH, x: TX - 10, n: 30, dir: 1 }, { t: PUNCH, x: TX - 30, n: 20, dir: -1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), rocks = [], petals = [];
  // the cracks radiating from the impact, and the slabs that heave up along them
  const CR = Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * Math.PI * 2 + rand(i, 1) * 0.3, L: 40 + rand(i, 2) * 70 }));
  const SLABS = Array.from({ length: 8 }, (_, i) => ({ x: TX - 70 + i * 20 + rand(i, 3) * 6, w: 10 + rand(i, 4) * 8, tilt: (rand(i, 5) - 0.5) * 0.8, h: 6 + rand(i, 6) * 12, d: Math.abs(i - 3.5) * 0.03 }));
  return {
    update(t, dt) {
      if (t >= PUNCH && !this.p) {
        this.p = 1; lights.add(TX, -20, 160, DIA[2], 0.8, 0.4);
        for (let i = 0; i < 24; i++) rocks.push({ x: TX + R.range(-30, 30), y: -2, vx: R.range(-200, 200), vy: -R.range(100, 320), a: R.range(0, 6), s: R.range(1.5, 4), age: 0 });
        for (let i = 0; i < 50; i++) petals.push({ x: TX + R.range(-20, 20), y: -R.range(4, 40), vx: R.range(-140, 220), vy: -R.range(20, 160), ph: R.range(0, 6), age: 0, c: R.int(0, 2) });
      }
      for (const r of rocks) { r.vy += 600 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.vx * 0.02 * dt; r.age += dt; if (r.y > -1) { r.y = -1; r.vy *= -0.3; r.vx *= 0.6; } }
      for (const q of petals) { q.vy += (40 - q.vy) * dt * 1.5; q.vx *= 1 - dt * 1.2; q.x += (q.vx + Math.sin(q.age * 5 + q.ph) * 20) * dt; q.y += q.vy * dt; q.age += dt; if (q.y > -1) q.y = -1; }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the starburst of cracks across the floor and the slabs heaving up out of it
      if (t > PUNCH) {
        const v = ease.outCubic(clamp((t - PUNCH) / 0.25)), k = 1 - smooth(END - 0.4, END, t);
        for (const c of CR) { const x1 = TX + Math.cos(c.a) * c.L * v, y1 = Math.sin(c.a) * c.L * v * 0.06; p.line(TX, 0, x1, y1, INK, k); p.line(TX + 1, 0.5, x1 + 1, y1 + 0.5, hex("#2a1a3a"), 0.6 * k); }
        for (const s of SLABS) {
          const u = ease.outBack(smooth(PUNCH + s.d, PUNCH + s.d + 0.25, t), 2) * (1 - 0.6 * smooth(PUNCH + 1.2, END, t)), h = s.h * u, x = s.x, c = Math.cos(s.tilt), sn = Math.sin(s.tilt);
          if (h < 0.5) continue;
          const P4 = [[-s.w / 2, 0], [s.w / 2, 0], [s.w / 2, -h], [-s.w / 2, -h]].map(([a, b]) => [x + a * c - b * sn, b * c + a * sn]);
          p.poly(P4, ROCK[2], k); p.line(P4[2][0], P4[2][1], P4[3][0], P4[3][1], ROCK[3], k); p.line(P4[1][0], P4[1][1], P4[2][0], P4[2][1], ROCK[1], k);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugou", t0: 0.04, t1: GLOVE, label: "BYAKUGOU", head: b.head });
      // the diamond on her forehead, glowing as the seal opens
      const open = smooth(SEAL - 0.1, SEAL + 0.1, t) * (1 - smooth(RECEDE, END - 0.2, t));
      p.poly([[hx + 1, hy - 5], [hx + 2.5, hy - 3.5], [hx + 1, hy - 2], [hx - 0.5, hy - 3.5]], open > 0.1 ? DIA[1] : DIA[0]);
      if (open > 0.1) { p.glow(hx + 1, hy - 3.5, 6 + 4 * open, DIA[1], 0.6 * open); p.px(hx + 1, hy - 4, DIA[2]); }
      // the seal lines crawling out of the diamond: down over the cheeks, then along the arms; receding at the end
      const crawl = smooth(LINES - 0.15, LINES + 0.45, t) * (1 - smooth(RECEDE, END - 0.2, t));
      if (crawl > 0.02) {
        const paths = [[[hx + 1, hy - 3], [hx + 3, hy], [hx + 3, hy + 3]], [[hx + 1, hy - 3], [hx - 1, hy], [hx - 1, hy + 3]], [b.chest, [(b.chest[0] + b.handN[0]) / 2, (b.chest[1] + b.handN[1]) / 2 - 1], b.handN], [b.chest, [(b.chest[0] + b.handF[0]) / 2, (b.chest[1] + b.handF[1]) / 2 - 1], b.handF]];
        for (const pts of paths) {
          let total = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
          let left = total * crawl;
          for (let i = 1; i < pts.length && left > 0; i++) { const u = Math.min(1, left / seg[i - 1]); p.line(pts[i - 1][0], pts[i - 1][1], pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u, INK); left -= seg[i - 1]; }
        }
      }
      // the charge and the leap: speed lines, a glow gathering in the fist
      if (t > CHARGE && t < PUNCH) speedLines(p, b.chest[0] - 50, b.chest[1] - 10, b.chest[0] - 6, b.chest[1] + 10, t, smooth(CHARGE, LEAP, t), -1);
      if (t > LEAP - 0.1 && t < PUNCH + 0.1) { const [x, y] = b.handN, k = smooth(LEAP - 0.1, PUNCH, t); p.glow(x, y, 10 * k, DIA[2], 0.6 * k); p.circle(x, y, 2 + k, WHITE, k); }
      if (t > PUNCH - 0.1 && t < PUNCH + 0.4) p.text("SHANNAROO!", hx - 6, hy - 18, PETAL[0], { font: "mini", align: "center", outline: INK, a: 1 - smooth(PUNCH + 0.25, PUNCH + 0.4, t) });
      if (t > PUNCH && t < PUNCH + 0.3) hitSpark(p, TX - 4, -24, t - PUNCH, { big: true, c: DIA[2] });
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK.slice(1), 1 - smooth(0.9, 1.4, r.age));
      for (const q of petals) { const k = 1 - smooth(1.2, 2.0, q.age), w = Math.abs(Math.sin(q.age * 9 + q.ph)); p.px(q.x, q.y, PETAL[q.c], k); if (w > 0.5) p.px(q.x + 1, q.y, PETAL[q.c], k); }
      ps.draw(p, "front");
      lights.draw(p);
      // the impact frame: one held instant of black-and-white shards on the punch
      if (t > PUNCH && t < PUNCH + 0.09) impactFrame(p, -56, -168, 214, 32, TX - 4, -24, Math.floor((t - PUNCH) / 0.045) % 2 === 1, 160, { style: "spiral", ink: hex("#1a0820"), paper: hex("#ffe4f2"), lines: 40 });
    },
  };
});
