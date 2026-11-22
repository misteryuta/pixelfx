// Mokuton: Daijurin no Jutsu (Wood Release: Great Forest Technique, Yamato). Narutopedia: Yamato, carrying Hashirama's
// cells, transforms his own arm into a mass of wooden beams that grow forward at speed, branching into a forest that
// can seize, pierce or restrain the enemy. Here: Yamato (the forehead protector with its cheek guards) thrusts his arm
// out; the arm becomes wood and splits into thick beams that shoot forward, branching and branching again, a
// tangle of growing timber that reaches the target, wraps round it in rings of branches and pins it to the ground;
// leaves sprout along the beams; the wood then splinters and draws back into his arm.
// New: the branching growth (a recursive set of beams that extend over time), the binding rings, the leaves.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const THRUST = 0.4, GROW = 0.55, REACH = 1.25, BIND = 1.45, LEAVES = 1.8, RETRACT = 2.9, END = 3.7, TX = 170;
const WOOD = ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"].map(hex), LEAF = ["#2a6a2a", "#5ab04a"].map(hex);

export const meta = {
  name: "Great forest technique",
  desc: "Yamato thrusts his arm out and it turns to wood, splitting into thick beams that shoot forward and branch into a tangle of timber that wraps the target in rings of branches and pins it, leaves sprouting along it, before drawing back.",
  tags: ["jutsu", "yamato", "mokuton", "wood", "bind", "one-shot"],
  size: [250, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"], seed: 198 },
};

const ARM = { ...READY, crouch: 6, lean: 8, fx: 24, fy: -26, bx: -6, by: -20, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [THRUST, ARM, "out"],
    [RETRACT, ARM],
    [END, READY],
  ],
  hits: [
    { t: THRUST, target: false, sfx: "whoosh" },
    { t: REACH, stop: 0.1, shake: 0.4, amp: 2, push: 2, straw: 20, sfx: "heavy" },
    { t: BIND, stop: 0.08, shake: 0.3, amp: 1, push: 0, straw: 10, flash: 0, sfx: "block" },
    { t: RETRACT, target: false, sfx: "whoosh" },
  ],
};
export const targetState = (t) => (t > BIND && t < RETRACT ? { s: 1 - 0.04 * smooth(BIND, BIND + 0.3, t) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the branches: a fixed tree (start, angle, length, depth, birth time), grown out from the hand
  const BR = [];
  const make = (x, y, a, L, d, t0) => { BR.push({ x, y, a, L, d, t0 }); if (d >= 3) return; const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, n = d === 0 ? 3 : 2; for (let i = 0; i < n; i++) make(ex, ey, a + (i - (n - 1) / 2) * 0.5 + (rand(BR.length, d) - 0.5) * 0.2, L * 0.62, d + 1, t0 + 0.18); };
  return {
    update(t, dt) {
      if (t > RETRACT && t < RETRACT + 0.3 && R.chance(60 * dt)) ps.spawn(P.GRIT, TX - R.range(0, 100), -R.range(10, 40), R.range(-40, 40), R.range(-60, 20), R.range(0.3, 0.6), WOOD[R.int(2, 4)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN, [fx, fy] = b.head;
      drawBadge(p, t, { kind: "wood", t0: 0.04, t1: THRUST, label: "DAIJURIN", head: b.head });
      // the forehead protector with its cheek guards
      p.rect(fx - 3, fy - 4, 7, 2, hex("#9a9aa8")); p.line(fx - 3, fy - 2, fx - 3, fy + 3, hex("#9a9aa8"));
      if (BR.length === 0 || this.hx !== Math.round(hx)) { BR.length = 0; this.hx = Math.round(hx); make(hx, hy, Math.atan2(-28 - hy, TX - 6 - hx), (TX - 6 - hx) * 0.55, 0, GROW); }
      const back = ease.inCubic(smooth(RETRACT, END - 0.2, t));
      // the arm turning to wood
      if (t > THRUST) p.beam(b.chest[0], b.chest[1], hx, hy, 3, WOOD[3]);
      for (const br of BR) {
        const g = clamp((t - br.t0) / 0.2) * (1 - back);
        if (g <= 0) continue;
        const ex = br.x + Math.cos(br.a) * br.L * g, ey = br.y + Math.sin(br.a) * br.L * g, w = 6 - br.d * 1.4;
        p.beam(br.x, br.y, ex, ey, w + 1.5, WOOD[0]); p.beam(br.x, br.y, ex, ey, w, br.d % 2 ? WOOD[2] : WOOD[3]); p.line(br.x, br.y - w * 0.3, ex, ey - w * 0.3, WOOD[4]);
        if (t > LEAVES && br.d >= 2 && back < 0.5) { const lk = smooth(LEAVES, LEAVES + 0.3, t); p.ellipse(ex, ey - 2, 2.5 * lk, 1.5 * lk, LEAF[1]); p.px(ex - 1, ey - 2, LEAF[0]); }
      }
      // the binding rings of branches round the target
      if (t > BIND - 0.1 && back < 1) { const g = ease.outBack(smooth(BIND - 0.1, BIND + 0.2, t), 1.6) * (1 - back); for (let i = 0; i < 3; i++) { const y = -12 - i * 12; p.ellipse(TX, y, 11 * g, 3 * g, (d) => (d > 0.7 ? WOOD[2] : 0)); p.arc(TX, y, 11 * g, 1, 0.2, 2.9, WOOD[4]); } }
      void noise2; void TAU; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
