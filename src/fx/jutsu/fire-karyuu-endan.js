// Katon: Karyuu Endan (Fire Release: Dragon Flame Bullet). Narutopedia: the user breathes a stream of fire shaped like
// a dragon, which flies at the target and engulfs it. Here: Snake, Dragon, Hare, Tiger; the breath drawn deep, then a
// roaring stream that takes shape as it goes: a dragon's head leading, jaws open, horns streaming back, a long body of
// flame writhing behind it; it rears up over the target and comes down on it, coils round it once and goes up in a
// pillar of fire; embers fall.
// New: the dragon of flame (a body of puffs along a writhing path, a head with jaws and horns), the coil, the pillar.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH, blast } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["mi", "tatsu", "u", "tora"], 0.1, { hold: 0.15, kind: "fire", last: { fx: 9, fy: -28, bx: 10, by: -28 } });
const BREATH = SEALS.end, BLOW = BREATH + 0.3, REAR = BLOW + 0.55, BITE = REAR + 0.25, COIL = BITE + 0.35, END = COIL + 1.8, TX = 180;
const FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex);

export const meta = {
  name: "Fire release: dragon flame bullet",
  desc: "Snake, Dragon, Hare, Tiger; a roaring stream of fire takes the shape of a dragon, jaws open and horns streaming, rears up over the target, comes down on it, coils round it and goes up in a pillar of fire.",
  tags: ["jutsu", "fire", "katon", "dragon", "projectile", "aoe", "one-shot"],
  size: [320, 210],
  origin: [56, 178],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"], seed: 101 },
};

const INHALE = { ...READY, crouch: 3, lean: -8, fx: 6, fy: -30, bx: 6, by: -28, ffx: 8, fbx: -9 };
const BLOWP = { ...READY, crouch: 6, lean: 10, fx: 8, fy: -28, bx: 8, by: -26, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BLOW - 0.05, INHALE, "out"],
    [BLOW, BLOWP, "snap"],
    [COIL, { ...BLOWP, lean: 8 }],
    [COIL + 0.4, READY, "out"],
    [END, READY],
  ],
  hits: [
    { t: BLOW, stop: 0.05, shake: 0.2, amp: 1, target: false, sfx: "cast" },
    { t: BITE, stop: 0.12, shake: 0.4, amp: 3, push: 4, straw: 30, skin: "char", sfx: "heavy" },
    { t: COIL, stop: 0.16, shake: 0.7, amp: 5, push: 5, straw: 40, skin: "char", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: COIL, x: TX - 30, n: 14, dir: -1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the head's path: out of the mouth, up and over in an arc, rearing above the target, down onto it, round it
  const headAt = (t, m) => {
    if (t < REAR) { const u = ease.outQuad(clamp((t - BLOW) / (REAR - BLOW))); return [m[0] + (TX - 10 - m[0]) * u, m[1] - Math.sin(u * Math.PI * 0.8) * 60 - u * 30]; }
    if (t < BITE) { const u = ease.inQuad((t - REAR) / (BITE - REAR)); return [TX - 10 + 14 * u, -70 + 46 * u]; }
    const u = clamp((t - BITE) / (COIL - BITE)), a = -Math.PI / 2 + u * TAU; return [TX + Math.cos(a) * 18, -26 + Math.sin(a) * 18 * 0.6 - u * 20];
  };
  return {
    update(t, dt) {
      if (t >= COIL && !this.c) { this.c = 1; lights.add(TX, -40, 240, FIRE[4], 1, 0.6); }
      if (t > BLOW && t < COIL && R.chance(60 * dt)) { const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0], b.head[1] + 5], [hx, hy] = headAt(t, m); ps.spawn(P.EMBER, hx + R.range(-6, 6), hy + R.range(-6, 6), R.range(-40, 40), -R.range(20, 60), R.range(0.3, 0.6), FIRE[R.int(3, 5)]); }
      if (t > COIL && t < COIL + 1.4 && R.chance(30 * dt)) ps.spawn(P.EMBER, TX + R.range(-30, 30), -R.range(40, 100), R.range(-20, 20), R.range(10, 40), R.range(0.6, 1.2), FIRE[R.int(3, 5)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      blast(p, t - COIL, { x: TX, y: 0, R: 40, C: FIRE, seed: 9, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, FIRE);
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0], b.head[1] + 5];
      drawBadge(p, t, { kind: "uzumaki", t0: -9, t1: -8, head: b.head });
      if (t > BLOW && t < COIL + 0.1) {
        const k = 1 - smooth(COIL, COIL + 0.1, t);
        // the body: flame puffs along the path the head has taken over the last half second, writhing
        for (let i = 24; i >= 0; i--) {
          const tt = t - i * 0.025;
          if (tt < BLOW) continue;
          const [x, y] = headAt(tt, m), w = Math.sin(i * 0.6 - t * 14) * 3, r = (8 - i * 0.22) * (1 + 0.15 * Math.sin(t * 20 + i));
          p.glow(x, y + w, r * 2, FIRE[3], 0.25 * k);
          p.circle(x, y + w, r, FIRE[i < 4 ? 4 : i < 12 ? 3 : 2], k);
          p.circle(x - 1, y + w - 1, r * 0.5, FIRE[i < 8 ? 5 : 4], k);
          // the spines along its back
          if (i % 3 === 0 && i > 2) p.tri(x - 2, y + w - r, x + 2, y + w - r, x - 3, y + w - r - 5, FIRE[4], k);
        }
        // the head: a long snout, jaws open, horns streaming back, a bright eye
        const [hx, hy] = headAt(t, m), [px, py] = headAt(t - 0.03, m), a = Math.atan2(hy - py, hx - px), c = Math.cos(a), s = Math.sin(a), at = (u, v) => [hx + c * u - s * v, hy + s * u + c * v];
        const jaw = 0.5 + 0.5 * Math.sin(t * 16);
        p.poly([at(-6, -7), at(12, -4), at(16, -1), at(4, 1), at(-6, 4)], FIRE[3], k);
        p.poly([at(-4, 3), at(4, 2 + jaw * 3), at(14, 4 + jaw * 6), at(-2, 8)], FIRE[2], k);
        p.line(...at(-6, -7), ...at(-18, -14), FIRE[4], k);
        p.line(...at(-4, -6), ...at(-16, -16), FIRE[5], k);
        p.px(...at(4, -3), WHITE, k);
        p.glow(hx, hy, 24, FIRE[4], 0.5 * k);
      }
      blast(p, t - COIL, { x: TX, y: 0, R: 40, C: FIRE, seed: 9 });
      void noise2; void rand;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
