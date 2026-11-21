// Susanoo: the blade that cuts mountains (Madara). Narutopedia: Madara's Susanoo is blue; complete, it wields a pair of
// katana and its slashes cleave mountains in two. Here: his Mangekyou, the blue Susanoo forming round him in one surge
// (ribs, bones, muscle, armour almost at once, as only he does it), its hand at its hip drawing a long katana of blue
// chakra; it winds the blade up over its far shoulder and cuts across the whole world in one stroke: a crescent of
// blue light leaves the blade, through the target, on to the mountains on the horizon; a beat, and the tops of the
// mountains slide off along the cut and fall, dust rolling up where they land.
// New: the katana (straight, a ridge of light along it), the flying crescent, the cut mountains. From _susanoo.js the
// rig and its stages; from the library a crit hit.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import * as crit from "../impacts/crit-hit.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, rigOf, keyTrack, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.5, RIBS = OPEN + 0.04, BONES = RIBS + 0.16, FLESH = BONES + 0.18, ARMOUR = FLESH + 0.28, READYT = ARMOUR + 0.35;
const DRAW = READYT + 0.3, WIND = DRAW + 0.4, SWING = WIND + 0.08, HIT = SWING + 0.07, FOLLOW = HIT + 0.18, SETTLE = FOLLOW + 0.3;
const FALL = HIT + 0.75, REST = FALL + 0.9, GONE = REST + 0.5, END = GONE + 0.9, TX = 180;
const BLU = SUSANOO.madara, BL = ["#f4fbff", "#c8e8ff", "#7ab8ff", "#3a78e0"].map(hex);
const MTN = ["#120e1e", "#1c1730", "#2a2444", "#3a3358"].map(hex);
// the horizon: three peaks far behind the target, and the line the cut runs along across them
const PEAKS = [[250, -150, 56], [320, -128, 48], [190, -110, 40]];
const CUT_Y = (x) => -88 - (x - 180) * 0.12;

const GUARD = { lean: 0, twist: 0, head: 0, near: [1.4, 0.6], nearBend: 1, far: [1.0, 0.5], blade: 1.4 };
const keys = [
  [0, { ...GUARD }],
  [READYT, { ...GUARD }],
  // the hand to the hip and the long draw, the blade coming out level
  [DRAW, { near: [0.9, 0.72], blade: 0.2, twist: -0.15, lean: 0.04 }],
  // the wind-up: the blade up over the far shoulder, body turned away, leaning back
  [WIND, { lean: -0.22, twist: -0.7, head: 0.1, near: [-1.9, 0.82], nearBend: -1, blade: -2.7, far: [0.2, 0.6] }],
  [SWING, { lean: -0.05, twist: -0.2, near: [-1.0, 0.95], nearBend: -0.5, blade: -1.6, far: [0.6, 0.6] }],
  // the cut: level across the world, the torso whipped round, follow-through low
  [HIT, { lean: 0.28, twist: 0.6, head: 0.15, near: [0.05, 0.97], nearBend: 0.4, blade: -0.02, far: [1.2, 0.5] }],
  [FOLLOW, { lean: 0.34, twist: 0.85, near: [0.55, 0.9], nearBend: 1, blade: 0.2, far: [1.35, 0.45] }],
  [SETTLE, { lean: 0.15, twist: 0.4, near: [0.75, 0.8], blade: -0.15 }],
  [REST, { ...GUARD, near: [1.0, 0.7], blade: -0.4 }],
];
const pose = keyTrack(keys), rigAt = (t) => rigOf({ ...pose(t), y: -6 + Math.sin(t * 2.2) * 0.8 });
const BLADE = 112;
const stageAt = (t) => ({
  ribs: smooth(RIBS, RIBS + 0.15, t) * (1 - smooth(GONE + 0.3, GONE + 0.55, t)),
  bones: smooth(BONES, BONES + 0.15, t) * (1 - smooth(GONE + 0.15, GONE + 0.4, t)),
  flesh: smooth(FLESH, FLESH + 0.25, t) * (1 - smooth(GONE, GONE + 0.3, t)),
  armour: smooth(ARMOUR, ARMOUR + 0.3, t) * (1 - smooth(REST, GONE, t)),
});
const bladeLen = (t) => BLADE * (t < DRAW - 0.15 ? 0 : ease.outCubic(smooth(DRAW - 0.15, DRAW, t))) * (1 - ease.inCubic(smooth(REST - 0.2, REST + 0.2, t)));

export const meta = {
  name: "Susanoo: the blade that cuts mountains",
  desc: "Madara: his blue Susanoo surges up round him, draws a long katana of chakra and cuts across the world in one stroke; the crescent goes through the target and on to the horizon, and the tops of the mountains slide off and fall.",
  tags: ["jutsu", "madara", "susanoo", "mangekyou", "sword", "aoe", "one-shot"],
  size: [400, 260],
  origin: [90, 220],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a1636", "#1a3a8a", "#3a78e0", "#8ac0ff", "#e0f0ff"], seed: 77 },
};

const CALM = { ...READY, crouch: 2, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 7, fbx: -7 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [WIND, { ...CALM, crouch: 3, lean: -3, fx: -4, fy: -32, bx: -2, by: -22 }, "out"],
    [HIT, { ...CALM, crouch: 6, lean: 7, fx: 18, fy: -24 }, "in"],
    [SETTLE + 0.2, { ...CALM, crouch: 4, lean: 3, fx: 12, fy: -20 }],
    [END, CALM],
  ],
  hits: [
    { t: RIBS, stop: 0.05, shake: 0.2, amp: 2, target: false, sfx: "cast" },
    { t: ARMOUR + 0.2, stop: 0.04, shake: 0.2, amp: 1, target: false },
    { t: SWING - 0.04, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.2, shake: 0.5, amp: 4, push: 5, straw: 40, skin: "shock", sfx: "heavy" },
    { t: FALL, shake: 1.0, amp: 3, target: false, sfx: "rumble" },
    { t: FALL + 0.55, shake: 0.6, amp: 2, target: false, sfx: "explosion" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RIBS, x: 0, n: 12 }, { t: HIT, x: TX - 20, n: 16, dir: 1 }],
};

// the katana: a straight blade of blue light from the grip along angle a, with a guard and a bright ridge
function katana(p, H, a, L, k = 1) {
  if (L < 2) return;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  p.glowLine(H[0], H[1], H[0] + ux * L, H[1] + uy * L, 14, BL[2], 0.6 * k);
  for (let i = 4; i < L; i += 0.7) {
    const s = i / L, w = s > 0.92 ? 3 * (1 - s) / 0.08 : 3;
    for (let v = -w; v <= w; v += 0.7) if (H[1] + uy * i + ny * v < -0.5) p.px(H[0] + ux * i + nx * v, H[1] + uy * i + ny * v, v < -w * 0.4 ? BL[0] : v > w * 0.5 ? BL[3] : BL[1]);
  }
  p.beam(H[0] + nx * -5, H[1] + ny * -5, H[0] + nx * 5 + ux * 1, H[1] + ny * 5 + uy * 1, 2, BLU[1], k);
  p.beam(H[0] - ux * 8, H[1] - uy * 8, H[0], H[1], 2.5, BLU[0], k);
}

export const create = play([{ fx: crit, t: HIT + 0.02, x: TX - 8, height: 26, aim: 0, palette: ["#0a1636", "#1a3a8a", "#3a78e0", "#8ac0ff", "#e0f0ff", "#ffffff", "#ffffff"] }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // the tops of the mountains, once cut: they slide down along the cut and drop behind the horizon line
  const slide = (t, i) => {
    const u = clamp((t - FALL - i * 0.08) / 0.9);
    return { dx: 26 * ease.inQuad(u), dy: 70 * ease.inCubic(u), rot: 0.25 * ease.inQuad(u), u };
  };
  return {
    update(t, dt) {
      if (t > RIBS && t < GONE && R.chance(26 * dt)) ps.spawn(P.EMBER, R.range(-40, 40), -R.range(20, 110), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), BLU[R.int(2, 4)]);
      if (t >= HIT) once("hit", () => lights.add(TX, -30, 160, BL[2], 1, 0.35));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the mountains on the horizon: dark, far, lit faintly from the sky; cut along the line, their tops sliding off
      for (let i = 0; i < PEAKS.length; i++) {
        const [px, py, w] = PEAKS[i], s = t > FALL ? slide(t, i) : null;
        const base = -36, cy = CUT_Y(px);
        // the lower part stays: the mountain below the cut; the top is the triangle above it
        const W = w * 1.6, hc = W * clamp((cy - py) / (base - py)), lowCol = MTN[1 + (i % 2)];
        p.poly([[px - W, base], [px - hc, cy], [px + hc, cy], [px + W, base]], lowCol);
        p.poly([[px - W, base], [px - hc, cy], [px, cy], [px - W * 0.15, base]], MTN[3], 0.5);
        const top = [[px - hc, cy], [px, py], [px + hc, cy]];
        const off = s ? s : { dx: 0, dy: 0, rot: 0, u: 0 };
        const cxp = px, cyp = cy, cs = Math.cos(off.rot), sn = Math.sin(off.rot);
        const moved = top.map(([x, y]) => [cxp + (x - cxp) * cs - (y - cyp) * sn + off.dx, cyp + (x - cxp) * sn + (y - cyp) * cs + off.dy]);
        if (off.u < 1) p.poly(moved, MTN[2 + (i % 2)], 1 - smooth(0.7, 1, off.u));
        // snow on the peak
        if (off.u < 0.6) p.tri(moved[1][0], moved[1][1], moved[1][0] - 6, moved[1][1] + 8, moved[1][0] + 6, moved[1][1] + 8, hex("#5a5478"), 1 - off.u);
        // the cut glowing before it gives
        if (t > HIT + 0.1 && t < FALL + 0.3) p.line(top[0][0], cy, top[2][0], cy, BL[1], 0.8 * (1 - smooth(FALL, FALL + 0.3, t)));
        // dust where the top lands
        if (off.u > 0.85) {
          const a = t - FALL - i * 0.08 - 0.77;
          for (let j = 0; j < 6; j++) p.disc(px + 20 + (j - 3) * 10 + a * 20 * (j - 3) * 0.3, base - 4 - a * 30 - j % 2 * 6, 8 + a * 16, (d) => (d < 0.6 ? MTN[3] : MTN[2]), (d) => (1 - smooth(0.4, 1.4, a)) * (d < 0.85 ? 0.8 : 0.4));
        }
      }
      const Rg = rigAt(t), st = stageAt(t);
      drawSusanoo(p, t, Rg, { kind: "madara", st });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), Rg = rigAt(t), st = stageAt(t);
      drawSusanoo(p, t, Rg, { kind: "madara", st, layer: "front" });
      drawBadge(p, t, { kind: "madara", t0: EYE, t1: OPEN, label: "SUSANOO", head: b.head });
      drawGlint(p, t, "madara", OPEN + 0.05, END - 0.3, b.head);
      const L = bladeLen(t), H = Rg.near.H, a = pose(t).blade + Rg.lean;
      if (L > 1) {
        // the smear of the stroke, sampled from the swing
        if (t > SWING - 0.06 && t < FOLLOW + 0.06) {
          const fade = 1 - smooth(FOLLOW - 0.05, FOLLOW + 0.06, t), pts = [];
          for (let i = 0; i <= 12; i++) {
            const tt = t - i * 0.009, Rp = rigAt(tt), aa = pose(tt).blade + Rp.lean;
            pts.push([Rp.near.H[0] + Math.cos(aa) * L, Rp.near.H[1] + Math.sin(aa) * L, Rp.near.H[0] + Math.cos(aa) * L * 0.6, Rp.near.H[1] + Math.sin(aa) * L * 0.6]);
          }
          for (let i = 1; i < pts.length; i++) p.poly([[pts[i - 1][2], pts[i - 1][3]], [pts[i - 1][0], pts[i - 1][1]], [pts[i][0], pts[i][1]], [pts[i][2], pts[i][3]]], i < 3 ? BL[0] : BL[1], 0.5 * (1 - i / 13) * fade);
        }
        katana(p, H, a, L);
        p.circle(H[0], H[1], 6, BLU[2], smooth(0, 0.5, st.flesh));
      }
      // the crescent: leaves the blade level at the hit, flies through the target and on to the horizon, growing thin
      if (t > HIT - 0.02 && t < HIT + 0.7) {
        const u = clamp((t - HIT + 0.02) / 0.72), x = H[0] + 40 + u * 300, k = 1 - smooth(0.6, 1, u), cy = CUT_Y(x) * smooth(0, 0.5, u) - 28 * (1 - smooth(0, 0.5, u));
        p.glow(x, cy, 30, BL[2], 0.6 * k);
        for (let i = -18; i <= 18; i++) {
          const v = i / 18, xx = x - Math.abs(v) ** 1.6 * 14, yy = cy + v * 26 * (1 - 0.4 * u), w = (1 - Math.abs(v)) * 3 + 0.5;
          p.beam(xx - 4, yy, xx + w, yy, 1.6, Math.abs(v) < 0.4 ? WHITE : BL[1], k);
        }
        // the line it leaves through the air
        p.line(H[0] + 40, -28, x, cy, BL[2], 0.4 * k);
      }
      if (t >= HIT && t < HIT + 0.05) p.circle(TX, -28, 20, WHITE);
      // the world cut: a white line drawn right across the frame on the stroke
      if (t > HIT && t < HIT + 0.18) p.line(-90, -28, 310, CUT_Y(310), WHITE, 1 - (t - HIT) / 0.18);
      void rand; void noise2; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
