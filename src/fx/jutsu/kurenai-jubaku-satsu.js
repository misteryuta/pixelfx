// Magen: Jubaku Satsu (Demonic Illusion: Tree Binding Death, Kurenai Yuuhi). Narutopedia: a genjutsu in which a tree
// grows up under the victim and its branches bind them fast, while Kurenai herself grows out of the trunk behind them
// and stabs them with a kunai. Here: Snake; her red eyes flare and the world bleeds into a genjutsu: everything goes
// red-violet, petals drift; at the target's feet a tree grows, its roots splitting the floor, its trunk climbing up
// behind the target and its branches wrapping round it, tightening; Kurenai is gone from where she stood; she leans out
// of the bark behind the target, half woman half tree, kunai raised; one stab; the illusion shatters like glass and
// the world comes back, the target reeling.
// New: the genjutsu filter, the binding tree, her emerging from the trunk, the shattering. From _lib: veil.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, veil, drawFigure, drawFigureTurned } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["mi"], 0.12, { hold: 0.2 });
const EYES = SEALS.end, ILL = EYES + 0.2, GROW = ILL + 0.3, BOUND = GROW + 0.8, EMERGE = BOUND + 0.15, STAB = EMERGE + 0.55, SHATTER = STAB + 0.45, END = SHATTER + 1.2, TX = 160;
const BARK = ["#1a0c10", "#3a1a22", "#5a2a34", "#7a4048"].map(hex), RED = hex("#ff3a5a"), PET = ["#ff8aa8", "#d84a7a"].map(hex);

export const meta = {
  name: "Demonic illusion: tree binding death",
  desc: "Kurenai: Snake, her red eyes flare and the world bleeds red; a tree grows up under the target and its branches wrap it tight; she grows head-first out of the crown above it and draws her kunai across its throat, and the illusion shatters like glass.",
  tags: ["jutsu", "kurenai", "genjutsu", "bind", "one-shot"],
  size: [290, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0c10", "#3a1a22", "#5a2a34", "#ff3a5a", "#ff8aa8"], seed: 84 },
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [ILL, { ...READY, crouch: 2, fx: 6, fy: -28, bx: 4, by: -26 }, "out"],
    [SHATTER, { ...READY, crouch: 2, fx: 6, fy: -28, bx: 4, by: -26 }],
    [SHATTER + 0.3, READY, "out"],
    [END, READY],
  ],
  hits: [
    { t: EYES, stop: 0.06, target: false, sfx: "cast" },
    { t: BOUND, stop: 0.08, shake: 0.2, amp: 1, push: 0, straw: 6, flash: 0, sfx: "block" },
    { t: STAB, stop: 0.18, shake: 0.4, amp: 3, push: 3, straw: 30, skin: "red", sfx: "heavy" },
    { t: SHATTER, stop: 0.08, shake: 0.4, amp: 2, target: false, sfx: "clash" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// in the illusion she is gone from where she stood, and at the end back
export const actorAlpha = (t) => (t > GROW && t < SHATTER ? 0 : 1);
// bound: the target can't sway
export const targetState = (t) => (t > BOUND && t < SHATTER ? { tint: [BARK[2], 0.25] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), shards = [];
  const petals = Array.from({ length: 24 }, (_, i) => ({ x: -40 + rand(i, 1) * 280, y: -160 + rand(i, 2) * 40, v: 14 + rand(i, 3) * 20, ph: rand(i, 4) * TAU }));
  return {
    update(t, dt) {
      if (t >= SHATTER && !shards.length) for (let i = 0; i < 40; i++) shards.push({ x: -50 + R.range(0, 290), y: -R.range(0, 160), vx: R.range(-60, 60), vy: R.range(-40, 80), a: R.range(0, TAU), va: R.range(-8, 8), s: R.range(4, 10), age: 0 });
      for (const s of shards) { s.vy += 300 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt; s.age += dt; }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the genjutsu: the world drowned in red-violet, a slow ripple through it
      const ill = smooth(EYES, ILL + 0.2, t) * (t < SHATTER ? 1 : 0);
      if (ill > 0) veil(p, -56, -168, 234, 32, hex("#3a0a1e"), 0.6 * ill);
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, [BARK[0], BARK[1], BARK[2], RED, PET[0]]);
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20), ill = t < SHATTER ? smooth(EYES, ILL + 0.2, t) : 0;
      drawBadge(p, t, { kind: "genjutsu", t0: 0.04, t1: EYES, label: "MAGEN", head: b.head });
      if (t > EYES - 0.05 && t < EYES + 0.3) { const u = (t - EYES + 0.05) / 0.35; p.glow(b.head[0] + 2, b.head[1] - 1, 20 * (1 - u) + 4, RED, 0.8 * (1 - u)); }
      // petals drifting down through the illusion
      if (ill > 0) for (const q of petals) {
        const y = q.y + ((t * q.v) % 180), x = q.x + Math.sin(t * 2 + q.ph) * 6;
        p.px(x, y, PET[(Math.floor(t * 6 + q.ph) % 2)], ill);
        p.px(x + 1, y, PET[0], ill * 0.6);
      }
      // the tree: roots splitting the floor, a trunk climbing behind the target, branches wrapping it
      const g = smooth(GROW, BOUND, t) * (t < SHATTER ? 1 : 0);
      if (g > 0) {
        for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; p.beam(TX + 8, 0, TX + 8 + Math.cos(a) * 26 * g, Math.sin(a) * 2, 2.5, BARK[1]); }
        const top = -70 * g;
        p.shade(TX - 4, top - 4, TX + 22, 1, (x, y, out) => {
          const w = 7 + 2 * Math.sin(y * 0.15) + (y > -8 ? (-y + 8) * -0.5 + 4 : 0);
          if (Math.abs(x - TX - 9) > w || y < top) return;
          const n = noise2(x * 0.3, y * 0.08, 4);
          return Math.abs(x - TX - 9) > w - 1.2 ? BARK[0] : n > 0.3 ? BARK[3] : n > -0.1 ? BARK[2] : BARK[1];
        });
        // branches wrapping round the target, tightening
        const wrap = smooth(GROW + 0.4, BOUND, t);
        for (let i = 0; i < 4; i++) {
          const y = -12 - i * 11, tight = 14 - 3 * wrap;
          p.arc(TX + 2, y, tight, 2.5, Math.PI * 0.6, Math.PI * 0.6 + Math.PI * 1.8 * wrap, BARK[2]);
          p.arc(TX + 2, y, tight, 1, Math.PI * 0.6, Math.PI * 0.6 + Math.PI * 1.8 * wrap, BARK[3]);
        }
        // leaves on the crown
        for (let i = 0; i < 10; i++) { const a = rand(i, 3) * TAU, d = 16 * g * rand(i, 4); p.circle(TX + 9 + Math.cos(a) * d, top + Math.sin(a) * d * 0.6, 4 * g, i % 2 ? hex("#4a1a2a") : hex("#6a2a3a")); }
      }
      // Kurenai coming out of the tree above the target (Narutopedia): she grows head-first out of the crown, hanging
      // down over it, kunai in hand, and draws it across the target's throat
      if (t > EMERGE && t < SHATTER) {
        const e = smooth(EMERGE, EMERGE + 0.35, t), stab = smooth(STAB - 0.08, STAB, t), top = -70 * smooth(GROW, BOUND, t);
        const q = { ...READY, crouch: 0, lean: 4, fx: 10 + 8 * stab, fy: -30 + 6 * stab, bx: -6, by: -26, ffx: 4, fbx: -4 };
        // upside down: feet still in the crown, head and arms reaching down toward the target's head
        const fy = -54 - 24 * (1 - e) + 0 * top, cy = fy - 20;
        drawFigureTurned(p, q, TX + 4, fy, TX + 4, cy, Math.PI, { face: -1, tint: BARK[2], k: 0.65 * (1 - e) + 0.12 });
        // the kunai at the throat
        const hx = TX - 8 + 10 * stab, hy = -44 + 6 * stab;
        p.beam(hx, hy, hx + 7, hy + 2, 1.5, hex("#c8d0e0"), e);
        if (t > STAB && t < STAB + 0.15) { const u = (t - STAB) / 0.15; p.beam(TX - 8, -38, TX + 14, -36, 2 * (1 - u) + 0.5, WHITE, 1 - u); p.circle(TX + 3, -37, 6, WHITE, 1 - u); }
      }
      // the shattering: the red world breaking into falling panes, the real one behind
      for (const s of shards) {
        const k = 1 - smooth(0.4, 1.0, s.age), c = Math.cos(s.a), sn = Math.sin(s.a);
        p.poly([[s.x - c * s.s, s.y - sn * s.s], [s.x + sn * s.s * 0.6, s.y - c * s.s * 0.6], [s.x + c * s.s, s.y + sn * s.s]], hex("#5a1a30"), k * 0.8);
        p.line(s.x - c * s.s, s.y - sn * s.s, s.x + c * s.s, s.y + sn * s.s, PET[0], k);
      }
      if (t >= SHATTER && t < SHATTER + 0.06) p.rect(-56, -168, 290, 200, WHITE, 0.6);
      void ease; void clamp; void f;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});
