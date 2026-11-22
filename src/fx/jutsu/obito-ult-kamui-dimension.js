// ULTIMATE: Kamui: the other dimension (Obito Uchiha). Narutopedia: Obito's right Mangekyou (Kamui) can pull anything
// it focuses on into a separate dimension: a grey, endless space of huge floating cubes and towers under a black sky;
// he can follow it there himself, and he pinned his foes with black chakra receiver rods (the Rinnegan's rods he used as
// Tobi). Here: the spiral mask; Obito's right eye spins; space around the target twists into a vortex and it is sucked
// away into the warp; the frame cuts into the Kamui dimension: grey cubes floating in blackness, the target tumbling
// down onto one of them; Obito steps out of a spiral beside it, black rods sprout from his sleeve and he drives them
// through it in a fan, pinning it to the cube; he looks back, the space twists once more and spits the target back out
// onto the field, rods still in it.
// New: the vortex pull, the dimension (cubes, black sky), the rods; ULTIMATE staging; one impact frame (shards).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, drawFigure, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultBanner, frameOf } from "./_ultimate.js";

const SPIN = 0.5, PULL = 0.9, GONE = 1.6, INSIDE = 1.75, LAND = 2.15, STEP = 2.5, RODS = 2.95, PIN = 3.15, BACK = 4.0, OUT = 4.35, END = 5.4, TX = 180;
const VOID = ["#020104", "#0c0a12", "#1a1822", "#2e2c38", "#4a4856", "#7a7888", "#b8b6c4"].map(hex), ROD = ["#06040a", "#1a1620", "#3a3444"].map(hex), ORANGE = hex("#e06a1a");

export const meta = {
  name: "Kamui dimension",
  desc: "ULTIMATE. Obito: his right eye spins and space twists around the target, sucking it away into the Kamui dimension, a grey world of floating cubes; he follows, drives a fan of black rods through it, and the warp spits it back out pinned.",
  tags: ["jutsu", "ultimate", "obito", "kamui", "mangekyou", "space-time", "one-shot"],
  size: [340, 230],
  origin: [56, 200],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#020104", "#1a1822", "#4a4856", "#b8b6c4"], seed: 169 },
};

const FOCUS = { ...READY, crouch: 3, lean: -2, fx: 6, fy: -30, bx: -6, by: -20, ffx: 8, fbx: -8 };
const STAB = { ...READY, crouch: 6, lean: 12, fx: 26, fy: -26, bx: -6, by: -20, ffx: 12, fbx: -10, gait: false };
// in the dimension Obito stands beside the target on its cube
const DX = TX - 30;
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SPIN, FOCUS, "out"],
    [STEP - 0.01, FOCUS],
    [STEP, { ...FOCUS, x: DX - 10, gait: false }, "snap"],
    [RODS, { ...FOCUS, x: DX - 10, fx: -8, fy: -30, gait: false }, "out"],
    [PIN, { ...STAB, x: DX - 10 }, "snap"],
    [BACK, { ...STAB, x: DX - 10, lean: 4 }],
    [OUT - 0.01, { ...FOCUS, x: DX - 10, gait: false }],
    [OUT, { ...FOCUS, x: 0, gait: false }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: SPIN, target: false, sfx: "cast" },
    { t: PULL, stop: 0.08, shake: 0.6, amp: 2, push: -2, straw: 20, flash: 0, shiver: 1, sfx: "whoosh" },
    { t: LAND, stop: 0.08, shake: 0.4, amp: 3, push: 0, straw: 14, sfx: "land" },
    { t: PIN, stop: 0.3, shake: 0.8, amp: 5, push: 2, straw: 50, flash: 0.06, skin: "shadow", sfx: "heavy" },
    { t: OUT, stop: 0.1, shake: 0.6, amp: 3, push: 6, straw: 20, sfx: "whoosh" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// sucked into the warp (shrinking, spinning), dropped onto the cube in the dimension, then spat back out
export const targetState = (t) => {
  if (t > PULL && t < GONE) { const u = smooth(PULL, GONE, t); return { s: 1 - 0.9 * u, rot: u * 8, dy: -24 * u, a: u > 0.95 ? 0 : 1 }; }
  if (t >= GONE && t < INSIDE) return { a: 0 };
  if (t >= INSIDE && t < LAND) { const u = ease.inQuad(smooth(INSIDE, LAND, t)); return { dy: -80 * (1 - u), rot: (1 - u) * 3 }; }
  if (t >= OUT - 0.2 && t < OUT + 0.4) { const u = smooth(OUT - 0.2, OUT + 0.4, t); return { s: 0.4 + 0.6 * u, rot: (1 - u) * -5 }; }
  return null;
};
// inside the dimension the whole scene is the other world: the effect draws the backdrop over the field
const inside = (t) => t >= INSIDE && t < OUT;
// Obito follows only when he steps out of his own spiral in there
export const actorAlpha = (t) => (t >= INSIDE && t < STEP - 0.05 ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  // the cubes of the dimension: big grey blocks floating at different depths
  const CUBES = Array.from({ length: 11 }, (_, i) => ({ x: box[0] + 20 + i * 32 + (rand(i, 1) - 0.5) * 20, y: -40 - rand(i, 2) * 130, s: 10 + rand(i, 3) * 26, d: rand(i, 4) }));
  const RODSD = Array.from({ length: 5 }, (_, i) => ({ a: -0.5 + i * 0.25, L: 46 + rand(i, 5) * 10 }));
  return {
    update(t, dt) {
      if (t > PULL && t < GONE && R.chance(60 * dt)) { const a = R.range(0, TAU), d = R.range(30, 60); ps.spawn(P.STREAK, TX + Math.cos(a) * d, -24 + Math.sin(a) * d, -Math.cos(a) * 140, -Math.sin(a) * 140, 0.25, VOID[5]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the Kamui dimension: black sky, grey cubes floating at different depths, a big cube the fight lands on
      if (inside(t)) {
        const [x0, y0, x1, y1] = box;
        p.rect(x0, y0, x1 - x0, y1 - y0, VOID[0]);
        for (const c of CUBES) { const sh = Math.sin(t * 0.6 + c.d * 5) * 2, col = c.d > 0.5 ? 2 : 1; p.rect(c.x - c.s / 2, c.y - c.s / 2 + sh, c.s, c.s, VOID[col + 1]); p.rect(c.x - c.s / 2, c.y - c.s / 2 + sh, c.s, 2, VOID[col + 3]); p.rect(c.x + c.s / 2 - 3, c.y - c.s / 2 + sh, 3, c.s, VOID[col]); }
        // the near cube they stand on: its top is the floor line
        p.rect(DX - 90, 0, 200, 40, VOID[3]);
        p.rect(DX - 90, 0, 200, 2, VOID[5]);
        p.rect(DX + 106, 0, 4, 40, VOID[2]);
      }
      // the vortex in the field round the target
      if (t > SPIN + 0.1 && t < GONE + 0.1) {
        const u = smooth(SPIN + 0.1, PULL, t) * (1 - smooth(GONE - 0.1, GONE + 0.1, t)), Rv = 40 * u;
        warp(p, TX, -24, Rv + 20, 2 * u, 0.6 * u);
        for (let i = 0; i < 3; i++) p.arc(TX, -24, Rv * (0.4 + i * 0.25), 1, t * 8 + i * 2, t * 8 + i * 2 + 2.4, VOID[4], u);
      }
      // the spit back out
      if (t > OUT - 0.25 && t < OUT + 0.3) { const u = 1 - Math.abs(t - OUT) / 0.3; warp(p, TX, -24, 50, -1.6 * u, 0.4 * u); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      ultBanner(p, t, box, { t0: 0.05, name: "KAMUI", hold: 1.0, color: "#e06a1a" });
      drawBadge(p, t, { kind: "obito", t0: 0.1, t1: SPIN, label: "KAMUI", head: b.head });
      drawGlint(p, t, "obito", SPIN, END - 0.3, b.head);
      // the spiral mask, its single eye hole on the right
      p.circle(hx + 1, hy, 3.4, ORANGE);
      for (let i = 0; i < 3; i++) p.arc(hx + 1, hy, 1 + i, 1, i, i + 4, hex("#a04a10"));
      p.circle(hx + 2, hy - 1, 1, hex("#c01a24"));
      // stepping out of a spiral in the dimension
      if (t > STEP - 0.2 && t < STEP + 0.3) { const u = 1 - Math.abs(t - STEP) / 0.3; for (let i = 0; i < 4; i++) p.arc(DX - 10, -20, 6 + i * 5, 1, t * 10 + i, t * 10 + i + 2.6, VOID[5], u); }
      // the rods: sprouting from his sleeve, driven through the target in a fan
      if (t > RODS - 0.1 && t < END - 0.3) {
        const k = 1 - smooth(END - 0.7, END - 0.3, t), g = ease.outCubic(smooth(RODS - 0.1, PIN, t));
        for (const r of RODSD) {
          const sx = t < OUT ? b.handN[0] : TX - 30, sy = t < OUT ? b.handN[1] : -24, L = r.L * g, ex = sx + Math.cos(r.a) * L, ey = sy + Math.sin(r.a) * L;
          p.beam(sx, sy, ex, ey, 2.2, ROD[0], k); p.line(sx, sy - 1, ex, ey - 1, ROD[2], k);
          for (let j = 1; j < 5; j++) p.px(sx + (ex - sx) * (j / 5), sy + (ey - sy) * (j / 5) + 1.5, ROD[1], k);
        }
      }
      if (t > PIN && t < PIN + 0.2) { const v = (t - PIN) / 0.2; p.ring(TX, -26, 6 + 30 * v, 1, VOID[6], 1 - v); }
      void drawFigure; void noise2; void WHITE; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= PIN && t < PIN + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -26, false, 169, { style: "shards", ink: hex("#020104"), paper: hex("#d8d6e0"), lines: 20 });
    },
  };
});
