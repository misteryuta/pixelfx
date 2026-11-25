// Kage Nui no Jutsu (Shadow Stitching, Shikamaru, Shippuden). Narutopedia: an advanced Nara shadow technique: the
// user's shadow is shaped into thin, sharp tendrils that rise out of the ground and pierce the target; they can hold
// it after piercing. Shikamaru uses it against Hidan and Kakuzu. Seal: Rat.
// Not Kagemane: no shadow joining shadow and no copied movement. The moment a fan has to see: single black strands
// lifting out of a flat pool of shadow, needle tips first, and only then stabbing. Here: Rat seal; his shadow races
// over the floor in a thin line and spreads into a flat pool under the target; the camera drops low on the pool; one
// strand, then a second, then a fan of five rise, swaying, needle tips out; they stab in (the hit), the target is
// pinned upright, lifted onto its toes, shivering; the camera pulls back so the line from his feet to the pool reads;
// he closes his hands and the strands slide back down into the pool, the pool drains into the line, the target drops.
// New: rising shadow strands (curved, thickest at the root, needle tip), a flat pool with a crawling rim.
import { Rng, READY, fit, clamp, smooth, ease, hex, noise2, WHITE } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const SEALS = sealRun(0.3, ["ne"], 0.12, { hold: 0.35 });
const RUN = SEALS.end, POOL = RUN + 0.45, RISE = POOL + 0.25, STAB = RISE + 0.9, STAB2 = STAB + 0.22, HOLD = STAB2 + 0.9, PULL = HOLD + 0.35, END = PULL + 0.9, TX = 160;
const SH = ["#040306", "#120e1a", "#262032", "#463c56", "#8a80a0"].map(hex);
// the strands: root offset from the target's centre, height, lean, when it starts to rise
const STRANDS = [
  { dx: -6, h: 46, lean: -0.3, t0: 0 },
  { dx: 8, h: 52, lean: 0.3, t0: 0.16 },
  { dx: -15, h: 36, lean: -0.5, t0: 0.3 },
  { dx: 16, h: 40, lean: 0.55, t0: 0.36 },
  { dx: -1, h: 58, lean: 0.06, t0: 0.42 },
  { dx: 3, h: 30, lean: 0.2, t0: 0.47 },
  { dx: 21, h: 28, lean: 0.7, t0: 0.5 },
];

export const meta = {
  name: "Shadow stitching",
  desc: "Shikamaru: the Rat seal; his shadow runs out in a thin line and spreads into a flat pool under the target; black strands lift out of it one by one, needle tips first, and stab in, pinning the target on its toes; then they slide back down and the shadow drains home.",
  tags: ["jutsu", "shikamaru", "nara", "shadow", "bind", "pierce", "one-shot"],
  size: [260, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#040306", "#120e1a", "#262032", "#463c56", "#8a80a0"], seed: 61 },
};

const SEALP = SEALS.keys[SEALS.keys.length - 1][1];
const STRAIN = { ...SEALP, crouch: 7, lean: 6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEALS.list[0].t - 0.08, { ...READY, crouch: 6 }],
    ...SEALS.keys,
    [STAB, STRAIN, "out"],
    [HOLD, { ...STRAIN, crouch: 9, lean: 9 }],
    [PULL, { ...STRAIN, crouch: 5, lean: 2, fx: 8, fy: -22, bx: 6, by: -22 }, "out"],
    [END, { ...READY, crouch: 3 }],
  ],
  hits: [
    { t: RUN, target: false, sfx: "whoosh" },
    { t: STAB, stop: 0.16, shake: 0.25, amp: 2, push: 0, straw: 0, flash: 0, sfx: "parry" },
    { t: STAB2, stop: 0.06, shake: 0.15, amp: 1, push: 0, straw: 2, flash: 0, sfx: "punch" },
    { t: PULL, stop: 0.02, push: 0, straw: 3, flash: 0, sfx: "whoosh" },
    { t: END - 0.25, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// pinned: lifted onto its toes while the strands hold, a shiver, dropped when they let go
export const targetState = (t) => {
  if (t < STAB || t > PULL + 0.25) return null;
  const up = smooth(STAB, STAB + 0.12, t) * (1 - smooth(PULL, PULL + 0.15, t));
  return { dy: -3 * up, rot: Math.sin(t * 40) * 0.015 * up, tint: [SH[1], 0.18 * up] };
};

// the camera: on him for the seal; low on the pool as the strands rise (the moment); held through the stab; back out
// so the line from his feet to the pool reads; wide as it drains
export const camera = cineCam([
  [0, { z: 1.35, x: 40, y: -30 }],
  [RUN, { z: 1.25, x: 70, y: -28 }],
  [POOL, { z: 1.2, x: TX - 30, y: -22 }],
  [RISE, { z: 2.0, x: TX, y: -16, r: 2 }, "cut"],
  [STAB, { z: 2.15, x: TX, y: -26, r: 2 }],
  [STAB + 0.04, { z: 2.15, x: TX, y: -26, r: 2, shake: 0.6 }],
  [STAB + 0.3, { z: 2.0, x: TX, y: -26, r: 1 }],
  [HOLD - 0.3, { z: 1.1, x: 100, y: -30, r: 0 }],
  [END, { z: 1.05, x: 100, y: -30 }],
]);

export const create = play([], (o) => {
  const C = fit(o.palette, 5);
  const R = new Rng(o.seed);
  // how far a strand has risen at t (0..1), and how far it has gone back down
  const riseOf = (s, t) => ease.outCubic(clamp((t - RISE - s.t0) / 0.32)) * (1 - ease.inCubic(clamp((t - PULL - s.t0 * 0.3) / 0.35)));
  const stabOf = (s, t) => smooth(STAB - 0.07 + s.t0 * 0.3, STAB + 0.01 + s.t0 * 0.3, t);
  void R;
  return {
    drawBack(p, t) {
      if (t < RUN) return;
      const pf = p.fade;
      p.fade = pf * (1 - smooth(END - 0.45, END - 0.05, t));
      // the line: thinner and quicker than Kagemane's band, straight to the target's feet
      const u = ease.inOutCubic(clamp((t - RUN) / (POOL - RUN))), drain = smooth(PULL + 0.2, END - 0.2, t);
      const x0 = 6 + (TX - 20) * drain, x1 = 6 + (TX - 6) * u;
      p.shade(x0 - 4, -2, x1 + 2, 3, (x, y) => {
        const w = 1.2 + 0.7 * noise2(x * 0.25 - t * 8, 0, 3);
        if (x > x1 || Math.abs(y - 0.5) > w) return;
        return SH[0];
      });
      // the pool under the target: spreads, its rim crawling; drains back into the line at the end
      const pr = 27 * ease.outBack(smooth(POOL - 0.1, RISE, t), 1.3) * (1 - smooth(PULL + 0.15, END - 0.3, t));
      if (pr > 0.5) p.shade(TX - pr - 3, -3, TX + pr + 3, 4, (x, y) => {
        const rim = pr * (1 + 0.12 * noise2(x * 0.3 + t * 3, y, 4));
        const d = Math.hypot((x - TX) / rim, (y - 0.5) / Math.max(1, rim * 0.12));
        if (d > 1) return;
        return d > 0.86 ? SH[3] : d > 0.7 ? SH[1] : SH[0];
      });
      p.fade = pf;
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(1).concat([hex("#c8c0e0")]));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "nara", t0: 0.05, t1: SEALS.end, label: "KAGE NUI", head: b.head });
      // the strands: out of the pool, curved, thick at the root, needle tip; after the stab they run straight
      // into the target's body and stay taut
      for (const s of STRANDS) {
        const r = riseOf(s, t);
        if (r <= 0) continue;
        const st = stabOf(s, t), rx = TX + s.dx, h = s.h * r;
        // free: swaying, leaning outward; stabbed: the tip pulled in to a point on the target's body
        const sway = Math.sin(t * 7 + s.dx) * 3 * (1 - st);
        const tipFree = [rx + s.lean * h * 0.6 + sway, -h], tipIn = [TX + s.dx * 0.25, -14 - s.h * 0.45];
        const tx = tipFree[0] + (tipIn[0] - tipFree[0]) * st, ty = tipFree[1] + (tipIn[1] - tipFree[1]) * st;
        const n = Math.max(3, Math.round(h / 2));
        let px = rx, py = 0;
        for (let i = 1; i <= n; i++) {
          const v = i / n, bend = Math.sin(v * Math.PI) * s.lean * 8 * (1 - st);
          const nx = rx + (tx - rx) * v + bend, ny = py + (ty - 0) / n;
          const w = Math.max(0.6, 2.4 * (1 - v));
          p.beam(px, py, nx, ny, w, SH[0]);
          if (v < 0.85) p.line(px + 1, py, nx + 1, ny, SH[3], 0.8);
          (px = nx), (py = ny);
        }
        // the needle tip: a lit point the instant it goes in
        if (st > 0 && st < 1) p.px(Math.round(tx), Math.round(ty), WHITE);
      }
      // the instant of the stab: short white ticks where they enter
      const a = t - STAB;
      if (a > 0 && a < 0.08) for (const s of STRANDS) p.line(TX + s.dx * 0.25 - 2, -14 - s.h * 0.45, TX + s.dx * 0.25 + 2, -14 - s.h * 0.45, WHITE, 1 - a / 0.08);
    },
  };
});
