// Susanoo: the bow (Sasuke, Eternal Mangekyou). Narutopedia: Susanoo forms round its user in stages, ribs, skeleton,
// armour; Sasuke's, in purple, carries a bow and looses arrows of chakra that can level a building. Here: his eternal
// Mangekyou (his own pattern crossed with Itachi's), the ribcage rising round him, the skeletal arm, the armoured upper
// body with its horned crest, a bow drawn with a purple flame arrow nocked, and the arrow loosed into the target, where
// it blows up in a violet burst.
// New: the Susanoo (_susanoo.js, growing out from the chest, both arms working the bow), the bow raised and aimed
// along the line to the target, the string drawn back to the nock, the flame arrow and its straight flight. From the library: the dark explosion, in violet.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as dark from "../shadow/dark-explosion.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.35, FLESH = BONES + 0.35, BOW = FLESH + 0.55, DRAW = BOW + 0.25, LOOSE = DRAW + 0.55, FLY = 0.12, HIT = LOOSE + FLY, GONE = HIT + 0.8, TX = 230;
const V = SUSANOO.sasuke;

export const meta = {
  name: "Susanoo arrow",
  desc: "Sasuke: his eternal Mangekyou, a purple Susanoo rising round him ribs first, then bones, then horned armour, a bow drawn with an arrow of purple flame, loosed into the target, which goes up in a violet blast.",
  tags: ["jutsu", "sasuke", "susanoo", "mangekyou", "projectile", "aoe", "one-shot"],
  size: [404, 256],
  origin: [64, 206],
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

// the aim: from the Susanoo's shoulder line at A to the target's chest; the bow comes up from pointing at the floor,
// overshoots a little and settles on the line, then holds dead still while the string is drawn
const A = [34, -74], T = [TX - 6, -28], AIMA = Math.atan2(T[1] - A[1], T[0] - A[0]);
const aimAt = (t) => {
  if (t < BOW) return 1.2;
  const u = clamp((t - BOW) / (DRAW + 0.15 - BOW));
  return 1.2 + (AIMA - 1.2) * ease.outBack(u, 1.4) + (t < LOOSE ? Math.sin(t * 9) * 0.03 * (1 - smooth(DRAW, DRAW + 0.35, t)) : 0);
};
// where the bow's grip (the front hand), the string's nock (the far hand) and the bow's limbs are
const bowAt = (t, pull) => {
  const a = aimAt(t), dx = Math.cos(a), dy = Math.sin(a), G = [A[0] + dx * 30, A[1] + dy * 30], Cb = [G[0] - dx * 34, G[1] - dy * 34];
  const top = [Cb[0] + Math.cos(a - 0.95) * 40, Cb[1] + Math.sin(a - 0.95) * 40], bot = [Cb[0] + Math.cos(a + 0.95) * 40, Cb[1] + Math.sin(a + 0.95) * 40];
  const N = [G[0] - dx * (11 + 18 * pull), G[1] - dy * (11 + 18 * pull)];
  return { a, dx, dy, G, Cb, top, bot, N };
};
export const create = play([{ fx: dark, t: HIT, x: TX - 6, y: -10, palette: ["#08040e", "#1c1030", "#3c2070", "#5a34a0", "#8a5ae0", "#c8a8ff", "#f0e6ff", "#ffffff"], light: 0.8 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let loosed = false;
  const pull = (t) => (t < DRAW ? 0 : t < LOOSE ? ease.outCubic(clamp((t - DRAW) / 0.35)) : 0);
  return {
    update(t, dt) {
      if (t > RIBS && t < GONE && R.chance(30 * dt)) ps.spawn(P.EMBER, R.range(-30, 40), -R.range(10, 100), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), V[R.int(2, 4)]);
      if (!loosed && t >= LOOSE) {
        loosed = true;
        const w = bowAt(t, 0);
        lights.add(w.G[0], w.G[1], 80, V[3], 0.9, 0.15);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const stage = t < RIBS ? 0 : t < BONES ? 1 * smooth(RIBS, BONES, t) : t < FLESH ? 1 + smooth(BONES, FLESH, t) : 2 + smooth(FLESH, FLESH + 0.55, t);
      const pl = pull(t), w = bowAt(t, pl), hold = smooth(BOW - 0.2, BOW + 0.1, t);
      // the hands: at rest at its sides, then the bow raised in the front hand and the far hand on the string
      const hand = [44 + (w.G[0] - 44) * hold, -50 + (w.G[1] + 50) * hold], hand2 = [-30 + (w.N[0] + 30) * hold, -40 + (w.N[1] + 40) * hold];
      drawSusanoo(p, t, { kind: "sasuke", stage, arm: hand, arm2: hand2, fade: smooth(GONE, GONE + 0.6, t) });
      ps.draw(p, "back");
      // the bow and its string, in the Susanoo's hand, turned along the aim
      if (t > BOW && t < GONE + 0.5) {
        const k = smooth(BOW, BOW + 0.2, t) * (1 - smooth(GONE, GONE + 0.5, t));
        p.arc(w.Cb[0], w.Cb[1], 40, 3, w.a - 0.95, w.a + 0.95, V[2], k);
        p.arc(w.Cb[0], w.Cb[1], 40, 1, w.a - 0.95, w.a + 0.95, V[4], k);
        p.line(w.top[0], w.top[1], w.N[0], w.N[1], V[4], k);
        p.line(w.bot[0], w.bot[1], w.N[0], w.N[1], V[4], k);
        // the arrow: a shaft of purple flame nocked and drawn back along the aim, its head a white point
        if (t > DRAW && t < LOOSE) {
          const len = 50, nx = -w.dy, ny = w.dx;
          for (let i = 0; i < len; i++) {
            const wd = i > len - 8 ? (len - i) * 0.6 : 1 + Math.sin(i * 0.8 - t * 30) * 0.6, x = w.N[0] + w.dx * i, y = w.N[1] + w.dy * i;
            p.line(x - nx * wd, y - ny * wd, x + nx * wd, y + ny * wd, i > len - 8 ? WHITE : V[3], k);
          }
          p.glowLine(w.N[0], w.N[1], w.N[0] + w.dx * len, w.N[1] + w.dy * len, 14, V[3], 0.6 * k);
          // the aim line: a faint sight running on to the target
          p.line(w.N[0] + w.dx * len, w.N[1] + w.dy * len, T[0], T[1], V[3], 0.25 * smooth(DRAW + 0.2, LOOSE, t));
        }
      }
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sasukeEMS", t0: EYE, t1: OPEN, label: "EIEN MANGEKYOU", head: b.head });
      drawGlint(p, t, "sasukeEMS", OPEN + 0.05, meta.duration - 0.4, b.head);
      // the arrow in flight: a streak of purple fire
      if (t >= LOOSE && t < HIT) {
        // straight down the aim line, from where its head was to the target
        const w = bowAt(LOOSE, 1), sx = w.N[0] + w.dx * 50, sy = w.N[1] + w.dy * 50, u = clamp((t - LOOSE) / FLY), x = sx + (T[0] - sx) * u, y = sy + (T[1] - sy) * u;
        p.glowLine(x - w.dx * 56, y - w.dy * 56, x, y, 16, V[3], 0.8);
        p.beam(x - w.dx * 44, y - w.dy * 44, x, y, 3, V[3]);
        p.line(x - w.dx * 44, y - w.dy * 44, x, y, WHITE);
      }
      if (t >= HIT && t < HIT + 0.06) p.circle(T[0], T[1], 34, WHITE);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
