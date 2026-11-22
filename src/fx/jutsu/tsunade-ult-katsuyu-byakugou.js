// ULTIMATE: Byakugou no In + Kuchiyose: Katsuyu, the heaven-splitting punch (Tsunade, the Fifth Hokage). Narutopedia:
// releasing the Strength of a Hundred Seal on her brow, black lines spread over Tsunade's body and the stored chakra
// heals any wound in an instant (Sozo Saisei); she summons Katsuyu, the giant white slug with blue stripes; against
// Madara's Susanoo she leapt up and punched with all her monstrous strength. Here: the diamond on her brow opens, the
// black lines crawl over her face and arms; she bites her thumb and slams her palm down: Katsuyu rises behind her in a
// cloud of smoke, huge and pale, splitting into small slugs that cling to her; she leaps high (a white streak), turns
// in the air and comes down fist first: the punch splits the floor, a canyon of cracks racing out, slabs flung up,
// Katsuyu's acid spray hissing over the target.
// New: Katsuyu (pale body, blue stripes, eye stalks), the clinging slugs, the leap and the dive punch, the canyon;
// ULTIMATE staging; one impact frame (shards in gold and violet).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof, drawChunk, impactFrame } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { ultSky, ultBanner, ultStreaks, frameOf } from "./_ultimate.js";

const SEAL = 0.3, LINES = 0.5, BITE = 1.1, SLAP = 1.3, SLUG = 1.45, SPLIT = 2.2, LEAP = 2.5, APEX = 2.9, DIVE = 3.05, HIT = 3.3, SPRAY = 3.5, END = 5.4, TX = 210;
const SLUGC = ["#5a6a8a", "#a8b8d8", "#e8eef8", "#ffffff"].map(hex), STRIPE = hex("#3a5aa8"), DIA = ["#4a1a6a", "#9a4ad0", "#e0b0ff"].map(hex), INK = hex("#120810");
const ROCK = ["#2a2430", "#4a4250", "#6a6274", "#8a8494"].map(hex), ACID = hex("#b0f060"), KX = -14;

export const meta = {
  name: "Strength of a hundred: Katsuyu",
  desc: "ULTIMATE. Tsunade releases the seal on her brow, black lines spreading over her; Katsuyu the giant slug rises behind her and clings to her as small slugs; she leaps high and dives fist first, splitting the floor into a canyon as Katsuyu's acid sprays the target.",
  tags: ["jutsu", "ultimate", "tsunade", "byakugou", "katsuyu", "summon", "taijutsu", "strength", "one-shot"],
  size: [360, 270],
  origin: [90, 240],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1a6a", "#9a4ad0", "#e0b0ff", "#ffd060"], seed: 173 },
};

const FOCUS = { ...READY, crouch: 4, fx: 6, fy: -30, bx: -6, by: -22, ffx: 8, fbx: -8 };
const SLAPP = { ...READY, crouch: 14, lean: 16, fx: 16, fy: -2, bx: -4, by: -18, ffx: 10, fbx: -12 };
const AIR = { ...READY, x: TX - 30, y: -110, crouch: 8, lean: -10, fx: -6, fy: -36, bx: 6, by: -30, ffx: 6, ffy: -8, fbx: -6, gait: false };
const DIVEP = { ...READY, x: TX - 10, y: -50, crouch: 4, lean: 50, fx: 20, fy: -10, bx: -4, by: -30, ffx: -6, ffy: -20, fbx: -12, gait: false };
const LANDP = { ...READY, x: TX - 14, crouch: 13, lean: 18, fx: 18, fy: -2, bx: -8, by: -22, ffx: 12, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#e0b0ff",
  poses: [
    [-0.25, READY],
    [SEAL, FOCUS, "out"],
    [BITE, { ...FOCUS, fx: 6, fy: -32 }],
    [SLAP, SLAPP, "in"],
    [LEAP - 0.1, { ...SLAPP, crouch: 15 }],
    [APEX, AIR, "out"],
    [DIVE, { ...AIR, lean: 20 }],
    [HIT - 0.04, DIVEP, "in"],
    [HIT, LANDP, "snap"],
    [END, { ...LANDP, crouch: 8, lean: 4 }],
  ],
  hits: [
    { t: SEAL, stop: 0.08, shake: 0.3, amp: 1, target: false, sfx: "cast" },
    { t: SLAP, stop: 0.06, shake: 0.5, amp: 2, target: false, sfx: "step" },
    { t: SLUG, shake: 1.0, amp: 3, target: false, sfx: "rumble" },
    { t: LEAP, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.34, shake: 1.6, amp: 9, push: 10, straw: 80, flash: 0.1, sfx: "explosion" },
    { t: SPRAY, stop: 0.05, push: 0, straw: 10, flash: 0, skin: "poison", sfx: "whoosh" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: LEAP, x: 0, n: 14 }, { t: HIT, x: TX - 30, n: 30, dir: -1 }, { t: HIT, x: TX + 30, n: 30, dir: 1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta), rocks = [];
  const up = (t) => ease.outBack(smooth(SLUG, SLUG + 0.6, t), 1.2) * (1 - smooth(SPLIT, SPLIT + 0.4, t));
  const CR = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2 + rand(i, 1) * 0.3, L: 50 + rand(i, 2) * 100 }));
  const SL = Array.from({ length: 10 }, (_, i) => ({ x: (rand(i, 3) - 0.5) * 120, y: -rand(i, 4) * 60 }));
  return {
    update(t, dt) {
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -10, 200, DIA[2], 0.9, 0.5); for (let i = 0; i < 30; i++) rocks.push({ x: TX + R.range(-30, 30), y: -2, vx: R.range(-260, 260), vy: -R.range(120, 340), a: R.range(0, 6), s: R.range(2, 5), age: 0 }); }
      for (const r of rocks) { r.vy += 600 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.vx * 0.02 * dt; r.age += dt; if (r.y > -1) { r.y = -1; r.vy *= -0.3; r.vx *= 0.6; } }
      if (t > SPRAY && t < SPRAY + 0.8 && R.chance(60 * dt)) ps.spawn(P.SPARK, TX + R.range(-20, 20), -R.range(10, 50), R.range(-40, 40), R.range(-20, 40), R.range(0.3, 0.6), ACID);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: SEAL, t1: END - 0.2, tone: "#0a0610", glow: "#2a1240" });
      // Katsuyu: a giant pale slug rearing behind her, blue stripes along its back, eye stalks; then splitting
      const g = up(t);
      if (g > 0.02) {
        p.shade(KX - 90, -170 * g - 20, KX + 70, 1, (x, y, out) => {
          const lx = (x - KX) / g, ly = y / g;
          // a long low body along the ground, its front reared up into the head, two eye stalks on top
          const body = ((lx + 24) / 92) ** 2 + ((ly + 24) / 26) ** 2 < 1 || ((lx - 34) / 28) ** 2 + ((ly + 70) / 46) ** 2 < 1;
          const stalks = Math.abs(lx - 30 - (ly + 120) * -0.25) < 2.6 && ly > -142 && ly < -110 || Math.abs(lx - 48 - (ly + 120) * -0.4) < 2.6 && ly > -138 && ly < -108;
          if (!body && !stalks && ly > -2 && ly < 0 && Math.abs(lx + 24) < 92) { out.a = 0.9; return hex("#3a4a6a"); }
          if (!body && !stalks) return;
          out.a = 0.95;
          if (stalks) return ly < -134 ? hex("#1a2030") : SLUGC[1];
          if (ly > -8) return SLUGC[0];
          if (Math.abs(Math.sin((lx + ly) * 0.08)) < 0.1 && ly < -20) return STRIPE;
          return noise2(lx * 0.08, ly * 0.08, 91) > 0.2 ? SLUGC[2] : SLUGC[1];
        });
      }
      drawPoof(p, KX, -60, t - SLUG + 0.05, 4, 3);
      // the canyon split into the floor at the impact
      if (t > HIT) {
        const v = ease.outCubic(clamp((t - HIT) / 0.25)), k = 1 - smooth(END - 0.4, END, t);
        for (const c of CR) { const x1 = TX + Math.cos(c.a) * c.L * v, y1 = Math.abs(Math.sin(c.a)) * c.L * v * 0.05; p.beam(TX, 0, x1, y1, 2, INK, k); }
        p.ellipse(TX, 1, 44 * v, 5 * v, hex("#08060c"), k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      ultBanner(p, t, box, { t0: 0.05, name: "BYAKUGOU: KATSUYU", hold: 1.0, color: "#e0b0ff" });
      drawBadge(p, t, { kind: "byakugou", t0: 0.1, t1: SEAL, label: "BYAKUGOU", head: b.head });
      // the diamond open on her brow; the seal lines crawling over her
      const open = smooth(SEAL - 0.1, SEAL + 0.1, t);
      p.poly([[hx + 1, hy - 5], [hx + 2.5, hy - 3.5], [hx + 1, hy - 2], [hx - 0.5, hy - 3.5]], open > 0.1 ? DIA[1] : DIA[0]);
      if (open > 0.1) p.glow(hx + 1, hy - 3.5, 8, DIA[1], 0.6 * open);
      const crawl = smooth(LINES, LINES + 0.5, t);
      if (crawl > 0) for (const [a, c] of [[[hx + 1, hy - 3], [hx + 3, hy + 3]], [[hx + 1, hy - 3], [hx - 1, hy + 3]], [b.chest, b.handN], [b.chest, b.handF]]) p.line(a[0], a[1], a[0] + (c[0] - a[0]) * crawl, a[1] + (c[1] - a[1]) * crawl, INK);
      if (t > BITE && t < SLAP) p.px(b.handN[0], b.handN[1], hex("#e01828"));
      // the small slugs clinging to her after Katsuyu splits
      if (t > SPLIT) for (const s of SL) { const u = smooth(SPLIT, SPLIT + 0.4, t), x = KX + s.x + (b.chest[0] - KX - s.x) * u, y = -60 + s.y + (b.chest[1] + 60 - s.y) * u; if (u < 1) p.ellipse(x, y, 2.5, 1.5, SLUGC[2]); }
      if (t > SPLIT + 0.4) for (let i = 0; i < 3; i++) p.ellipse(b.chest[0] - 2 + i * 2, b.chest[1] + (i - 1) * 4, 1.5, 1, SLUGC[2]);
      // the dive: a white streak behind her, her fist blazing
      if (t > APEX && t < HIT + 0.05) { ultStreaks(p, t, box, 0.6, -1, DIA[2]); const [x, y] = b.handN; p.glow(x, y, 14, DIA[2], 0.7); p.circle(x, y, 3, WHITE); }
      if (t > HIT - 0.05 && t < HIT + 0.4) p.text("SHANNARO!", hx, hy - 16, DIA[2], { font: "mini", align: "center", outline: INK, a: 1 - smooth(HIT + 0.25, HIT + 0.4, t) });
      // Katsuyu's acid spray hissing over the target
      if (t > SPRAY && t < SPRAY + 0.6) { const v = (t - SPRAY) / 0.6; for (let i = 0; i < 12; i++) p.px(TX - 30 + i * 5 + Math.sin(i + t * 10) * 2, -40 + v * 30 + (i % 3) * 3, ACID, 1 - v); }
      for (const r of rocks) drawChunk(p, r.x, r.y, r.s, r.a, ROCK.slice(1), 1 - smooth(1, 1.6, r.age));
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= HIT && t < HIT + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -10, false, 173, { style: "shards", ink: hex("#1a0a20"), paper: hex("#fff2d0"), lines: 30 });
      void TAU;
    },
  };
});
