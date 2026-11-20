// Katon: Gouka Mekkyaku (Great Fire Destruction, Madara). Narutopedia: seals Rat, Ox, Dog, Horse, Monkey, Boar, Tiger;
// chakra kneaded in the body turned to fire and let out of the mouth as a massive stream that sets a vast area ablaze,
// a veritable sea of flame. Here: his eternal Mangekyou, the seven seals, a deep breath, and a torrent of fire rolls out
// of his mouth: billow after billow of flame, small and white hot at his lips, swelling into a towering wall as it rolls
// past the target and piles up; then the whole sea of fire goes off at once: impact frames, a blast that throws every
// billow outward, the target hurled away, and fires left burning over the floor.
// New: the billows (shaded fire puffs, lit from above, hot at the core, a dark smoky rim, each cooling as it ages), the
// jet at his mouth, the detonation of the wall (every billow thrown out from the blast), impact frames (_lib).
// From the library: the ground blast for the blast itself, blazes left burning.
import { Particles, Blazes, Lights, P, PF, Rng, READY, fit, clamp, smooth, ease, hex, noise2, rand, WHITE, TAU } from "../../core/index.js";
import * as boom from "../explosions/small-explosion.js";
import { play, sealRun, drawSeals, bodyAt, MOUTH, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["ne", "ushi", "inu", "uma", "saru", "i", "tora"], 0.09, { hold: 0.25, kind: "fire", last: { fx: 8, fy: -30, bx: 9, by: -30 } });
const BREATH = SEALS.end, BLOW = BREATH + 0.3, POUR = 1.5, STOP = BLOW + POUR, BOOM = STOP + 0.25, TX = 170, END = BOOM + 5.5;
const FIRE_HEX = ["#1e0806", "#5a140a", "#a8200f", "#e8461a", "#ff8a2a", "#ffc23d", "#ffe680", "#fff8d8"], FIRE = FIRE_HEX.map(hex);

export const meta = {
  name: "Great fire destruction",
  desc: "Madara: his eternal Mangekyou, seven seals, a breath, and billow after billow of fire rolls out of his mouth into a towering wall past the target; then the whole sea of flame goes off at once and blasts everything away.",
  tags: ["jutsu", "madara", "fire", "katon", "mangekyou", "aoe", "explosion", "one-shot"],
  size: [430, 286],
  origin: [48, 238],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: FIRE_HEX, seed: 44 },
};

const INHALE = { ...READY, crouch: 3, lean: -10, fx: 8, fy: -30, bx: 9, by: -30, armsFront: true, ffx: 8, fbx: -8 };
const BLOWP = { ...READY, crouch: 7, lean: 9, fx: 11, fy: -29, bx: -6, by: -24, ffx: 12, fbx: -11 };
const BRACE = { ...READY, crouch: 9, lean: -6, fx: 12, fy: -30, bx: 4, by: -32, armsFront: true, ffx: 12, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BLOW - 0.05, INHALE, "out"],
    [BLOW, BLOWP, "snap"],
    [STOP, { ...BLOWP, lean: 11, crouch: 8 }],
    [BOOM, BRACE, "out"],
    [BOOM + 0.8, BRACE],
    [END - 0.8, { ...READY, crouch: 4 }],
    [END, READY],
  ],
  hits: [
    { t: BLOW + 0.42, stop: 0.08, shake: 0.35, amp: 3, push: 2, straw: 20, skin: "char" },
    ...[0.3, 0.6, 0.9].map((d) => ({ t: BLOW + 0.42 + d, stop: 0.02, flash: 0, push: 0.8, straw: 8 })),
    { t: BOOM, stop: 0.06, shake: 1.0, amp: 7, push: 7, straw: 60, flash: 0 },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: BLOW, x: 8, n: 8, dir: -1 }, { t: BOOM, x: 6, n: 12, dir: -1 }],
};

const [MX, MY] = [MOUTH[0] + 3, MOUTH[1] + 1];
// the billows: one every 1/40 s while he pours; each rolls out and slows to a stop somewhere past the target,
// swelling as it goes, so the stream is a cone from his lips to a towering wall
const BILLOWS = Array.from({ length: Math.floor(POUR * 40) }, (_, i) => {
  const far = 200 + rand(i, 1) * 130;
  return { b: BLOW + i / 40, far, k: (330 + rand(i, 2) * 80) / far, rmax: 32 + rand(i, 3) * 30, h: rand(i, 4), seed: i };
});
const BLAST = [TX + 10, -50];

// one billow of fire: hot white-yellow at its lit core, through orange, to a dark smoky rim; heat 0..1 cools it
function billow(p, x, y, r, heat, t, seed) {
  if (r < 1.5) return;
  p.shade(x - r - 2, y - r - 2, x + r + 2, y + r + 2, (px, py, out) => {
    const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const rr = r * (0.9 + 0.14 * noise2(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + t * 1.5, 3));
    if (d > rr) return;
    const n = noise2(px * 0.08 + seed, py * 0.08 - t * 3, 7);
    const v = heat * (0.72 + 0.55 * (1 - d / rr)) + ((-dx * 0.4 - dy * 0.9) / r) * 0.22 + n * 0.14;
    if (d > rr - 1.3) return heat > 0.6 ? FIRE[3] : FIRE[2];
    out.k = v > 0.75 ? 0.25 : 0;
    return v > 1.05 ? FIRE[7] : v > 0.9 ? FIRE[6] : v > 0.75 ? FIRE[5] : v > 0.6 ? FIRE[4] : v > 0.45 ? FIRE[3] : v > 0.3 ? FIRE[2] : FIRE[1];
  });
}

export const create = play([{ fx: boom, t: BOOM, x: BLAST[0], y: 0, light: 0.8 }], (o) => {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), blazes = new Blazes(ps), lights = new Lights();
  let lit = false, blown = false;
  // where billow q is at time t, how big, how hot (null once it's gone)
  const state = (q, t) => {
    const age = t - q.b;
    if (age < 0) return null;
    const d = q.far * (1 - Math.exp(-q.k * age)), u = d / q.far;
    let r = 4 + q.rmax * Math.pow(u, 0.8);
    let x = MX + d, y = MY + (-r * 0.7 - q.h * 34 * u - age * 10 - MY) * smooth(0, 50, d), heat = clamp(1.1 - age * 0.25 - u * 0.1, 0.4, 1.1);
    if (t >= BOOM) {
      // the detonation: every billow flares, swells and is thrown out from the blast, burning out as it flies
      const a = t - BOOM, dx = x - BLAST[0], dy = y - BLAST[1], n = Math.hypot(dx, dy) || 1, push = 160 * (1 - Math.exp(-a * 5)) * (0.6 + q.h);
      // thrown sideways and up, never into the floor
      x += (dx / n) * push;
      y += Math.min(-0.3, dy / n) * push * 0.7 - a * 50;
      r *= (1 + 0.25 * ease.outCubic(clamp(a / 0.15))) * (1 - smooth(0.1, 0.42, a));
      heat = a < 0.1 ? 1.1 : clamp(1.1 - (a - 0.1) * 2.2, 0.2, 1.1);
      if (r < 1.5) return null;
    }
    return { x, y, r, heat };
  };
  return {
    update(t, dt) {
      if (t > BLOW && t < BOOM) {
        // smoke and embers thrown off the top of the wall
        for (let i = 0; i < 3; i++) if (R.chance(25 * dt)) {
          const q = BILLOWS[R.int(0, BILLOWS.length - 1)], s = state(q, t);
          if (s) ps.spawn(P.FIRE, s.x, s.y - s.r * 0.8, R.range(-10, 30), -R.range(30, 60), R.range(0.4, 0.8), 0, R.range(3, 5), 0, PF.SMOKES);
        }
        if (R.chance(10 * dt)) lights.add(MX + 120, -40, 160, C[5], 0.6, 0.12);
      }
      if (!blown && t >= BOOM) {
        blown = true;
        lights.add(BLAST[0], BLAST[1], 220, C[6], 1, 0.4);
        // each billow leaves a burning puff of smoke where it was blown apart
        for (const q of BILLOWS) {
          const s = state(q, t);
          if (s && R.chance(0.5)) ps.spawn(P.FIRE, s.x, s.y, (s.x - BLAST[0]) * 1.2, -R.range(30, 90), R.range(0.6, 1.2), 0, R.range(4, 7), 0, PF.SMOKES);
        }
        for (let j = 0; j < 50; j++) {
          const a = R.range(-Math.PI, 0), s = R.range(100, 320);
          ps.spawn(P.SPARK, BLAST[0], BLAST[1] + 20, Math.cos(a) * s, Math.sin(a) * s, R.range(0.3, 0.8), j % 2 ? C[6] : WHITE);
        }
        for (let j = 0; j < 40; j++) {
          const dir = R.chance(0.7) ? 1 : -1;
          ps.spawn(P.DUST, BLAST[0] + dir * R.range(10, 60), -R.range(1, 10), dir * R.range(140, 360), -R.range(4, 40), R.range(0.6, 1.2), hex("#6a5a58"), R.range(3, 6), 0, 0);
        }
      }
      if (!lit && t >= BOOM + 0.3) {
        lit = true;
        for (let i = 0; i < 10; i++) blazes.add(30 + i * 30 + R.range(-6, 6), 0, R.range(1.8, 3), R.range(0.9, 1.3));
      }
      blazes.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      // the scorched floor under the sea of fire
      if (t > BLOW + 0.3) p.ellipse(MX + 150, 0.5, 150 * smooth(BLOW, STOP, t), 2.5, hex("#120808"), 0.8 * (1 - smooth(END - 0.8, END - 0.1, t)));
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(2));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "madara", t0: 0.05, t1: SEALS.end, label: "EIEN MANGEKYOU", head: b.head });
      drawGlint(p, t, "madara", SEALS.end + 0.05, END - 0.5, b.head);
      // the inhale: embers drawn into his mouth
      if (t > BREATH && t < BLOW) {
        const u = smooth(BREATH, BLOW, t);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + t * 4, d = 16 * (1 - u) + 3;
          p.px(MX + Math.cos(a) * d, MY + Math.sin(a) * d, C[5]);
        }
      }
      if (t > BLOW && t < BOOM + 0.8) {
        const glow = t < BOOM ? smooth(BLOW, BLOW + 0.5, t) : 1 - smooth(BOOM, BOOM + 0.8, t);
        p.glow(MX + 150, -60, 180, C[5], 0.45 * glow);
        // far billows first, so the young ones at his mouth sit on top
        const list = [];
        for (const q of BILLOWS) {
          const s = state(q, t);
          if (s) list.push(s);
        }
        list.sort((a, b) => b.x - a.x);
        for (const s of list) billow(p, s.x, s.y, s.r, s.heat, t, s.x * 0.01);
        // the jet at his lips: a white-hot cone feeding the first billows
        if (t < STOP) {
          const k = 1 - smooth(STOP - 0.15, STOP, t);
          for (let i = 0; i < 28; i++) {
            const w = 1 + i * 0.25 + Math.sin(i * 0.9 - t * 40) * 0.6;
            p.line(MX + i, MY - w, MX + i, MY + w, i < 10 ? C[7] : C[6], k);
          }
          p.circle(MX + 1, MY, 3, WHITE, k);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
      // impact frames as it all goes off
      if (t >= BOOM && t < BOOM + 0.14) impactFrame(p, -meta.origin[0], -meta.origin[1], meta.size[0] - meta.origin[0], meta.size[1] - meta.origin[1], BLAST[0], BLAST[1] + 20, t >= BOOM + 0.07, 9);
    },
  };
});
