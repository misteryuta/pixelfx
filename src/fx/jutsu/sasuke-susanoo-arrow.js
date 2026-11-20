// Susanoo: the bow (Sasuke, Eternal Mangekyou). Narutopedia: Susanoo forms round its user in stages, ribs, skeleton,
// armour; Sasuke's, in purple, carries a bow and looses arrows of chakra that can level a building. Here: his eternal
// Mangekyou (his own pattern crossed with Itachi's), the ribcage rising round him, the skeletal arm, the armoured upper
// body with its horned crest, a bow drawn with a purple flame arrow nocked, and the arrow loosed into the target, where
// it blows up in a violet burst.
// New: the Susanoo (_susanoo.js), the bow and its flame arrow. From the library: the dark explosion, in violet.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as dark from "../shadow/dark-explosion.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.35, FLESH = BONES + 0.35, BOW = FLESH + 0.3, DRAW = BOW + 0.25, LOOSE = DRAW + 0.55, FLY = 0.12, HIT = LOOSE + FLY, GONE = HIT + 0.8, TX = 230;
const V = SUSANOO.sasuke;

export const meta = {
  name: "Susanoo arrow",
  desc: "Sasuke: his eternal Mangekyou, a purple Susanoo rising round him ribs first, then bones, then horned armour, a bow drawn with an arrow of purple flame, loosed into the target, which goes up in a violet blast.",
  tags: ["jutsu", "sasuke", "susanoo", "mangekyou", "projectile", "aoe", "one-shot"],
  size: [382, 236],
  origin: [64, 186],
  duration: HIT + 3.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"], seed: 35 },
};

const STAND = { ...READY, crouch: 4, fx: 12, fy: -24, bx: -4, by: -22, ffx: 9, fbx: -9 };
const AIM = { ...READY, crouch: 5, lean: 2, fx: 16, fy: -28, bx: 2, by: -28, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, STAND, "out"],
    [BOW, { ...STAND, crouch: 5 }],
    [DRAW, AIM, "out"],
    [LOOSE, { ...AIM, bx: -2 }],
    [LOOSE + 0.05, { ...AIM, bx: -6, lean: -2 }, "snap"],
    [GONE + 0.4, STAND],
    [meta.duration, READY],
  ],
  hits: [
    { t: RIBS, stop: 0.06, shake: 0.15, amp: 1, target: false },
    { t: FLESH, stop: 0.06, shake: 0.2, amp: 2, target: false },
    { t: HIT, stop: 0.2, shake: 0.55, amp: 4, push: 5, straw: 40, skin: "shadow" },
    { t: meta.duration - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RIBS, x: 0, n: 10 }],
};

const NOCK = [14, -64], BOWX = 56;
export const create = play([{ fx: dark, t: HIT, x: TX - 6, y: -10, palette: ["#08040e", "#1c1030", "#3c2070", "#5a34a0", "#8a5ae0", "#c8a8ff", "#f0e6ff", "#ffffff"], light: 0.8 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let loosed = false;
  const pull = (t) => (t < DRAW ? 0 : t < LOOSE ? ease.outCubic(clamp((t - DRAW) / 0.35)) : 0);
  return {
    update(t, dt) {
      if (t > RIBS && t < GONE && R.chance(30 * dt)) ps.spawn(P.EMBER, R.range(-30, 40), -R.range(10, 100), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), V[R.int(2, 4)]);
      if (!loosed && t >= LOOSE) {
        loosed = true;
        lights.add(BOWX, -64, 80, V[3], 0.9, 0.15);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const stage = t < RIBS ? 0 : t < BONES ? 1 * smooth(RIBS, BONES, t) : t < FLESH ? 1 + smooth(BONES, FLESH, t) : 2 + smooth(FLESH, FLESH + 0.25, t);
      const pl = pull(t), hand = t < BOW ? [44, -50] : [BOWX - 6, -64];
      drawSusanoo(p, t, { kind: "sasuke", stage, arm: hand, fade: smooth(GONE, GONE + 0.6, t) });
      ps.draw(p, "back");
      // the bow and its string, in the Susanoo's hand
      if (t > BOW && t < GONE + 0.5) {
        const k = smooth(BOW, BOW + 0.2, t) * (1 - smooth(GONE, GONE + 0.5, t)), sx = NOCK[0] - 12 * pl;
        p.arc(BOWX - 34, -64, 40, 3, -0.95, 0.95, V[2], k);
        p.arc(BOWX - 34, -64, 40, 1, -0.95, 0.95, V[4], k);
        const top = [BOWX - 34 + Math.cos(-0.95) * 40, -64 + Math.sin(-0.95) * 40], bot = [BOWX - 34 + Math.cos(0.95) * 40, -64 + Math.sin(0.95) * 40];
        p.line(top[0], top[1], sx, -64, V[4], k);
        p.line(bot[0], bot[1], sx, -64, V[4], k);
        // the arrow: a shaft of purple flame nocked and drawn
        if (t > DRAW && t < LOOSE) {
          const ax = sx, len = 46;
          for (let i = 0; i < len; i++) {
            const w = i > len - 8 ? (len - i) * 0.6 : 1 + Math.sin(i * 0.8 - t * 30) * 0.6;
            p.line(ax + i, -64 - w, ax + i, -64 + w, i > len - 8 ? WHITE : V[3], k);
          }
          p.glowLine(ax, -64, ax + len, -64, 14, V[3], 0.6 * k);
        }
      }
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sasukeEMS", t0: EYE, t1: OPEN, label: "EIEN MANGEKYOU", head: b.head });
      drawGlint(p, t, "sasukeEMS", OPEN + 0.05, meta.duration - 0.4, b.head);
      // the arrow in flight: a streak of purple fire
      if (t >= LOOSE && t < HIT) {
        const u = clamp((t - LOOSE) / FLY), x = NOCK[0] + 34 + (TX - 10 - NOCK[0] - 34) * u, y = -64 + (-22 + 64) * u;
        p.glowLine(x - 50, y - 6, x, y, 16, V[3], 0.8);
        p.beam(x - 40, y - 4.5, x, y, 3, V[3]);
        p.line(x - 40, y - 4.5, x, y, WHITE);
      }
      if (t >= HIT && t < HIT + 0.06) p.circle(TX - 6, -22, 34, WHITE);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
