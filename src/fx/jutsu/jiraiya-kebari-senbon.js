// Ninpou: Kebari Senbon (Ninja Art: Needle Senbon, Jiraiya). Narutopedia: Jiraiya grows his long white hair out with
// chakra and hardens it into needles: wrapped round himself it is the Hari Jizou shield, fired it is a storm of senbon.
// Here: he spins, and his white mane grows, rushing out behind him in a long wave; it hardens, every strand a spike, a
// porcupine ball curling round him (the shield) for a beat; then he whips his head forward and the hair fires: a
// storm of white needles fanning across the floor, raking the target, sticking in it and the ground round it, quivering;
// the hair shrinks back to its usual length and he flicks it over his shoulder.
// New: the growing hair (a mass of strands with a direction), the hardening, the shield, the needle storm.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 170, GROW = 0.35, LONG = 0.95, HARD = 1.1, SHIELD = 1.3, FIRE = 1.75, STUCK = 2.0, SHRINK = 2.7, END = 3.6;
const HAIR = ["#8a8a96", "#c8c8d0", "#ecebf2", "#ffffff"].map(hex);

export const meta = {
  name: "Ninja art: needle senbon",
  desc: "Jiraiya: his white mane grows and rushes out behind him, hardens into spikes and curls round him as a shield, then he whips his head forward and it fires a storm of white needles that rake the target and stick quivering in the floor.",
  tags: ["jutsu", "jiraiya", "sannin", "hair", "projectile", "aoe", "one-shot"],
  size: [300, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#8a8a96", "#c8c8d0", "#ecebf2", "#ffffff"], seed: 5 },
};

const HUNCH = { ...READY, crouch: 9, lean: 12, armsFront: true, fx: 8, fy: -16, bx: 6, by: -16, ffx: 9, fbx: -9 };
const WHIP = { ...READY, crouch: 6, lean: 18, fx: 14, fy: -18, bx: -8, by: -20, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [GROW, { ...READY, crouch: 4, lean: -6, fx: 4, fy: -22, bx: -4, by: -22 }, "out"],
    [SHIELD, HUNCH, "out"],
    [FIRE - 0.1, { ...HUNCH, lean: 6 }],
    [FIRE, WHIP, "snap"],
    [SHRINK, { ...WHIP, lean: 10 }],
    [END - 0.3, { ...READY, crouch: 2 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: GROW, target: false, sfx: "cast" },
    { t: HARD, stop: 0.05, shake: 0.15, amp: 1, target: false, sfx: "block" },
    { t: FIRE, stop: 0.05, target: false, sfx: "whoosh" },
    ...[0.08, 0.14, 0.2, 0.26].map((d) => ({ t: FIRE + d, stop: 0.02, shake: 0.15, amp: 1, push: 1.2, straw: 10, sfx: "punch" })),
    { t: FIRE + 0.3, stop: 0.1, shake: 0.3, amp: 2, push: 2, straw: 24, skin: "holy" },
    { t: SHRINK + 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the needles: each leaves the hair at its own instant, flies on a slightly fanned line, sticks where it hits
  const NEED = Array.from({ length: 60 }, (_, i) => { const tx = TX - 30 + rand(i, 1) * 70, ty = -rand(i, 2) * 50; return { tx, ty: ty > -3 ? -1 : ty, t0: FIRE + rand(i, 3) * 0.25, a: rand(i, 4) * 0.3 - 0.15 }; });
  return {
    update(t, dt) {
      for (const n of NEED) if (t >= n.t0 + 0.08 && !n.hit) { n.hit = 1; if (R.chance(0.4)) ps.spawn(P.SPARK, n.tx, n.ty, R.range(-40, 40), -R.range(10, 60), R.range(0.06, 0.12), WHITE); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head, f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "summon", t0: 0.04, t1: GROW, label: "SENNIN", head: b.head });
      // the hair: strands from the back of his head, growing long, rushing back; hardened into spikes; curled into a
      // ball round him as a shield; whipped forward; shrinking back
      const L = 6 + 46 * ease.outCubic(smooth(GROW, LONG, t)) * (1 - smooth(SHRINK, SHRINK + 0.4, t)), hard = smooth(HARD - 0.05, HARD + 0.1, t) * (1 - smooth(FIRE + 0.2, SHRINK, t));
      const shield = smooth(HARD + 0.1, SHIELD, t) * (1 - smooth(FIRE - 0.15, FIRE, t)), whip = smooth(FIRE - 0.1, FIRE, t) * (1 - smooth(FIRE + 0.3, SHRINK, t));
      for (let i = 0; i < 22; i++) {
        const s = i / 21, base = [hx - 2, hy - 2 + s * 6];
        // free: streaming back and down, waving; shield: wrapped round him; whip: thrown forward over his head
        const free = -Math.PI * 0.85 + s * 0.9 + Math.sin(t * 6 + i * 0.7) * 0.12 * (1 - hard);
        const round = -Math.PI / 2 + (s - 0.5) * TAU * 0.95, fwd = -0.6 + s * 0.8;
        let a = free + (round - free) * shield;
        a = a + (fwd - a) * whip;
        const len = L * (0.7 + 0.3 * rand(i, 2)) * (shield > 0.5 ? 0.6 : 1), cx = shield > 0.3 ? b.chest[0] : base[0], cy = shield > 0.3 ? b.chest[1] : base[1];
        const sx = base[0] + (cx - base[0]) * shield, sy = base[1] + (cy - base[1]) * shield;
        const mid = [sx + Math.cos(a - 0.3 * (1 - hard)) * len * 0.5, sy + Math.sin(a - 0.3 * (1 - hard)) * len * 0.5], end = [sx + Math.cos(a) * len, sy + Math.sin(a) * len];
        const w = hard > 0.5 ? 1.6 : 2.4;
        p.beam(sx, sy, mid[0], mid[1], w + 0.6, HAIR[0]);
        p.beam(mid[0], mid[1], end[0], end[1], w * (hard > 0.5 ? 0.6 : 1), HAIR[i % 2 ? 1 : 2]);
        if (hard > 0.5) p.px(end[0], end[1], HAIR[3]);
      }
      if (hard > 0 && t < HARD + 0.15) p.glow(hx - 10, hy, 30, HAIR[3], 0.4 * (1 - (t - HARD) / 0.15));
      // the needle storm: white streaks fanning out to the target and the floor round it; stuck needles quivering
      for (const n of NEED) {
        const u = clamp((t - n.t0) / 0.08);
        if (t < n.t0 || t > SHRINK + 0.5) continue;
        const sx = hx + 6, sy = hy - 4, x = sx + (n.tx - sx) * u, y = sy + (n.ty - sy) * u, ang = Math.atan2(n.ty - sy, n.tx - sx);
        const q = u >= 1 ? Math.sin((t - n.t0) * 60) * Math.exp(-(t - n.t0) * 8) * 0.2 : 0, c = Math.cos(ang + q), s = Math.sin(ang + q);
        const k = 1 - smooth(SHRINK, SHRINK + 0.5, t);
        p.line(x - c * 7, y - s * 7, x, y, HAIR[2], k);
        p.px(x, y, WHITE, k);
        if (u < 1) p.line(x - c * 16, y - s * 16, x - c * 7, y - s * 7, HAIR[1], 0.4);
      }
      void noise2; void f; void lights;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
