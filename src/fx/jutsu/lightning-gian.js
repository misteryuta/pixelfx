// Raiton: Gian (Lightning Release: False Darkness). Narutopedia: a spear of lightning fired from the mouth that pierces
// whatever it strikes; Kakuzu's mask used it, and Kumo's ninja. Here: Hare, Ox, Dragon; his chest crackles, lightning
// climbing up his throat; his jaw drops and a single straight spear of black-cored lightning shoots out, white-blue at
// its rim, crackling branches peeling off it; it goes through the target and keeps going out of the frame, leaving a
// hole of light where it went through; the branches fork down into the floor and scorch it.
// New: the throat charge, the dark-cored spear with peeling branches, the burn-through.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH, bolt } from "./_lib.js";

const SEALS = sealRun(0.05, ["u", "ushi", "tatsu"], 0.1, { hold: 0.15, kind: "lightning" });
const CHARGE = SEALS.end, FIRE = CHARGE + 0.45, HIT = FIRE + 0.08, FADE = HIT + 0.55, END = FADE + 1.1, TX = 180;
const LT = ["#05070e", "#1a3a7a", "#3a8ae8", "#9adaff", "#e8f8ff"].map(hex);

export const meta = {
  name: "Lightning release: false darkness",
  desc: "Hare, Ox, Dragon; lightning climbs up his throat, and a single straight spear of black-cored lightning shoots from his mouth through the target and out of the frame, branches peeling off it into the floor.",
  tags: ["jutsu", "lightning", "raiton", "beam", "projectile", "one-shot"],
  size: [320, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#05070e", "#1a3a7a", "#3a8ae8", "#9adaff", "#e8f8ff"], seed: 103 },
};

const ROAR = { ...READY, crouch: 6, lean: 6, fx: -2, fy: -16, bx: -8, by: -16, ffx: 11, fbx: -10, hy: -1 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [FIRE - 0.05, { ...ROAR, lean: -4 }, "out"],
    [FIRE, ROAR, "snap"],
    [FADE, ROAR],
    [FADE + 0.4, READY, "out"],
    [END, READY],
  ],
  hits: [
    { t: CHARGE, target: false, sfx: "thunder" },
    { t: FIRE, stop: 0.04, shake: 0.2, amp: 2, target: false, sfx: "cast" },
    { t: HIT, stop: 0.2, shake: 0.5, amp: 4, push: 4, straw: 34, skin: "shock", shiver: 0.7, sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -24, 160, LT[3], 1, 0.4); for (let i = 0; i < 20; i++) ps.spawn(P.SPARK, TX, -24, R.range(40, 240), R.range(-120, 80), R.range(0.1, 0.3), R.chance(0.5) ? WHITE : LT[3]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the scorch marks where the branches hit the floor
      if (t > HIT) for (let i = 0; i < 4; i++) p.ellipse(60 + i * 36 + rand(i, 2) * 10, 0, 5, 1, hex("#0c0810"), 1 - smooth(END - 0.6, END, t));
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, LT);
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0], b.head[1] + 5], f = Math.floor(t * 24);
      // the charge: lightning climbing from his chest up his throat
      if (t > CHARGE && t < FIRE) {
        const u = smooth(CHARGE, FIRE, t);
        for (let i = 0; i < 2; i++) bolt(p, b.chest[0] + (rand(f, i) - 0.5) * 8, b.chest[1] + 8, b.chest[0] + 2, b.chest[1] + 8 - 14 * u, f + i, LT, { jag: 0.4, seed: i, glow: 0.2 });
        p.glow(m[0], m[1], 8 * u, LT[3], 0.6);
      }
      // the spear: straight from his mouth to past the edge of the frame, a black core and a bright rim
      if (t > FIRE && t < FADE) {
        const u = clamp((t - FIRE) / 0.08), k = 1 - smooth(FADE - 0.2, FADE, t), x1 = m[0] + (300 - m[0]) * u;
        p.glowLine(m[0], m[1], x1, m[1], 18, LT[2], 0.7 * k);
        p.beam(m[0], m[1], x1, m[1], 5 * k + 1, LT[3], k);
        p.beam(m[0], m[1], x1, m[1], 2.5 * k + 0.5, LT[0], k);
        for (let i = 0; i < 5; i++) { const sx = m[0] + 10 + rand(f, i) * (x1 - m[0] - 20); bolt(p, sx, m[1], sx + (rand(f, i + 5) - 0.3) * 30, i % 2 ? 0 : m[1] - 20 - rand(f, i + 9) * 20, f + i, LT, { jag: 0.35, seed: i + 3, glow: 0.2 * k }); }
        p.circle(m[0] + 2, m[1], 3 * k + 1, WHITE, k);
      }
      // the hole of light where it went through
      if (t > HIT && t < HIT + 0.4) { const a = (t - HIT) / 0.4; p.circle(TX + 2, -24, 7 * (1 - a) + 2, WHITE, 1 - a); p.ring(TX + 2, -24, 6 + a * 20, 1, LT[3], 1 - a); }
      void ease; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
