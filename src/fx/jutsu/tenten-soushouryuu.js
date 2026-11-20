// Soushouryuu (Twin Rising Dragons, Tenten). Narutopedia: seals Tiger, Dragon, Monkey, Hare, Snake and arms crossed;
// Tenten stands two scrolls upright beside her, they rise and spin round each other wrapped in smoke shaped like
// dragons, and from between them she unseals weapon after weapon and rains them down on the target with pinpoint aim.
// Here: the seals, two scrolls standing, then rising and corkscrewing round each other in twin dragons of smoke, Tenten
// leaping up between them as they unroll, and a storm of kunai, shuriken and blades raining down on the target in arcs.
// New: the scrolls (rolled and unrolling paper with red rods), the twin smoke dragons, the weapons (each drawn: kunai,
// four-point shuriken, a short sword) on their arcs, stuck in the floor round the target after.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, arcPath } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["tora", "tatsu", "saru", "u", "mi"], 0.09, { hold: 0.15 });
const PLANT = SEALS.end, RISE = PLANT + 0.2, LEAP = RISE + 0.5, RAIN = LEAP + 0.2, NW = 18, WG = 0.05, LAND = RAIN + NW * WG + 0.4, END = LAND + 1.2, TX = 160;
const PAPER = hex("#f1e3c0"), ROD = hex("#b03050"), ROD2 = hex("#7a1a30"), INK = hex("#3a2a20"), SMOKE = [hex("#e6e8f0"), hex("#b8bcc8")], STEEL = [hex("#e8edf6"), hex("#a4afc6"), hex("#68748f")];

export const meta = {
  name: "Twin rising dragons",
  desc: "Tenten: Tiger, Dragon, Monkey, Hare, Snake, two scrolls stood up that rise and corkscrew round each other in dragons of smoke, and from between them a storm of kunai, shuriken and blades rains down on the target.",
  tags: ["jutsu", "tenten", "weapons", "projectile", "aoe", "one-shot"],
  size: [280, 210],
  origin: [50, 176],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a2a3e", "#b03050", "#e05a7a", "#f1e3c0", "#ffffff"], seed: 68 },
};

const UP = { ...READY, y: -70, crouch: 4, lean: 4, fx: 16, fy: -28, bx: -8, by: -30, ffx: 6, ffy: -6, fbx: -6, fby: -2 };
const THROWA = { ...UP, fx: 20, fy: -22, bx: -10, by: -32, lean: 8 };
const THROWB = { ...UP, fx: 2, fy: -32, bx: 18, by: -22, lean: 8, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [PLANT, { ...READY, crouch: 3, lean: 2, fx: 12, fy: -20, bx: -10, by: -20 }, "out"],
    [LEAP, { ...READY, crouch: 10 }],
    [RAIN, UP, "out"],
    ...Array.from({ length: Math.floor(NW / 2) }, (_, i) => [RAIN + i * WG * 2 + 0.02, i % 2 ? THROWB : THROWA, "snap"]),
    [LAND, { ...READY, crouch: 10 }, "in"],
    [END, READY],
  ],
  hits: [
    ...Array.from({ length: 6 }, (_, i) => ({ t: RAIN + 0.3 + i * WG * 3, stop: 0.02, flash: 0, push: (i % 2 ? -1 : 1) * 0.8, straw: 8, shiver: 0.3 })),
    { t: RAIN + 0.3 + NW * WG, stop: 0.1, shake: 0.25, amp: 2, push: 2, straw: 18 },
  ],
  dust: [{ t: LAND, x: 0, n: 8 }],
};

const SCROLLS = [-14, 14];
// each weapon: kind, where it lands, its arc
const WEAP = Array.from({ length: NW }, (_, i) => ({ kind: i % 3, lx: TX + (rand(i, 1) - 0.5) * 34, ly: -2 - rand(i, 2) * 46, t0: RAIN + i * WG }));

function weapon(p, kind, x, y, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), T = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  if (kind === 1) {
    for (let k = 0; k < 4; k++) {
      const a = ang * 4 + (k * TAU) / 4;
      p.tri(x, y, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, x + Math.cos(a + 1) * 1.4, y + Math.sin(a + 1) * 1.4, k % 2 ? STEEL[0] : STEEL[1]);
    }
    p.px(x, y, STEEL[2]);
    return;
  }
  const L = kind === 2 ? 9 : 5;
  p.poly([T(L, 0), T(1, -1.3), T(1, 1.3)], STEEL[0]);
  p.line(...T(1, 0), ...T(-4, 0), kind === 2 ? hex("#7a3a2a") : STEEL[2]);
  if (kind === 0) p.circle(...T(-5, 0), 1, STEEL[2]);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      if (t > RISE && t < RAIN + 0.6 && R.chance(70 * dt)) {
        const u = t - RISE, i = R.int(0, 1), a = u * 10 + i * Math.PI, y = -10 - Math.min(80, u * 140);
        ps.spawn(P.SMOKE, Math.cos(a) * 14, y, R.range(-10, 10), -R.range(10, 30), R.range(0.5, 0.9), SMOKE[i], R.range(3, 5));
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      // the weapons left stuck in the floor round the target
      for (const [i, w] of WEAP.entries()) if (t > w.t0 + 0.3 && w.ly > -10) weapon(p, w.kind, w.lx, -2, -Math.PI / 2 + (rand(i, 4) - 0.5) * 0.6);
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, [hex("#3a2a3e"), ROD2, ROD, hex("#e05a7a"), PAPER]);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "scroll", t0: 0.05, t1: SEALS.end, label: "SOUSHOURYUU", head: b.head });
      // the two scrolls: stood upright beside her, then rising and corkscrewing round each other, unrolling
      SCROLLS.forEach((sx, i) => {
        if (t < PLANT) return;
        const u = t - RISE, a = u * 10 + i * Math.PI, rise = t < RISE ? 0 : Math.min(84, u * 150);
        const x = t < RISE ? sx : Math.cos(a) * 14, y = -rise, unroll = smooth(LEAP, RAIN + 0.3, t);
        if (t > RAIN + 1.2) return;
        p.rect(x - 2, y - 12, 4, 12, PAPER);
        p.rect(x - 3, y - 13, 6, 2, ROD);
        p.rect(x - 3, y - 1, 6, 2, ROD2);
        if (unroll > 0) {
          const L = 30 * unroll;
          p.rect(x + 2, y - 11, L, 10, PAPER);
          for (let k = 4; k < L; k += 5) p.line(x + 2 + k, y - 9, x + 2 + k, y - 3, INK);
          p.rect(x + 2 + L, y - 12, 2, 12, ROD);
        }
      });
      // the twin dragons of smoke: two heads at the top of the corkscrew while they rise
      if (t > RISE && t < RAIN + 0.4) {
        const u = t - RISE, k = 1 - smooth(RAIN, RAIN + 0.4, t);
        for (let i = 0; i < 2; i++) {
          const a = u * 10 + i * Math.PI, x = Math.cos(a) * 14, y = -10 - Math.min(84, u * 150) - 12;
          p.disc(x, y, 6, SMOKE[i], 0.8 * k);
          p.tri(x + 4, y - 2, x + 11, y - 1, x + 4, y + 2, SMOKE[i], k);
          p.px(x + 3, y - 2, hex("#3a2a20"));
          p.line(x - 3, y - 5, x - 7, y - 9, SMOKE[1], k);
        }
      }
      // the storm: weapons flung from her hands, arcing down onto the target
      for (const [i, w] of WEAP.entries()) {
        const a = t - w.t0;
        if (a < 0 || a > 0.3) continue;
        const path = arcPath(b.handN[0], b.handN[1], w.lx, w.ly, 10 + (i % 4) * 6)(a / 0.3);
        weapon(p, w.kind, path.x, path.y, w.kind === 1 ? t * 20 : path.ang);
        p.line(path.x - Math.cos(path.ang) * 8, path.y - Math.sin(path.ang) * 8, path.x - Math.cos(path.ang) * 3, path.y - Math.sin(path.ang) * 3, STEEL[1], 0.6);
      }
      ps.draw(p, "front");
    },
  };
});
