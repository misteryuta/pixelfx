// Susanoo: the arrow (Sasuke). Narutopedia: Sasuke's Susanoo (purple: demonic horns, a chin appendage, a malevolent
// grin) carries its bow on the wrist of its left arm; arrows are drawn from its right hand and loosed so fast that
// almost nothing can dodge them; in its armoured form they can be wreathed in black flame.
// Here: his eternal Mangekyou, the Susanoo forming round him (ribs, bones, muscle, the horned armour), the bow growing
// out of its left wrist as that whole arm comes up and points at the target; the right hand reaches forward to the
// bow, an arrow of purple fire forms under its fingers, and the arm draws it back along the line, elbow high, the
// torso leaning back into the pull; a beat of stillness, then the release: the drawing hand flies back, the bow arm
// kicks up, and the arrow hits the target in a violet explosion (impact frames, a fireball with depth, a shock ring,
// rubble, black flames left burning).
// New: the archer's arms on the rig (_susanoo.js), the bow and string and arrow on them, blast() from _lib.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame, blast, drawBlackFlame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, susanooPuppet, rigOf, keyTrack, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.32, FLESH = BONES + 0.38, ARMOUR = FLESH + 0.55, BOW = ARMOUR + 0.35;
const GRAB = BOW + 0.4, NOCKED = GRAB + 0.12, DRAWN = NOCKED + 0.45, LOOSE = DRAWN + 0.4, FLY = 0.13, HIT = LOOSE + FLY, GONE = HIT + 1.1, END = HIT + 3.0, TX = 236;
const V = SUSANOO.sasuke, BOOM = ["#08040e", "#1c1030", "#3c2070", "#6a3ab8", "#a070f0", "#d8c0ff", "#fff4ff"].map(hex);
const T = [TX - 4, -28];

// the body: lean, turn and head over time; raise lifts the bow arm onto the target; grab and pull work the right hand
const pose = keyTrack([
  [0, { lean: 0, twist: 0, head: 0, raise: 0, grab: 0, pull: 0, kick: 0 }],
  [BOW, { raise: 0 }],
  [GRAB, { raise: 1, lean: 0.05, twist: 0.2, head: 0.1, grab: 1 }],
  [NOCKED, { grab: 1, pull: 0 }],
  [DRAWN, { lean: -0.12, twist: -0.25, head: 0.16, pull: 1 }],
  [LOOSE, { lean: -0.13, twist: -0.27, pull: 1.02, kick: 0 }],
  [LOOSE + 0.08, { lean: -0.2, twist: -0.4, pull: 1.45, kick: 1 }],
  [LOOSE + 0.4, { lean: -0.08, twist: -0.15, pull: 1.25, kick: 0.2 }],
  [GONE, { lean: 0, twist: 0, raise: 0.6, grab: 0, pull: 0, kick: 0 }],
]);
const DRAW_LEN = 46;
// drawn the way an archer draws: the arrow runs from an anchor at the jaw to the target; the bow hand holds the grip
// out on that line, the draw hand comes back along it to the jaw, and the draw elbow lies back behind the hand, in line
// with the arrow, not cocked up. On the release the hand flies back past the jaw and the bow arm kicks.
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
let REST0 = null;
const rigAt = (t) => {
  const q = pose(t), R0 = rigOf(q), N = [R0.Hd[0] + 8, R0.Hd[1] + 14], aim = Math.atan2(T[1] - N[1], T[0] - N[0]), dx = Math.cos(aim), dy = Math.sin(aim);
  const Gaim = [N[0] + dx * (DRAW_LEN + 6), N[1] + dy * (DRAW_LEN + 6)], restF = [R0.far.S[0] + 12, R0.far.S[1] + 34];
  const G = lerp2(restF, Gaim, q.raise).map((v, i) => v - (i ? 12 * q.kick : 0));
  const restN = [R0.near.S[0] + 8, R0.near.S[1] + 30], p = q.pull;
  const drawn = p <= 1 ? [Gaim[0] - dx * (6 + DRAW_LEN * p), Gaim[1] - dy * (6 + DRAW_LEN * p)] : [N[0] - dx * (p - 1) * 22, N[1] - dy * (p - 1) * 22 + (p - 1) * 4];
  const H = lerp2(restN, drawn, q.grab);
  // the elbow: hanging naturally while the hand reaches; drawn, it lies back along the arrow behind the hand
  const R1 = rigOf({ ...q, farH: G, farBend: 0.3, nearH: H, nearBend: 1 }), d = clamp(p) * q.grab;
  const E = lerp2(R1.near.E, [H[0] - dx * 25, H[1] - dy * 25 + 1], d * d * (3 - 2 * d));
  const R = rigOf({ ...q, farH: G, farBend: 0.3, nearH: H, nearBend: 1, nearE: E });
  // the model: its far arm (screen right) holds the bow out on the target, its fist draws the string; the blade it
  // holds dissolves as the bow forms and comes back after
  const P = susanooPuppet(t, R, "sasuke", puppetOpts(t)), Hm = P.hand, ax = T[0] - Hm[0], ay = T[1] - Hm[1], an = Math.hypot(ax, ay) || 1;
  return { R, G: P.far, H: Hm, dx: ax / an, dy: ay / an, q, P };
};
const puppetOpts = (t) => ({ rest: REST0, gain: 0.9, pose: { sword: { a: 1 - smooth(BOW - 0.25, BOW, t) * (1 - smooth(GONE - 0.1, GONE + 0.2, t)) } } });
REST0 = rigOf(pose(0));
REST0.near.H = rigAt(0).R.near.H; REST0.far.H = rigAt(0).R.far.H;
const stageAt = (t) => ({
  ribs: smooth(RIBS, RIBS + 0.3, t) * (1 - smooth(GONE + 0.45, GONE + 0.7, t)),
  bones: smooth(BONES, BONES + 0.3, t) * (1 - smooth(GONE + 0.3, GONE + 0.55, t)),
  flesh: smooth(FLESH, FLESH + 0.5, t) * (1 - smooth(GONE + 0.05, GONE + 0.35, t)),
  armour: smooth(ARMOUR, ARMOUR + 0.4, t) * (1 - smooth(GONE - 0.2, GONE + 0.1, t)),
});

export const meta = {
  name: "Susanoo arrow",
  desc: "Sasuke: his eternal Mangekyou, the purple Susanoo forms ribs, bones, muscle, then the horned armour; its left arm raises the bow onto the target, the right draws a flaming arrow back elbow-high and looses it into an explosion of violet fire.",
  tags: ["jutsu", "sasuke", "susanoo", "mangekyou", "projectile", "aoe", "one-shot"],
  size: [404, 256],
  origin: [74, 206],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"], seed: 35 },
};

const STANDP = { ...READY, crouch: 4, fx: 12, fy: -24, bx: -4, by: -22, ffx: 9, fbx: -9 };
const AIMP = { ...READY, crouch: 5, lean: 2, fx: 16, fy: -28, bx: 2, by: -28, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, STANDP, "out"],
    [GRAB, { ...STANDP, crouch: 5 }],
    [DRAWN, AIMP, "out"],
    [LOOSE, { ...AIMP, bx: -2 }],
    [LOOSE + 0.05, { ...AIMP, bx: -6, lean: -2 }, "snap"],
    [GONE + 0.4, STANDP],
    [END, READY],
  ],
  hits: [
    { t: RIBS, stop: 0.06, shake: 0.15, amp: 1, target: false },
    { t: FLESH + 0.5, stop: 0.06, shake: 0.2, amp: 2, target: false },
    { t: LOOSE, stop: 0.04, shake: 0.1, amp: 1, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.2, shake: 0.6, amp: 5, push: 5, straw: 44, skin: "char", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RIBS, x: 0, n: 10 }, { t: HIT + 0.05, x: TX - 30, n: 16, dir: -1 }, { t: HIT + 0.05, x: TX + 30, n: 16, dir: 1 }],
};

// the bow on the left wrist: two limbs swept back from the grip, recurved at the tips; s how far it has grown
function bowOf(A, pull, s) {
  const { G, dx, dy } = A, px = -dy, py = dx, back = 10 + 9 * Math.min(1, pull);
  const tip = (side) => [G[0] + px * side * 40 * s - dx * back * s, G[1] + py * side * 40 * s - dy * back * s];
  const mid = (side) => [G[0] + px * side * 22 * s + dx * 5 * s, G[1] + py * side * 22 * s + dy * 5 * s];
  return { top: tip(-1), bot: tip(1), mt: mid(-1), mb: mid(1) };
}
function drawBow(p, t, A, k, s) {
  if (k <= 0 || s <= 0) return;
  const b = bowOf(A, A.q.pull, s), G = A.G;
  const limb = (m, e) => {
    let prev = G;
    for (let i = 1; i <= 10; i++) {
      const u = i / 10, v = 1 - u, x = v * v * G[0] + 2 * v * u * m[0] + u * u * e[0], y = v * v * G[1] + 2 * v * u * m[1] + u * u * e[1];
      p.beam(prev[0], prev[1], x, y, 3.5 - u * 1.5, V[2], k);
      p.line(prev[0], prev[1], x, y, V[4], k);
      // purple fire licking off it
      if (rand(i, Math.floor(t * 20)) > 0.6) p.line(x, y, x - A.dy * 2, y - 3 - rand(i, Math.floor(t * 24)) * 4, V[3], k * 0.8);
      prev = [x, y];
    }
  };
  limb(b.mt, b.top);
  limb(b.mb, b.bot);
  p.glow(G[0], G[1], 30, V[3], 0.4 * k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let loosed = false, hit = false;
  return {
    update(t, dt) {
      if (t > RIBS && t < GONE && R.chance(26 * dt)) ps.spawn(P.EMBER, R.range(-40, 40), -R.range(20, 110), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), V[R.int(2, 4)]);
      if (!loosed && t >= LOOSE) {
        loosed = true;
        const A = rigAt(t);
        lights.add(A.G[0], A.G[1], 80, V[3], 0.9, 0.15);
      }
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(T[0], -20, 160, BOOM[4], 1, 0.6);
        for (let i = 0; i < 30; i++) {
          const a = R.range(-Math.PI, 0), s = R.range(100, 300);
          ps.spawn(P.STREAK, T[0], -20, Math.cos(a) * s, Math.sin(a) * s, R.range(0.15, 0.35), R.chance(0.5) ? BOOM[6] : BOOM[4]);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const A = rigAt(t), st = stageAt(t);
      const bowK = smooth(BOW, BOW + 0.15, t) * (1 - smooth(GONE - 0.2, GONE + 0.1, t)), bowS = ease.outBack(clamp((t - BOW) / 0.3), 1.6);
      drawSusanoo(p, t, A.R, { kind: "sasuke", st, ...puppetOpts(t), mid: (pp) => drawBow(pp, t, A, bowK, bowS) });
      // the string: tip to the drawing fingers to tip while nocked, straight otherwise (twanging after the release)
      if (bowK > 0) {
        const b = bowOf(A, A.q.pull, bowS), H = A.H, nocked = t > NOCKED && t < LOOSE;
        if (nocked) {
          p.line(b.top[0], b.top[1], H[0], H[1], V[4], bowK);
          p.line(b.bot[0], b.bot[1], H[0], H[1], V[4], bowK);
        } else {
          const tw = t > LOOSE ? Math.sin((t - LOOSE) * 80) * 4 * Math.exp(-(t - LOOSE) * 8) : 0, mx = (b.top[0] + b.bot[0]) / 2 - A.dx * tw, my = (b.top[1] + b.bot[1]) / 2 - A.dy * tw;
          p.line(b.top[0], b.top[1], mx, my, V[4], bowK);
          p.line(mx, my, b.bot[0], b.bot[1], V[4], bowK);
        }
      }
      // the blast's far side and its smoke
      blast(p, t - HIT, { x: T[0], y: 0, R: 34, C: BOOM, seed: 5, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), A = rigAt(t), st = stageAt(t);
      drawSusanoo(p, t, A.R, { kind: "sasuke", st, layer: "front" });
      drawBadge(p, t, { kind: "sasukeEMS", t0: EYE, t1: OPEN, label: "EIEN MANGEKYOU", head: b.head });
      drawGlint(p, t, "sasukeEMS", OPEN + 0.05, END - 0.4, b.head);
      // the arrow: formed under the fingers at the bow, drawn back with the hand, loosed down the line
      if (t > GRAB - 0.05 && t < LOOSE) {
        const k = smooth(GRAB - 0.05, NOCKED, t), H = A.H, len = 62 * k;
        for (let i = 0; i < len; i++) {
          const wd = i > len - 9 ? (len - i) * 0.55 : 1.1 + Math.sin(i * 0.8 - t * 30) * 0.6, x = H[0] + A.dx * i, y = H[1] + A.dy * i;
          p.line(x + A.dy * wd, y - A.dx * wd, x - A.dy * wd, y + A.dx * wd, i > len - 9 ? WHITE : V[3]);
          if (rand(i, Math.floor(t * 24)) > 0.8) p.px(x - A.dx * 2, y - 3, V[4]);
        }
        p.glowLine(H[0], H[1], H[0] + A.dx * len, H[1] + A.dy * len, 14, V[3], 0.6 * k);
      }
      if (t >= LOOSE && t < HIT) {
        const A0 = rigAt(LOOSE - 0.001), H = A0.H, sx = H[0] + A0.dx * 62, sy = H[1] + A0.dy * 62, u = clamp((t - LOOSE) / FLY);
        const x = sx + (T[0] - sx) * u, y = sy + (T[1] - sy) * u, dx = (T[0] - sx), dy = (T[1] - sy), n = Math.hypot(dx, dy);
        p.glowLine(x - (dx / n) * 70, y - (dy / n) * 70, x, y, 18, V[3], 0.9);
        p.beam(x - (dx / n) * 56, y - (dy / n) * 56, x, y, 3.5, V[3]);
        p.line(x - (dx / n) * 56, y - (dy / n) * 56, x, y, WHITE);
      }
      // the impact: two impact frames, then the explosion, and black flames left burning on the ground
      const age = t - HIT;
      blast(p, age, { x: T[0], y: 0, R: 34, C: BOOM, seed: 5 });
      if (age >= 0 && age < 0.05) p.circle(T[0], -24, 36, WHITE);
      if (age > 0.35 && age < 2.6) {
        const k = smooth(0.35, 0.7, age) * (1 - smooth(2, 2.6, age));
        for (let i = 0; i < 5; i++) drawBlackFlame(p, T[0] - 40 + i * 20 + (rand(i, 3) - 0.5) * 8, 0, 4 + rand(i, 4) * 3, 10 + rand(i, 5) * 12, t, i * 3, k);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
