// Hiraishin: Rasengan (Minato, the Yellow Flash). Narutopedia: he marks the field with his three-pronged kunai, each
// grip wrapped in the space-time formula, and moves to any mark in no time at all; the Rasengan is his own creation.
// Here: one snap of the wrist throws three marked kunai (one past the target into the floor behind it, one into its
// crossbar, one short); a Rasengan spins up in his open hand; a yellow flash and he is gone, a streak of light to the
// kunai behind the target, where he is already lunging, and drives the Rasengan into its back; it grinds, tearing the
// floor in a spiral, and bursts; a second flash and he is back where he started, catching the kunai as it returns.
// New: the marked kunai and their formula, the yellow flash and its streak, the back-strike, the grind.
// From _lib: the Rasengan, the poof; the library's crit hit.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, bodyAt, drawRasengan, arcPath } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 150, THROW = 0.42, LANDK = 0.66, FORM = 0.78, FORMED = 1.3, FLASH1 = 1.42, ARRIVE = 1.47, HIT = 1.56, BURST = 1.98, FLASH2 = 2.42, BACK = 2.47, END = 3.4;
const BL = ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff"];
const YEL = ["#3a2a06", "#a8780e", "#ffc81e", "#ffe874", "#fffbe0"].map(hex);
const STEEL = { a: hex("#e8edf6"), d: hex("#68748f"), g: hex("#2a2230"), tag: hex("#f3ecd2"), ink: hex("#1a1420") };
// where the kunai end up: behind the target, in its crossbar, short of it
const K = [{ x: TX + 30, y: -1, a: -1.2 }, { x: TX + 2, y: -30, a: 0.15 }, { x: TX - 26, y: -1, a: -1.0 }];
const BEHIND = TX + 27;

export const meta = {
  name: "Flying thunder god: Rasengan",
  desc: "Minato: three marked kunai thrown past, round and short of the target; a Rasengan spins up in his hand; a yellow flash and he is at the kunai behind it, drives the Rasengan into its back to grind and burst, and flashes home again.",
  tags: ["jutsu", "minato", "hiraishin", "rasengan", "teleport", "melee", "one-shot"],
  size: [300, 170],
  origin: [56, 138],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: BL, seed: 41 },
};

const WIND = { ...READY, crouch: 4, lean: -5, fx: -14, fy: -30, bx: 9, by: -22, ffx: 8, fbx: -9 };
const TOSS = { ...READY, crouch: 5, lean: 10, fx: 22, fy: -27, bx: -6, by: -20, ffx: 11, fbx: -10 };
const HOLD = { ...READY, crouch: 5, lean: 3, fx: 15, fy: -22, bx: -4, by: -21, ffx: 9, fbx: -8 };
const LUNGE = { ...READY, face: -1, x: BEHIND, crouch: 7, lean: 13, fx: 20, fy: -24, bx: -8, by: -20, ffx: 12, fbx: -11, gait: false };
const DRIVE = { ...LUNGE, x: BEHIND - 5, lean: 15, fx: 22, crouch: 8 };
const CATCH = { ...READY, crouch: 3, fx: 12, fy: -30, bx: -3, by: -20, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  ghost: "#ffe874",
  poses: [
    [-0.25, READY],
    [THROW - 0.16, WIND, "out"],
    [THROW, TOSS, "snap"],
    [FORM, HOLD, "out"],
    [FLASH1, { ...HOLD, crouch: 7, lean: 6 }],
    [ARRIVE, { ...LUNGE, x: BEHIND + 4, lean: 6, fx: 14 }, "snap"],
    [HIT, DRIVE, "out"],
    [BURST, { ...DRIVE, crouch: 9, lean: 17 }],
    [BURST + 0.12, { ...LUNGE, x: BEHIND + 2, lean: -2, crouch: 4, fx: 12, fy: -26 }, "out"],
    [FLASH2 - 0.01, { ...LUNGE, x: BEHIND + 2, lean: 0, crouch: 3, fx: 10, fy: -26 }],
    [BACK, { ...CATCH, gait: false }, "snap"],
    [END, { ...READY, gait: false }],
  ],
  hits: [
    { t: THROW, target: false, sfx: "whoosh" },
    { t: LANDK, stop: 0.03, target: false, sfx: "step" },
    { t: FORM, target: false, sfx: "cast" },
    { t: FLASH1, stop: 0.05, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.14, shake: 0.35, amp: 3, push: -4, straw: 24, skin: "flash", sfx: "heavy" },
    { t: BURST, stop: 0.12, shake: 0.6, amp: 5, push: -8, straw: 50, skin: "shock", shiver: 0.5, sfx: "explosion" },
    { t: FLASH2, target: false, sfx: "whoosh" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: ARRIVE, x: BEHIND, n: 8, dir: 1 }, { t: BURST, x: TX + 4, n: 18, dir: 1 }, { t: BACK, x: 0, n: 6, dir: -1 }],
};
// gone between the flashes: out of the start for the instant of the first, out of the strike for the second
export const actorAlpha = (t) => (t >= FLASH1 && t < ARRIVE) || (t >= FLASH2 && t < BACK) ? 0 : 1;
// the Rasengan in its back throws the target forward, off its post, and lets it fall back
export const targetState = (t) => {
  if (t < HIT) return null;
  const g = smooth(HIT, BURST, t), fl = clamp((t - BURST) / 0.5), back = smooth(BURST + 0.5, BURST + 1.2, t);
  return { dx: -4 * g - 20 * ease.outCubic(fl) * (1 - back), dy: -16 * Math.sin(Math.PI * fl) * (1 - back), rot: (-0.15 * g - 0.9 * Math.sin(Math.PI * fl)) * (1 - back) };
};

// the three-pronged kunai: blade toward (cos a, sin a), the formula tag fluttering off the ring
function kunai(p, x, y, a, f, k = 1) {
  const c = Math.cos(a), s = Math.sin(a), at = (i, j) => [x + c * i - s * j, y + s * i + c * j];
  const tip = at(7, 0), l = at(1.5, -1.6), r = at(1.5, 1.6), pl = at(2, -3.4), pr = at(2, 3.4);
  p.poly([tip, l, r], STEEL.a, k);
  p.line(...at(2.4, -1), ...pl, STEEL.d, k);
  p.line(...at(2.4, 1), ...pr, STEEL.d, k);
  p.beam(...at(1, 0), ...at(-3.5, 0), 1.4, STEEL.g, k);
  p.ring(...at(-4.8, 0), 1.1, 1, STEEL.a, k);
  const w = Math.sin(f * 1.3) * 1.5, t1 = at(-1, 1.5 + w), t2 = at(-1.5, 4.5 + w * 1.6);
  p.line(...at(-1, 0.6), ...t1, STEEL.tag, k);
  p.line(...t1, ...t2, STEEL.tag, k);
  p.px(t1[0], t1[1], STEEL.ink);
}
// the yellow flash: a burst of light at a spot, a ring snapping out, motes
function flash(p, x, y, age) {
  if (age < 0 || age > 0.35) return;
  const u = age / 0.35;
  p.glow(x, y, 40 * (1 - u) + 10, YEL[2], 0.9 * (1 - u));
  if (u < 0.25) p.ellipse(x, y, 5 + 4 * u, 22 * (1 - u), WHITE);
  p.ring(x, y, 4 + 26 * ease.outCubic(u), 1, u < 0.3 ? WHITE : YEL[3], 1 - u);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + rand(i, 2), d = 6 + 30 * ease.outCubic(u) * (0.5 + rand(i, 3));
    p.px(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, i % 2 ? WHITE : YEL[3]);
  }
}

export const create = play([{ fx: crit, t: BURST, x: TX - 2, height: 24, aim: -0.05, palette: ["#0b2a5a", "#1f5fb8", "#3f9be8", "#8fd0ff", "#d8f2ff", "#ffffff", "#ffffff"] }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const flights = K.map((k, i) => arcPath(14, -28, k.x, k.y, 10 + i * 6));
  const fired = new Set();
  const once = (key, fn) => { if (!fired.has(key)) { fired.add(key); fn(); } };
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      if (t >= FLASH1) once("f1", () => lights.add(b.head[0], -24, 120, YEL[2], 1, 0.25));
      if (t >= ARRIVE) once("a1", () => lights.add(BEHIND, -24, 120, YEL[2], 1, 0.25));
      // the grind: the floor torn up and flung round in a spiral, sparks of chakra
      if (t > HIT && t < BURST) for (let n = 0; n < 3; n++) if (R.chance(90 * dt)) {
        const a = R.range(0, TAU);
        ps.spawn(P.STREAK, TX + 2 + Math.cos(a) * 10, -24 + Math.sin(a) * 10, -Math.sin(a) * 160 - 40, Math.cos(a) * 160, R.range(0.1, 0.22), R.chance(0.5) ? WHITE : C[3]);
        if (R.chance(0.4)) ps.spawn(P.GRIT, TX + R.range(-8, 8), -1, -R.range(20, 120), -R.range(40, 140), R.range(0.3, 0.6), hex(["#3a3048", "#5a4c66"][R.int(0, 1)]));
      }
      if (t >= BURST) once("b", () => {
        lights.add(TX, -24, 200, C[3], 1, 0.6);
        for (let i = 0; i < 26; i++) {
          const a = R.range(0, TAU), s = R.range(120, 320);
          ps.spawn(P.STREAK, TX, -24, Math.cos(a) * s, Math.sin(a) * s * 0.7, R.range(0.12, 0.3), R.chance(0.5) ? WHITE : C[3]);
        }
      });
      if (t >= FLASH2) once("f2", () => lights.add(BEHIND, -24, 110, YEL[2], 1, 0.25));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the spiral scar the grind cuts into the floor
      if (t > HIT) {
        const k = 1 - smooth(BURST + 0.8, END, t), g = smooth(HIT, BURST, t);
        for (let i = 0; i < 40 * g; i++) { const a = i * 0.45, r = 2 + i * 0.6; p.px(TX + 2 + Math.cos(a) * r, -0.5 + Math.sin(a) * r * 0.12, hex("#120c18"), k); }
        p.ellipse(TX + 2, 0, 26 * g, 1.6, C[2], 0.4 * k * (1 - smooth(BURST, BURST + 0.4, t)));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "hiraishin", t0: 0.04, t1: THROW - 0.04, label: "HIRAISHIN", head: b.head });
      // the kunai: thrown in arcs, spinning; then stuck where they landed, quivering, their tags stirring
      K.forEach((k, i) => {
        const gone = t > BACK && i === 0 ? 1 : 0;
        if (t < THROW || t > END - 0.3) return;
        const u = clamp((t - THROW) / (LANDK - THROW - i * 0.04));
        if (u < 1) {
          const { x, y } = flights[i](u);
          kunai(p, x, y, t * 26 + i, f);
          p.line(x, y, x - 6, y + 1, YEL[3], 0.5);
        } else if (!gone) {
          const q = Math.exp(-(t - LANDK) * 9) * Math.sin((t - LANDK) * 60) * 0.12;
          kunai(p, k.x, k.y, k.a + q + (k.y < -2 ? Math.PI : 0), f + i);
          // the formula glowing on the grip when he is about to go to it
          if (i === 0 && t > FLASH1 - 0.15 && t < ARRIVE + 0.1) p.glow(k.x, k.y - 5, 10, YEL[2], 0.8);
        }
      });
      // the returning kunai in his hand, after the second flash
      if (t > BACK) kunai(p, b.handN[0], b.handN[1], -1.4 + Math.sin((t - BACK) * 20) * 0.3 * Math.exp(-(t - BACK) * 6), f);
      // the Rasengan: spun up in the open hand, held; driven into the back; burst
      const form = smooth(FORM, FORMED, t), [hx, hy] = b.handN;
      if (t > FORM && t < BURST + 0.05 && actorAlpha(t)) {
        const r = (3 + 7 * ease.outBack(form, 1.4)) * (t > HIT ? 1 + 0.25 * smooth(HIT, BURST, t) : 1);
        const x = t > HIT ? Math.min(hx, TX + 12) : hx, y = t > HIT ? -24 : hy - 2;
        drawRasengan(p, x - (t > ARRIVE ? 0 : 0), y, r, t, C, form);
        if (t < FORMED) for (let i = 0; i < 6; i++) { const a = t * 18 + i; p.arc(x, y, r + 6 - (t - FORM) * 6, 1, a, a + 0.7, C[3], 0.7); }
        // the grind: a spiral of wind and the target's straw whipping round it
        if (t > HIT) for (let i = 0; i < 3; i++) { const a = -t * 30 + i * 2.1; p.arc(x, y, r + 4 + i * 3, 1, a, a + 1.6, i ? C[3] : WHITE, 0.8); }
      }
      if (t >= BURST && t < BURST + 0.08) p.circle(TX + 2, -24, 18, WHITE);
      // the flashes, and the streaks between them: a line of light from where he was to where he is
      flash(p, 6, -22, t - FLASH1);
      flash(p, BEHIND, -22, t - ARRIVE + 0.02);
      flash(p, BEHIND, -22, t - FLASH2);
      flash(p, 2, -22, t - BACK + 0.02);
      const streak = (x0, x1, age) => {
        if (age < 0 || age > 0.22) return;
        const k = 1 - age / 0.22;
        p.glowLine(x0, -22, x1, -22, 10, YEL[2], 0.7 * k);
        p.beam(x0, -22, x1, -22, 3 * k + 1, YEL[3], k);
        p.line(x0, -22, x1, -22, WHITE, k);
        // the after-image of his figure stretched along it
        for (let i = 0; i < 5; i++) { const x = x0 + ((x1 - x0) * i) / 4; p.ellipse(x, -18, 3, 12, YEL[3], 0.25 * k); }
      };
      streak(6, BEHIND, t - FLASH1);
      streak(BEHIND, 2, t - FLASH2);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
