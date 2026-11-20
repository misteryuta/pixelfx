// Fuuton: Daitoppa (great breakthrough). Narutopedia: seals Tiger, Ox, Dog, Hare, Snake; a powerful pressure wave of
// wind is shot at the enemy (Orochimaru, Gaara with his sand). The wiki picture: a gale tearing along the ground,
// raising a wall of dust that sweeps everything with it. Breathed out of the mouth like the other Fuuton here.
// Built from: wind streaks and pressure bands drawn as translucent arcs, the toolkit's dust and grit kicked up by the
// front as it sweeps the floor, leaves torn along with it (nature/_lib), and a big push on the target.
import { Particles, Lights, P, PF, Rng, READY, fit, clamp, smooth, ease, mix, hex, WHITE, TAU } from "../../core/index.js";
import { drawLeaf } from "../nature/_lib.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["tora", "ushi", "inu", "u", "mi"], 0.12, { hold: 0.1, kind: "wind" });
const BREATH = SEALS.end, BLAST = BREATH + 0.42, GUST = 1.2, SPEED = 260, TX = 140;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
const HIT = BLAST + (TX - 10 - MX) / SPEED;
const WIND = ["#16302a", "#2f5e4e", "#5f9e86", "#a4d8c2", "#d8f4e8", "#ffffff"];
const DUST = ["#5e5048", "#7d6c60", "#a08c7a", "#c4b09a"].map(hex);
const LEAF = ["#1c3412", "#2f5a1c", "#4e8a2a", "#8cc04a"].map(hex);

export const meta = {
  name: "Great breakthrough",
  desc: "Fuuton: Tiger, Ox, Dog, Hare, Snake, a deep breath, and a gale blasted from the mouth that tears along the ground in a wall of dust and leaves and hurls the target back.",
  tags: ["jutsu", "wind", "fuuton", "gust", "move", "one-shot"],
  size: [362, 130],
  origin: [40, 110],
  duration: BLAST + GUST + 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: WIND, seed: 12 },
};

const INHALE = { ...READY, crouch: 2, lean: -7, fx: 6, fy: -25, bx: 9, by: -26, armsFront: true, ffx: 8, fbx: -8 };
const BLOW = { ...READY, crouch: 7, lean: 9, fx: 12, fy: -23, bx: -6, by: -20, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BREATH + 0.1, INHALE],
    [BLAST - 0.03, { ...INHALE, lean: -9 }],
    [BLAST, BLOW, "snap"],
    [BLAST + GUST, { ...BLOW, lean: 7, crouch: 8 }],
    [BLAST + GUST + 0.6, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.12, shake: 0.35, amp: 2, push: 5, straw: 40 },
    { t: HIT + 0.35, stop: 0, flash: 0, push: 3, straw: 16 },
    { t: HIT + 0.7, stop: 0, flash: 0, push: 2, straw: 10 },
  ],
  dust: [{ t: BLAST, x: 10, n: 8, dir: 1 }, { t: BLAST, x: -8, n: 4, dir: -1 }],
};

// the front of the gust: how far it has got, and how strong it is
const front = (t) => MX + Math.max(0, t - BLAST) * SPEED;
const power = (t) => smooth(BLAST, BLAST + 0.08, t) * (1 - smooth(BLAST + GUST - 0.3, BLAST + GUST + 0.3, t));

export const create = play([], (o) => {
  const C = fit(o.palette, 6), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
  const ps = new Particles({ rng: R, ground: floor }), leaves = [], streaks = [];
  return {
    update(t, dt) {
      const k = power(t), fx = Math.min(front(t), 260);
      if (t > BREATH && t < BLAST && R.chance(40 * dt)) {
        const a = R.range(-1.3, 1.3), d = R.range(10, 22), T = R.range(0.1, 0.16), v = (d * 3) / (Math.exp(3 * T) - 1);
        ps.spawn(P.STREAK, MX + 4 + Math.cos(a) * d, MY + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, C[4]);
      }
      if (k > 0.05) {
        // streaks of air racing out of the mouth, fanning wider the further they go
        for (let j = 0; j < Math.max(1, Math.round(90 * dt * k)); j++) streaks.push({ x: MX + R.range(0, 10), y0: MY + R.range(-2, 2), spread: R.range(-0.32, 0.38), v: R.range(300, 460), len: R.range(8, 22), age: 0, life: R.range(0.3, 0.6), c: R.int(2, 5) });
        // the front scours the floor: a rolling wall of dust and grit
        if (fx > MX + 20)
          for (let j = 0; j < Math.max(1, Math.round(70 * dt * k)); j++) {
            ps.spawn(P.SMOKE, fx - R.range(0, 30), -R.range(0, 6), R.range(120, 240), -R.range(10, 50), R.range(0.6, 1.1), DUST[R.int(0, 3)], R.range(5, 10), 0, PF.BIG);
            if (R.chance(0.5)) ps.spawn(P.GRIT, fx - R.range(0, 20), -1, R.range(80, 240), -R.range(30, 140), R.range(0.5, 1), DUST[R.int(1, 3)], 1);
          }
        if (R.chance(12 * dt * k)) leaves.push({ x: fx - R.range(0, 40), y: -R.range(0, 30), vx: R.range(160, 320), vy: -R.range(10, 80), a: R.range(0, TAU), va: R.range(-18, 18), life: R.range(0.6, 1.2) });
      }
      for (let j = streaks.length - 1; j >= 0; j--) if ((streaks[j].age += dt) > streaks[j].life) streaks.splice(j, 1);
      for (let j = leaves.length - 1; j >= 0; j--) {
        const l = leaves[j];
        l.vy += 60 * dt;
        l.x += l.vx * dt;
        l.y = Math.min(-1, l.y + l.vy * dt);
        l.a += l.va * dt;
        if ((l.life -= dt) <= 0) leaves.splice(j, 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(1));
      const k = power(t), fx = front(t);
      // pressure bands: wide pale arcs bulging forward, the blast's body
      if (k > 0.02)
        for (let i = 0; i < 4; i++) {
          const x = MX + ((t - BLAST) * SPEED * 0.85 - i * 34), r = 10 + (x - MX) * 0.35;
          if (x < MX + 6 || x > fx) continue;
          const cy = MY + (x - MX) * 0.12, lo = Math.min(0.75, Math.asin(clamp((-1 - cy) / r, -1, 1)));
          if (k * (1 - i * 0.18) > 0.35) p.arc(x - r, cy, r, 1, -0.75, lo, C[i % 2 ? 3 : 4]);
          // the body of the blast: soft translucent air pushed ahead of each band
          p.disc(x - 4, cy + 2, Math.min(8 + (x - MX) * 0.16, -cy - 3), C[3], (d) => 0.12 * k * (1 - d * d));
        }
      for (const s of streaks) {
        const d = (s.x - MX) + s.v * s.age, x = MX + d, y = s.y0 + d * s.spread * 0.45 + d * 0.1, kk = 1 - s.age / s.life;
        if (x > fx + 40) continue;
        p.line(x - s.len, y - s.len * s.spread * 0.45, x, y, kk > 0.5 ? WIND[s.c] : WIND[Math.max(1, s.c - 2)], kk);
      }
      for (const l of leaves) drawLeaf(p, l.x, l.y, 5, 2.2, l.a, l.a * 1.7, LEAF, Math.min(1, l.life / 0.3));
      ps.draw(p, "front");
      if (k > 0.05 && fx < 260) p.glow(fx, -14, 40, C[3], 0.15 * k);
      lights.draw(p);
    },
  };
});
