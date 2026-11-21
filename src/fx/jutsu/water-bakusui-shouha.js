// Suiton: Bakusui Shouha (Water Release: Exploding Water Colliding Wave). Narutopedia: the user spits out an enormous
// volume of water that floods the area, turning the ground into a sea; it was Kisame's and later Killer B's. Here: Ox,
// Snake; a breath that bloats his cheeks; then water pours out of him without end, a torrent that hits the floor and
// spreads, the level rising fast, a wall of water rolling toward the target, curling over at its crest; it crashes over
// the target and keeps going; for a moment everything is underwater, bubbles rising; then the water drains away into
// the ground, leaving the floor shining wet.
// New: the torrent, the rising water level with its surface and wave, the crest, the underwater moment.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH, veil } from "./_lib.js";
import * as splash from "../water/splash.js";

const SEALS = sealRun(0.05, ["ushi", "mi"], 0.12, { hold: 0.15, kind: "water" });
const SPIT = SEALS.end + 0.3, FLOOD = SPIT + 0.25, CREST = FLOOD + 0.55, CRASH = CREST + 0.25, UNDER = CRASH + 0.15, DRAIN = UNDER + 0.7, END = DRAIN + 1.2, TX = 180;
const W = ["#0a1630", "#123063", "#1b5596", "#2a7fc4", "#45a9e3", "#86d3f5", "#cdf1ff", "#ffffff"].map(hex);

export const meta = {
  name: "Water release: exploding water colliding wave",
  desc: "Ox, Snake, a bloated breath, and water pours out of him without end: it floods the floor, rises into a wall that curls at its crest and crashes over the target; for a moment everything is underwater, then it drains away.",
  tags: ["jutsu", "water", "suiton", "flood", "aoe", "one-shot"],
  size: [320, 190],
  origin: [56, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a1630", "#123063", "#1b5596", "#2a7fc4", "#45a9e3", "#86d3f5", "#cdf1ff", "#ffffff"], seed: 102 },
};

const PUFF = { ...READY, crouch: 3, lean: -6, fx: 4, fy: -22, bx: -4, by: -22, ffx: 8, fbx: -8 };
const POUR = { ...READY, crouch: 8, lean: 14, fx: 8, fy: -18, bx: -6, by: -16, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SPIT - 0.05, PUFF, "out"],
    [SPIT, POUR, "snap"],
    [CRASH + 0.2, POUR],
    [CRASH + 0.6, READY, "out"],
    [END, READY],
  ],
  hits: [
    { t: SPIT, stop: 0.04, shake: 0.4, amp: 1, target: false, sfx: "cast" },
    { t: FLOOD, shake: 1.2, amp: 1, target: false, sfx: "rumble" },
    { t: CRASH, stop: 0.18, shake: 0.8, amp: 6, push: 7, straw: 40, skin: "ice", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([{ fx: splash, t: CRASH, x: TX, stone: false, light: 0.8 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), bubbles = [];
  // the water: a level that rises from the floor and a front that races toward the target, building a wave at its edge
  const front = (t) => 10 + (TX + 60) * ease.inOutQuad(clamp((t - FLOOD) / (CRASH - FLOOD + 0.3)));
  const level = (t) => 22 * smooth(FLOOD, CREST, t) * (1 - smooth(DRAIN, END - 0.3, t)) + (t > CRASH && t < DRAIN ? 30 * Math.sin(Math.PI * smooth(CRASH, DRAIN, t)) : 0);
  return {
    update(t, dt) {
      if (t > UNDER && t < DRAIN && R.chance(40 * dt)) bubbles.push({ x: R.range(-40, 260), y: -R.range(0, 10), r: R.range(1, 2.5), vy: -R.range(30, 70), age: 0 });
      for (const q of bubbles) { q.age += dt; q.y += q.vy * dt; q.x += Math.sin(q.age * 6) * 0.3; }
      if (t >= CRASH && !this.c) { this.c = 1; lights.add(TX, -30, 160, W[5], 0.8, 0.4); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, W.slice(2));
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0], b.head[1] + 5];
      // the bloated cheeks
      if (t > SPIT - 0.25 && t < SPIT) p.circle(m[0], m[1] - 1, 3, hex("#f1c7a3"));
      // the torrent from his mouth down to the floor, thick and endless
      if (t > SPIT && t < CRASH + 0.3) {
        const k = 1 - smooth(CRASH, CRASH + 0.3, t);
        for (let i = 0; i < 4; i++) { const ph = (t * 4 + i / 4) % 1; p.beam(m[0], m[1], m[0] + 14 + ph * 10, -2, 5 - i, W[4 + (i % 3)], k); }
        p.beam(m[0], m[1], m[0] + 18, -2, 2, W[7], k);
      }
      // the water: its body, a lit surface line, a wave curling at its front that grows into a wall
      const L = level(t), F = front(t);
      if (L > 0.5 && t > FLOOD) {
        const crestH = 60 * Math.sin(Math.PI * smooth(FLOOD + 0.2, CRASH + 0.25, t)), cx = F;
        p.shade(-56, -110, Math.min(270, F + 30), 1, (x, y, out) => {
          const dist = cx - x, wave = dist < 40 && dist > -20 ? crestH * Math.max(0, 1 - Math.abs(dist - 8) / 32) : 0;
          const surf = -(L + wave) + Math.sin(x * 0.12 + t * 8) * 1.5;
          if (y < surf || x > cx + 10) return;
          // the curl of the crest: hollow under the lip
          if (wave > 20 && dist < 10 && dist > -6 && y > surf + 6 && y < surf + wave * 0.6) return;
          const depth = y - surf, n = noise2(x * 0.08 - t * 2, y * 0.1, 3);
          if (depth < 1.5) return W[7];
          if (depth < 4) return W[6];
          return n > 0.4 ? W[5] : depth < 12 ? W[4] : depth < 30 ? W[3] : W[2];
        });
        // spray off the crest
        if (crestH > 10) for (let i = 0; i < 8; i++) { const a = t * 10 + i; p.px(cx + 4 + rand(Math.floor(t * 20), i) * 10, -(L + crestH) - rand(i, Math.floor(t * 20)) * 8, W[7]); }
      }
      // underwater: the frame tinted blue, bubbles rising
      if (t > UNDER && t < DRAIN + 0.3) {
        const k = smooth(UNDER, UNDER + 0.1, t) * (1 - smooth(DRAIN, DRAIN + 0.3, t));
        veil(p, -56, -160, 264, 30, W[2], 0.35 * k);
        for (const q of bubbles) p.ring(q.x, q.y, q.r, 1, W[6], k * (1 - smooth(0.6, 1.2, q.age)));
      }
      // the floor shining wet after
      if (t > DRAIN) p.line(-40, 0, 260, 0, W[5], 0.6 * (1 - smooth(DRAIN + 0.5, END, t)));
      void WHITE; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
