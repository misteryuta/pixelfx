// Susanoo: Totsuka no Tsurugi (Sword of Totsuka, Itachi). Narutopedia: the sword is wielded in the Susanoo's primary
// right hand and sheathed in a sake jar held by its second right hand; its ethereal blade seals whoever it pierces
// into the jar, in a "world of drunken dreams", forever. The Yata Mirror is in the primary left hand.
// Here (after the reference: ribs, then a skeleton with a toothy skull, then muscle grown over the bones, then the
// hooded, long-nosed armour): his Mangekyou, the Susanoo forming round him stage by stage, the jar in its lower right
// hand, the mirror on its left. The primary right hand reaches down to the jar's mouth and draws the blade out of it
// in a long pull, then the whole body winds up: it leans back and turns away, the sword arm swings up and over behind
// its head; it whips forward, torso turning in, the arm sweeping round the shoulder in one arc, the blade lagging then
// snapping through the target; follow-through, settle. The target is drawn along the blade into the jar and sealed.
// New: the rig (from _susanoo.js) driven by Hermite keys, so it moves with weight; the jar, the flaming blade with a
// motion smear sampled from the swing itself, the Yata Mirror, the seal (targetState).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, rigOf, keyTrack, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.32, FLESH = BONES + 0.38, ARMOUR = FLESH + 0.6, READYT = ARMOUR + 0.5;
const REACH = READYT + 0.25, DRAWN = REACH + 0.35, WIND = DRAWN + 0.45, SWING = WIND + 0.1, HIT = SWING + 0.08, FOLLOW = HIT + 0.16, SETTLE = FOLLOW + 0.25;
const SEALED = HIT + 1.2, REST = SEALED + 0.35, GONE = REST + 0.6, END = GONE + 1.1, TX = 170;
const RD = SUSANOO.itachi, BL = ["#fff8d8", "#ffeaa0", "#ffd060", "#ff9a30"].map(hex), JAR = ["#5a2410", "#9a4a1c", "#d8823a", "#ffc070"].map(hex);
const MIR = ["#4a0a0a", "#a01818", "#e03a2a", "#ff8a6a"].map(hex);

// the Susanoo's pose over time (arm angles from the torso: 0 toward the target, + down; blade: its angle from the torso)
const GUARD = { lean: 0, twist: 0, head: 0, near: [1.05, 0.62], nearBend: 1, far: [0.85, 0.45], low: [1.95, 0.58], blade: -0.9 };
const keys = [
  [0, { ...GUARD, near: [1.55, 0.55], blade: -1.2 }],
  [READYT, { ...GUARD, near: [1.5, 0.55] }],
  // down to the jar's mouth, then the long pull drawing the blade up out of it
  [REACH, { near: [1.85, 0.62], lean: 0.08, twist: -0.2, head: 0.2 }],
  [DRAWN, { near: [-0.2, 0.7], blade: -1.05, lean: 0, twist: 0, head: 0 }],
  // the wind-up: lean back, turn away, the sword arm up over and behind the head, the blade hanging back
  [WIND, { lean: -0.2, twist: -0.6, head: 0.12, near: [-1.7, 0.86], nearBend: -1, blade: -2.55, far: [0.25, 0.7] }],
  // the swing: the torso whips in and the arm goes round the shoulder, the blade lagging, then through
  [SWING, { lean: -0.02, twist: -0.1, near: [-1.1, 0.95], nearBend: -0.6, blade: -1.75, far: [0.6, 0.6] }],
  [HIT, { lean: 0.3, twist: 0.6, head: 0.18, near: [0.15, 0.96], nearBend: 0.4, blade: 0.1, far: [1.2, 0.5] }],
  [FOLLOW, { lean: 0.36, twist: 0.85, near: [0.6, 0.93], nearBend: 1, blade: 0.42, far: [1.35, 0.45] }],
  [SETTLE, { lean: 0.22, twist: 0.55, head: 0.1, near: [0.45, 0.85], blade: 0.22, far: [1.1, 0.45] }],
  [SEALED, { lean: 0.18, twist: 0.5, near: [0.4, 0.85], blade: 0.18 }],
  [REST, { ...GUARD }],
];
// the blade at the hit runs straight through the target: solve its angle from where the hand will be
const K0 = keyTrack(keys), H0 = rigOf(K0(HIT)), AIM = Math.atan2(-26 - H0.near.H[1], TX - H0.near.H[0]) - H0.lean;
keys[keys.findIndex((k) => k[0] === HIT)][1].blade = AIM;
// after the follow-through it settles back with the point run through the target while it is sealed
for (const T of [SETTLE, SEALED]) {
  const Rk = rigOf(keyTrack(keys)(T));
  keys[keys.findIndex((k) => k[0] === T)][1].blade = Math.atan2(-26 - Rk.near.H[1], TX - Rk.near.H[0]) - Rk.lean;
}
const pose = keyTrack(keys), BLADE = Math.hypot(TX - H0.near.H[0], -26 - H0.near.H[1]) + 24;
const rigAt = (t) => rigOf({ ...pose(t), y: -6 + Math.sin(t * 2.4) * 0.8 });

const stageAt = (t) => ({
  ribs: smooth(RIBS, RIBS + 0.3, t) * (1 - smooth(GONE + 0.35, GONE + 0.6, t)),
  bones: smooth(BONES, BONES + 0.3, t) * (1 - smooth(GONE + 0.2, GONE + 0.45, t)),
  flesh: smooth(FLESH, FLESH + 0.5, t) * (1 - smooth(GONE, GONE + 0.3, t)),
  armour: smooth(ARMOUR, ARMOUR + 0.45, t) * (1 - smooth(REST + 0.2, GONE, t)),
});
// how much blade is out of the jar
const bladeLen = (t) => BLADE * (t < REACH ? 0 : t < DRAWN ? ease.outCubic(smooth(REACH + 0.05, DRAWN, t)) : 1) * (1 - ease.inCubic(smooth(REST - 0.1, REST + 0.25, t)));

export const meta = {
  name: "Sword of Totsuka",
  desc: "Itachi: his red Susanoo forms ribs, bones, muscle, then the long-nosed hood; it draws the Totsuka blade out of the sake jar, winds up and swings it through the target in one full-body arc, sealing it into the jar; the Yata Mirror on its other arm.",
  tags: ["jutsu", "itachi", "susanoo", "mangekyou", "sword", "seal", "one-shot"],
  size: [330, 250],
  origin: [90, 208],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0806", "#8a1a10", "#d8461c", "#ff8a3a", "#ffd8a0"], seed: 39 },
};

const CALM = { ...READY, crouch: 2, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [WIND, { ...CALM, crouch: 3, lean: -3, fx: 2, fy: -30, bx: -4, by: -20 }, "out"],
    [HIT, { ...CALM, crouch: 6, lean: 6, fx: 16, fy: -22 }, "in"],
    [SETTLE + 0.2, { ...CALM, crouch: 4, lean: 3, fx: 12, fy: -20 }],
    [REST + 0.3, CALM],
    [END, CALM],
  ],
  hits: [
    { t: RIBS, stop: 0.06, shake: 0.15, amp: 1, target: false },
    { t: FLESH + 0.5, stop: 0.05, shake: 0.2, amp: 1, target: false },
    { t: HIT, stop: 0.18, shake: 0.4, amp: 4, push: 2.5, straw: 30, skin: "red", sfx: "heavy" },
    ...[0.35, 0.6, 0.85].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 0.4, straw: 6, shiver: 0.8, skin: "shadow" })),
    { t: END - 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RIBS, x: 0, n: 10 }, { t: HIT, x: 30, n: 14, dir: 1 }],
};

// the jar's mouth, in the second right hand
const jarAt = (R) => [R.low.H[0] + 1, R.low.H[1] - 9];
// the target, sealed: drawn along the blade toward the jar, spun and thinned to nothing; back at the end
export const targetState = (t) => {
  if (t < HIT + 0.3) return null;
  if (t < SEALED) {
    const u = ease.inCubic(smooth(HIT + 0.3, SEALED, t)), J = jarAt(rigAt(t));
    return { dx: (J[0] - TX) * u, dy: (J[1] + 26) * u, rot: 9 * u * u, s: 1 - 0.85 * u, a: 1 - smooth(0.7, 1, u), tint: [RD[3], 0.6 * u] };
  }
  return { a: smooth(END - 0.9, END - 0.45, t) };
};

// the Totsuka blade: a long tongue of pale flame from the grip along angle a, L long, its edges licking, k its strength
function blade(p, t, H, a, L, k = 1, ghost = 0) {
  if (L < 2) return;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  if (!ghost) p.glowLine(H[0], H[1], H[0] + ux * L, H[1] + uy * L, 16, BL[2], 0.7 * k);
  for (let i = 0; i < L; i += 0.7) {
    const s = i / L, w = (ghost ? 2.6 : 4.4) * (1 - s * 0.55) * (0.85 + 0.3 * noise2(i * 0.12, t * 6, 3));
    const wob = Math.sin(i * 0.18 - t * 12) * 1.2 * s, x = H[0] + ux * i + nx * wob, y = H[1] + uy * i + ny * wob;
    if (ghost) {
      p.dot(x, y, BL[1], ghost);
      continue;
    }
    for (let v = -w; v <= w; v += 0.7) {
      const e = Math.abs(v) / w;
      p.px(x + nx * v, y + ny * v, e > 0.8 ? BL[3] : e > 0.5 ? BL[2] : e > 0.2 ? BL[1] : BL[0]);
    }
    // flames licking off its edges
    if (noise2(i * 0.3, t * 9, 5) > 0.35) {
      const side = noise2(i * 0.2, t * 7, 9) > 0 ? 1 : -1, h = 2 + 4 * noise2(i * 0.5, t * 11, 4);
      p.line(x + nx * w * side, y + ny * w * side, x + nx * (w + h) * side - ux * 2, y + ny * (w + h) * side - uy * 2, BL[3]);
    }
  }
  // the point
  p.circle(H[0] + ux * L, H[1] + uy * L, 1.5, BL[0]);
}

function jar(p, R, k) {
  const [hx, hy] = R.low.H;
  // a gourd: a big round belly, a waist, a small top, the stopper's mouth
  p.circle(hx + 1, hy + 4, 7.5, JAR[0], k);
  p.circle(hx + 1, hy + 4, 6.5, JAR[1], k);
  p.circle(hx - 1, hy + 2, 3.5, JAR[2], k);
  p.circle(hx + 1, hy - 5, 4.5, JAR[0], k);
  p.circle(hx + 1, hy - 5, 3.6, JAR[1], k);
  p.circle(hx, hy - 6, 1.6, JAR[3], k);
  p.rect(hx - 1.5, hy - 1, 6, 1.5, JAR[0], k);
  p.rect(hx - 0.5, hy - 11, 3, 2.5, JAR[0], k);
}

// the Yata Mirror: a round shield of red chakra with a spiral, its rim flickering like flame
function mirror(p, t, R, k) {
  const [cx, cy] = [R.far.H[0] + 4, R.far.H[1] - 2];
  p.glow(cx, cy, 26, MIR[2], 0.45 * k);
  p.shade(cx - 20, cy - 22, cx + 20, cy + 22, (x, y, out) => {
    const dx = (x - cx) / 14, dy = (y - cy) / 17, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const rim = 1 + 0.12 * noise2(ang * 2, t * 6, 7);
    if (d > rim) return;
    out.a = k;
    if (d > rim - 0.12) return MIR[3];
    // the spiral: one arm winding in
    const sp = (ang / TAU + d * 1.6 + t * 0.2) % 1;
    if (Math.abs(sp - 0.5) < 0.08 && d > 0.12) return MIR[3];
    return d < 0.5 ? MIR[2] : MIR[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let struck = false;
  return {
    update(t, dt) {
      if (!struck && t >= HIT) {
        struck = true;
        lights.add(TX, -26, 80, BL[2], 1, 0.25);
        for (let i = 0; i < 22; i++) {
          const a = R.range(-1, 1) + 0.2, s = R.range(80, 220);
          ps.spawn(P.STREAK, TX, -26, Math.cos(a) * s, Math.sin(a) * s, R.range(0.12, 0.25), R.chance(0.5) ? BL[0] : BL[2]);
        }
      }
      // the target, sealed: streams of it pulled back along the blade into the jar
      if (t > HIT + 0.3 && t < SEALED && R.chance(70 * dt)) {
        const J = jarAt(rigAt(t)), T = R.range(0.25, 0.4), x0 = TX + R.range(-8, 8), y0 = -28 + R.range(-16, 16);
        ps.spawn(P.STREAK, x0, y0, (J[0] - x0) / T, (J[1] - y0) / T, T, R.chance(0.5) ? RD[4] : BL[1]);
      }
      if (t > RIBS && t < GONE && R.chance(26 * dt)) ps.spawn(P.EMBER, R.range(-40, 40), -R.range(20, 110), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), RD[R.int(2, 4)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const Rg = rigAt(t), st = stageAt(t), fadeAll = 0;
      drawSusanoo(p, t, Rg, { kind: "itachi", st, fade: fadeAll, mid: (pp) => st.armour > 0 && mirror(pp, t, Rg, smooth(0, 0.6, st.armour)) });
      // the jar, once there's flesh to hold it
      if (st.bones > 0.6) jar(p, Rg, Math.min(1, st.bones) * (1 - smooth(GONE, GONE + 0.3, t)));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), Rg = rigAt(t), st = stageAt(t);
      drawSusanoo(p, t, Rg, { kind: "itachi", st, layer: "front" });
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN + 0.05, END - 0.3, b.head);
      const L = bladeLen(t);
      if (L > 1) {
        // the smear: where the blade was over the last few hundredths of a second, sampled from the swing itself
        if (t > SWING - 0.08 && t < FOLLOW + 0.06) {
          const fade = 1 - smooth(FOLLOW - 0.05, FOLLOW + 0.06, t);
          const at = (tt) => {
            const Rp = rigAt(tt), a = pose(tt).blade + Rp.lean, H = Rp.near.H;
            return [H, [H[0] + Math.cos(a) * L, H[1] + Math.sin(a) * L], [H[0] + Math.cos(a) * L * 0.72, H[1] + Math.sin(a) * L * 0.72]];
          };
          for (let i = 5; i >= 1; i--) {
            const [, T1, M1] = at(t - i * 0.008), [, T0, M0] = at(t - (i - 1) * 0.008);
            p.poly([M1, T1, T0, M0], i < 2 ? BL[1] : BL[2], 0.55 * (1 - i / 6) * fade);
          }
          // the crescent of the tip's path
          const pts = [];
          for (let i = 0; i <= 10; i++) {
            const tt = t - i * 0.01, Rp = rigAt(tt), a = pose(tt).blade + Rp.lean;
            pts.push([Rp.near.H[0] + Math.cos(a) * L, Rp.near.H[1] + Math.sin(a) * L]);
          }
          for (let i = 1; i < pts.length; i++) {
            p.beam(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 4 * (1 - i / 11) * fade + 0.5, i < 3 ? WHITE : BL[1], fade);
          }
        }
        blade(p, t, Rg.near.H, pose(t).blade + Rg.lean, L, 1);
        // the hand closed round the grip
        p.circle(Rg.near.H[0], Rg.near.H[1], 6, RD[2], smooth(0, 0.5, st.flesh));
        p.circle(Rg.near.H[0] - 1, Rg.near.H[1] - 1, 3.5, RD[3], smooth(0, 0.5, st.flesh));
      }
      // the blade pulled out of the jar: the liquid stretching from its mouth up to the hand
      if (t > REACH && t < DRAWN + 0.1) {
        const J = jarAt(Rg), H = Rg.near.H, k = 1 - smooth(DRAWN - 0.05, DRAWN + 0.1, t);
        p.beam(J[0], J[1], H[0], H[1], 3, BL[1], k);
        p.line(J[0], J[1], H[0], H[1], BL[0], k);
      }
      // the hit: two impact frames, then the seal's spiral on the target
      if (t >= HIT && t < HIT + 0.06) p.circle(TX, -26, 22, WHITE);
      if (t > HIT + 0.2 && t < SEALED) {
        const u = clamp((t - HIT - 0.2) / (SEALED - HIT - 0.2));
        for (let i = 0; i < 3; i++) {
          const a0 = -t * 9 + (i * TAU) / 3;
          p.arc(TX, -28, 26 * (1 - u) + 4, 1, a0, a0 + 2, i ? BL[2] : BL[0], 1 - u * 0.5);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
