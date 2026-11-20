// Katon: Gouka Mekkyaku (Great Fire Destruction, Madara). Narutopedia: seals Rat, Ox, Dog, Horse, Monkey, Boar, Tiger;
// chakra kneaded in the body turned to fire and let out of the mouth as a massive stream that sets a vast area ablaze,
// a veritable sea of flame. Here: his eternal Mangekyou, the seven seals, a breath, and a wall of fire rolls out of his
// mouth, widening as it goes until it fills the ground from him to past the target in a towering, churning front, then
// burns down to fires scattered over the floor.
// New: the sea of flame (one shaded sheet of fire whose front races out and whose height grows with distance, churned
// by noise, licking at the top). From the toolkit: blazes left burning.
import { Particles, Blazes, Lights, P, PF, Rng, READY, fit, clamp, smooth, ease, hex, noise2, WHITE } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["ne", "ushi", "inu", "uma", "saru", "i", "tora"], 0.09, { hold: 0.25, kind: "fire", last: { fx: 8, fy: -30, bx: 9, by: -30 } });
const BREATH = SEALS.end, BLOW = BREATH + 0.25, SPEED = 300, HOLDF = BLOW + 1.3, DIE = HOLDF + 0.6, TX = 160, FAR = 290;
const FIRE = ["#2a0a06", "#7a1a0c", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6"];

export const meta = {
  name: "Great fire destruction",
  desc: "Madara: his eternal Mangekyou, Rat, Ox, Dog, Horse, Monkey, Boar, Tiger, a breath, and a wall of fire rolls out of his mouth, widening until a sea of flame fills the ground past the target, then burns down.",
  tags: ["jutsu", "madara", "fire", "katon", "mangekyou", "aoe", "one-shot"],
  size: [362, 222],
  origin: [48, 188],
  duration: DIE + 3.0,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: FIRE, seed: 44 },
};

const BREATHE = { ...READY, crouch: 3, lean: -8, fx: 8, fy: -30, bx: 9, by: -30, armsFront: true, ffx: 8, fbx: -8 };
const BLOWP = { ...READY, crouch: 6, lean: 8, fx: 11, fy: -29, bx: -6, by: -24, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BLOW - 0.04, BREATHE, "out"],
    [BLOW, BLOWP, "snap"],
    [HOLDF, { ...BLOWP, lean: 10, crouch: 7 }],
    [DIE + 0.3, { ...READY, crouch: 4 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: BLOW + (TX - 20) / SPEED, stop: 0.12, shake: 0.4, amp: 3, push: 3, straw: 26, skin: "char" },
    ...[0.3, 0.6, 0.9].map((d) => ({ t: BLOW + (TX - 20) / SPEED + d, stop: 0.02, flash: 0, push: 1, straw: 8 })),
    { t: meta.duration - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: BLOW, x: 8, n: 8, dir: -1 }],
};

const [MX, MY] = [MOUTH[0] + 3, MOUTH[1] + 1];
// the sheet's top edge at distance d from the mouth: low near him, towering far out
const topAt = (d, t) => MY - 4 - d * 0.42 - 10 * noise2(d * 0.05, t * 2, 3);

export const create = play([], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), blazes = new Blazes(ps), lights = new Lights();
  let lit = false;
  return {
    update(t, dt) {
      const front = (t - BLOW) * SPEED;
      if (t > BLOW && t < HOLDF) {
        // smoke and sparks thrown off the top of the wall
        for (let i = 0; i < 3; i++) if (R.chance(30 * dt)) {
          const d = R.range(10, Math.min(front, FAR)), y = topAt(d, t);
          ps.spawn(P.FIRE, MX + d, y + 4, R.range(-10, 30), -R.range(20, 50), R.range(0.3, 0.6), 0, R.range(2, 4), 0, R.chance(0.5) ? PF.SMOKES : 0);
        }
        if (R.chance(8 * dt)) lights.add(MX + Math.min(front, FAR) * 0.6, -40, 140, C[5], 0.6, 0.12);
      }
      if (!lit && t >= DIE) {
        lit = true;
        for (let i = 0; i < 9; i++) blazes.add(30 + i * 30 + R.range(-6, 6), 0, R.range(1.6, 2.8), R.range(0.9, 1.3));
      }
      blazes.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(2));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "madara", t0: 0.05, t1: SEALS.end, label: "EIEN MANGEKYOU", head: b.head });
      drawGlint(p, t, "madara", SEALS.end + 0.05, meta.duration - 0.5, b.head);
      if (t > BLOW && t < DIE + 0.4) {
        const front = Math.min(FAR, (t - BLOW) * SPEED), die = smooth(HOLDF, DIE + 0.4, t), back = 0;
        p.glow(MX + front * 0.5, -40, front * 0.6 + 30, C[5], 0.5 * (1 - die));
        p.shade(MX + back, -150, MX + front + 6, 0, (x, y, out) => {
          const d = x - MX;
          if (d < back || d > front + 14 * noise2(y * 0.08, t * 6, 2) - 7) return;
          const top = topAt(d, t) * (1 - die) + die * die * 20 * noise2(d * 0.08, t * 3, 9), bot = d < 30 ? MY + 4 + d * 0.9 : 0;
          if (die > 0 && noise2(d * 0.06, y * 0.06 - t * 2, 5) < die * 0.9) return;
          if (y < top || y > bot) return;
          // churning: noise rising up the sheet; hotter near the mouth and low down, licking dark at the top edge
          const n = noise2(d * 0.07 - t * 3, y * 0.09 + t * 5, 7), h = (y - top) / Math.max(1, bot - top), heat = n * 0.6 + h * 0.4 + (d < 40 ? 0.3 : 0) - die * 0.3;
          out.k = 0.25;
          if (y - top < 2 + 3 * n) return n > 0.5 ? C[3] : C[2];
          return heat > 0.85 ? C[7] : heat > 0.7 ? C[6] : heat > 0.55 ? C[5] : heat > 0.4 ? C[4] : C[3];
        });
        // the mouth: white hot where it leaves him
        if (t < HOLDF) {
          p.circle(MX + 1, MY, 3, C[7]);
          p.px(MX + 1, MY, WHITE);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
