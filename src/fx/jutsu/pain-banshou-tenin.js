// Banshou Ten'in (Universal Pull, Pain / Deva Path). Narutopedia: the Deva Path's power of attraction pulls a target
// toward the user, and is often paired with the black chakra receivers (rods) the Paths carry: Pain yanks an opponent
// in and runs them through, and follows up with Shinra Tensei to throw them off again. Both share the short interval.
// Here: the Rinnegan; he draws a black chakra receiver from his sleeve and stretches his other hand toward the target,
// the words; the air between them bends into lines of force, the target is ripped off the ground and flies at him,
// faster and faster, dust and stones dragged along in its wake; he steps in and runs it through with the rod
// (a hard stop, a burst of sparks); it hangs on the rod, shivering, for a beat; then a small push from his palm blows
// it off the rod and away across the floor.
// The camera: medium on him; following the pull; in close on the stab; out as it is thrown off.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.05, OPEN = 0.55, ROD = OPEN + 0.1, REACH = OPEN + 0.3, PULL = REACH + 0.15, FLY = 0.5, STAB = PULL + FLY, BLAST = STAB + 0.6, OFF = 0.55;
const TX = 150, HOLD = 32, END = BLAST + OFF + 1.1;
const RG = ["#1a1430", "#3a2e66", "#7a68b8", "#c4b8f0", "#f4f0ff"].map(hex), ROD_C = ["#0c0a10", "#2a2830", "#5a5866", "#9a98a8"].map(hex), DIRT = ["#2a2026", "#4a3c40", "#7a6a64", "#a8968a"].map(hex);
// the target's path: yanked in (accelerating, lifted a little, tipping toward him), held on the rod, blown off
const pullU = (t) => ease.inCubic(clamp((t - PULL) / FLY));
const offU = (t) => ease.outCubic(clamp((t - BLAST) / OFF));
const tgt = (t) => {
  if (t < PULL) return { dx: 0, dy: 0, rot: 0 };
  if (t < STAB) { const u = pullU(t); return { dx: (HOLD - TX) * u, dy: -16 * Math.sin(Math.PI * Math.min(1, u * 1.1)) - 6 * u, rot: -0.55 * u }; }
  if (t < BLAST) { const s = Math.sin((t - STAB) * 70) * Math.exp(-(t - STAB) * 4); return { dx: HOLD - TX + s * 1.5, dy: -8, rot: -0.5 + s * 0.05 }; }
  const u = offU(t); return { dx: HOLD - TX + (TX - 30 - HOLD) * u, dy: -8 * (1 - u) - 20 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u), rot: -0.5 + 6.5 * u };
};

export const meta = {
  name: "Universal pull",
  desc: "Pain: the Rinnegan; a black chakra rod drawn from his sleeve, his hand stretched out, and the target is ripped off the ground and flies at him; he runs it through with the rod, holds it there shivering, then blows it off and away with a small push.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "pull", "combo", "one-shot"],
  size: [330, 200],
  origin: [70, 162],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a1430", "#3a2e66", "#7a68b8", "#c4b8f0", "#f4f0ff"], seed: 47 },
};

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17 };
const REACHP = { ...READY, crouch: 3, lean: 2, fx: 20, fy: -27, bx: -5, by: -16, ffx: 8, fbx: -8 };
const STABP = { ...READY, x: 4, crouch: 6, lean: 10, fx: 22, fy: -22, bx: 6, by: -30, ffx: 12, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM],
    [REACH, REACHP, "out"],
    [STAB - 0.12, { ...REACHP, lean: -3, crouch: 4, fx: 16 }],
    [STAB, STABP, "snap"],
    [BLAST - 0.05, { ...STABP, crouch: 5 }],
    [BLAST, { ...STABP, x: 2, lean: 2, fx: 24, fy: -28, bx: -6, by: -18 }, "snap"],
    [END, CALM, "in"],
  ],
  hits: [
    { t: ROD, target: false, sfx: "parry" },
    { t: PULL, stop: 0.06, target: false, sfx: "cast" },
    { t: STAB, stop: 0.2, shake: 0.5, amp: 4, push: 0, straw: 36, shiver: 1, skin: "shock", sfx: "heavy" },
    { t: BLAST, stop: 0.08, shake: 0.4, amp: 3, push: 0, straw: 24, sfx: "explosion" },
    { t: BLAST + OFF * 0.6, target: false, sfx: "land" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
export const targetState = (t) => (t < PULL ? null : tgt(t));

export const camera = cineCam([
  [0, { z: 1.5, x: 30, y: -36 }],
  [PULL, { z: 1.3, x: 70, y: -40, r: 1 }],
  [STAB - 0.03, { z: 1.5, x: 30, y: -36, r: -2 }],
  [STAB, { z: 2.3, x: 18, y: -32, r: 4, shake: 0.6 }, "cut"],
  [BLAST - 0.02, { z: 2.4, x: 18, y: -32, r: 4 }],
  [BLAST, { z: 1.25, x: 70, y: -44, r: -1, shake: 0.5 }, "cut"],
  [BLAST + OFF, { z: 1.2, x: 90, y: -44, r: 0 }],
  [END, { z: 1.05, x: 80, y: -50 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // the rod: in his far hand, a black receiver with barbs; levelled at the target, run forward on the stab
  const rodOf = (t, b) => {
    const H = b.handF, out = t < REACH ? smooth(ROD, REACH, t) : 1, thrust = t < STAB - 0.08 ? 0 : t < STAB ? smooth(STAB - 0.08, STAB, t) : 1;
    const a = t < REACH ? -1.2 + 1.15 * smooth(ROD, REACH, t) : -0.05, L = 30 * out;
    return { x: H[0] - 6 + thrust * 4, y: H[1], a, L };
  };
  return {
    update(t, dt) {
      const s = tgt(t), tx = TX + s.dx, ty = -26 + s.dy;
      // the pull: dust and stones dragged off the floor along its path; straw torn off and streaming after it
      if (t > PULL && t < STAB) {
        if (R.chance(80 * dt)) ps.spawn(P.DUST, tx + R.range(-6, 10), -1, -R.range(80, 200), -R.range(4, 20), R.range(0.3, 0.6), DIRT[2], R.range(2, 3.5), 0, 0);
        if (R.chance(50 * dt)) ps.spawn(P.GRIT, tx + R.range(0, 20), -2, -R.range(150, 280), -R.range(20, 80), R.range(0.3, 0.6), DIRT[1]);
        if (R.chance(50 * dt)) ps.spawn(P.SPARK, tx + R.range(2, 10), ty + R.range(-12, 12), R.range(30, 80), R.range(-20, 20), R.range(0.2, 0.4), hex(["#f0d98a", "#d2aa55"][R.int(0, 1)]));
      }
      if (t >= STAB) once("stab", () => { for (let i = 0; i < 26; i++) { const a = R.range(-0.8, 0.8); ps.spawn(P.SPARK, HOLD - 4, -26, Math.cos(a) * R.range(80, 220), Math.sin(a) * R.range(80, 220), R.range(0.15, 0.35), i % 3 ? RG[3] : WHITE); } });
      if (t >= BLAST) once("blast", () => { for (let i = 0; i < 30; i++) ps.spawn(P.DUST, HOLD - 10 + R.range(-6, 6), -1, R.range(60, 260), -R.range(4, 30), R.range(0.4, 0.9), DIRT[3], R.range(2, 4), 0, 0); });
      if (t > BLAST + OFF * 0.6 && t < BLAST + OFF + 0.2 && R.chance(40 * dt)) ps.spawn(P.DUST, TX + tgt(t).dx - 8, -1, -R.range(10, 40), -R.range(4, 16), R.range(0.3, 0.6), DIRT[2], R.range(1.5, 3), 0, 0);
      ps.update(dt);
    },
    drawBack(p, t) {
      // the furrow it ploughs as it is dragged in
      if (t > PULL) { const s = tgt(Math.min(t, STAB)), k = 1 - smooth(END - 0.8, END, t); p.line(TX + s.dx + 4, 0, TX, 0, DIRT[0], 0.7 * k); p.line(TX + s.dx + 4, 1, TX - 4, 1, DIRT[1], 0.5 * k); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN, s = tgt(t), tx = TX + s.dx, ty = -26 + s.dy;
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPEN, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", OPEN + 0.05, END - 0.4, b.head);
      if (t > REACH && t < STAB) p.text("BANSHOU TEN'IN", 20, -70, RG[4], { font: "mini", align: "center", outline: RG[0], a: smooth(REACH, REACH + 0.1, t) });
      // the pull: lines of force from the target to his palm, the target's space bent toward him
      if (t > PULL - 0.05 && t < STAB + 0.05) {
        const k = smooth(PULL - 0.05, PULL + 0.1, t);
        warp(p, tx, ty, 26, -0.5 * k, 0.2 * k);
        for (let i = 0; i < 9; i++) {
          const ph = (t * 3.2 + i / 9) % 1, off = (i - 4) * 5, u = ph, x = tx + (hx - tx) * u, y = ty + off * (1 - u) + (hy - ty) * u;
          p.line(x, y, x + 14 * (1 - u), y + off * 0.1, i % 2 ? RG[3] : RG[2], k * (0.4 + 0.6 * Math.sin(Math.PI * u)));
        }
        p.glow(hx, hy, 16, RG[2], 0.7 * k);
        p.ring(hx, hy, 5 + 3 * Math.sin(t * 30), 1, RG[3], k);
        // speed lines behind the flying target
        const v = pullU(t);
        for (let i = 0; i < 5; i++) { const y = ty - 14 + i * 7; p.line(tx + 10, y, tx + 10 + 40 * v, y, WHITE, 0.4 * v); }
      }
      // the rod
      if (t > ROD) {
        const r = rodOf(t, b), ux = Math.cos(r.a), uy = Math.sin(r.a), x1 = r.x + ux * r.L, y1 = r.y + uy * r.L, nx = -uy, ny = ux;
        p.beam(r.x - ux * 6, r.y - uy * 6, x1, y1, 2.5, ROD_C[1]);
        p.line(r.x - ux * 6 + nx * 0.6, r.y - uy * 6 + ny * 0.6, x1 + nx * 0.6, y1 + ny * 0.6, ROD_C[3]);
        for (let i = 4; i < r.L - 3; i += 5) { const x = r.x + ux * i, y = r.y + uy * i; p.line(x + nx * 1.5, y + ny * 1.5, x + nx * 3 - ux * 2, y + ny * 3 - uy * 2, ROD_C[2]); p.line(x - nx * 1.5, y - ny * 1.5, x - nx * 3 - ux * 2, y - ny * 3 - uy * 2, ROD_C[2]); }
        p.tri(x1 + nx * 2, y1 + ny * 2, x1 - nx * 2, y1 - ny * 2, x1 + ux * 5, y1 + uy * 5, ROD_C[0]);
        // run through: the rod's end showing out of the target's back, a ring of force on the hit
        if (t >= STAB && t < BLAST) { const k = 1 - smooth(STAB, STAB + 0.25, t); p.ring(HOLD - 2, -26, 6 + (t - STAB) * 70, 1, RG[4], k); p.circle(HOLD + 8, -27, 1.5, ROD_C[0]); }
      }
      // the push that blows it off: a small sphere from his palm
      if (t >= BLAST && t < BLAST + 0.4) {
        const u = ease.outCubic((t - BLAST) / 0.4), r = 8 + 50 * u, k = 1 - u;
        warp(p, hx, hy, r, 0, -0.12 * k);
        p.ring(hx, hy, r, 2, RG[3], k); p.ring(hx, hy, r + 2, 1, WHITE, 0.6 * k);
        if (t < BLAST + 0.05) p.circle(hx, hy, 10, WHITE);
      }
      ps.draw(p, "front");
    },
  };
});
void rand; void TAU;
