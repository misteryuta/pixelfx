// Fuuton: Kamaitachi no Jutsu (Sickle Weasel, Temari). Narutopedia: seals Snake, Dragon, Bird; with her giant folding
// fan Temari sends currents of wind crashing into each other, opening vacuum pockets; the gust alone blows attacks and
// people away, and anyone caught inside is carved up by countless blades of wind. Here: the seals, the huge fan snapped
// open to show its three moons, one great sweep, and a gale tears across the floor: streaks of wind, crescent blades
// shearing through it, dust ripped up, and cut after cut opening across the target.
// New: the fan (three panels opening, the three purple moons), the gale (streaks and crescent sickles), the cuts.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["mi", "tatsu", "tori"], 0.1, { hold: 0.15, kind: "wind" });
const OPEN = SEALS.end, RAISE = OPEN + 0.25, SWEEP = RAISE + 0.2, GALE = SWEEP + 0.05, CUTS = GALE + 0.25, END = CUTS + 1.9, TX = 160;
const WIND = ["#2f5e4e", "#5f9e86", "#a4d8c2", "#d8f4e8", "#ffffff"].map(hex), FAN = [hex("#e8dcc0"), hex("#c8b890"), hex("#6a2a8a"), hex("#3a2a1a")];

export const meta = {
  name: "Sickle weasel",
  desc: "Temari: Snake, Dragon, Bird, her giant fan snapped open to show its three moons, one great sweep, and a gale tears across the floor with crescent blades of wind carving cut after cut across the target.",
  tags: ["jutsu", "temari", "wind", "fuuton", "aoe", "one-shot"],
  size: [304, 164],
  origin: [56, 128],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2f5e4e", "#5f9e86", "#a4d8c2", "#d8f4e8", "#ffffff"], seed: 69 },
};

const HOLDF = { ...READY, crouch: 4, lean: -6, fx: -8, fy: -34, bx: -2, by: -26, ffx: 9, fbx: -9 };
const SWEPT = { ...READY, crouch: 8, lean: 12, fx: 20, fy: -14, bx: 8, by: -22, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [RAISE, HOLDF, "out"],
    [SWEEP, SWEPT, "in"],
    [END - 0.4, { ...SWEPT, crouch: 6 }],
    [END, READY],
  ],
  hits: [
    { t: CUTS, stop: 0.1, shake: 0.3, amp: 2, push: 4, straw: 26 },
    ...[0.15, 0.3, 0.45, 0.6, 0.75].map((d, i) => ({ t: CUTS + d, stop: 0.02, flash: 0, push: 1, straw: 8, shiver: 0.4, skin: i === 0 ? "red" : undefined })),
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SWEEP, x: 20, n: 12, dir: 1 }],
};

// the fan: hinge in her hand, opened to `open` (0..1) of its half circle, pointing along angle a
function fan(p, x, y, a, open) {
  const R0 = 30, span = Math.PI * 0.75 * open;
  p.shade(x - R0, y - R0, x + R0, y + R0, (px, py) => {
    const dx = px - x, dy = py - y, r = Math.hypot(dx, dy);
    if (r > R0 || r < 3) return;
    let d = Math.atan2(dy, dx) - (a - span / 2);
    d = ((d % TAU) + TAU) % TAU;
    if (d > span) return;
    if (r > R0 - 1.5) return FAN[3];
    return Math.floor((d / Math.max(0.01, span)) * 3) % 2 ? FAN[1] : FAN[0];
  });
  // the three moons, one on each panel
  if (open > 0.6) for (let k = 0; k < 3; k++) {
    const aa = a - span / 2 + span * (k + 0.5) / 3;
    p.circle(x + Math.cos(aa) * R0 * 0.66, y + Math.sin(aa) * R0 * 0.66, 3, FAN[2]);
  }
  p.line(x, y, x + Math.cos(a - span / 2) * R0, y + Math.sin(a - span / 2) * R0, FAN[3]);
  p.line(x, y, x + Math.cos(a + span / 2) * R0, y + Math.sin(a + span / 2) * R0, FAN[3]);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      if (t > GALE && t < GALE + 0.9) {
        if (R.chance(120 * dt)) ps.spawn(P.STREAK, R.range(10, 40), -R.range(2, 60), R.range(260, 380), R.range(-20, 20), R.range(0.25, 0.4), R.chance(0.5) ? WIND[3] : WIND[4]);
        if (R.chance(60 * dt)) ps.spawn(P.DUST, R.range(20, 200), -1, R.range(120, 260), -R.range(4, 40), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
      }
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, WIND);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "temari", t0: 0.05, t1: SEALS.end, label: "KAMAITACHI", head: b.head });
      // the fan: closed on her back, snapped open overhead, swept down and forward
      if (t > OPEN) {
        const open = ease.outBack(clamp((t - OPEN) / 0.15), 2), a = t < SWEEP ? -2.2 + 0.2 * smooth(OPEN, RAISE, t) : -2 + 2.2 * ease.outCubic(clamp((t - SWEEP + 0.15) / 0.2));
        const pf = p.fade;
        p.fade = pf * (1 - smooth(END - 0.7, END - 0.15, t));
        fan(p, b.handN[0], b.handN[1], a, Math.min(1, open));
        p.fade = pf;
      }
      // the gale: crescent sickles of wind racing out across the floor, some low, some high
      for (let i = 0; i < 9; i++) {
        const t0 = GALE + i * 0.06, a = t - t0;
        if (a < 0 || a > 0.45) continue;
        const u = a / 0.45, x = 30 + (TX + 40 - 30) * u, y = -8 - (i % 4) * 12, r = 10 + (i % 3) * 3;
        p.arc(x - r, y, r, 2, -0.9, 0.9, WIND[2], 1 - u * 0.5);
        p.arc(x - r + 1, y, r, 1, -0.8, 0.8, WIND[4], 1 - u * 0.5);
      }
      // the cuts opening across the target, one after another
      for (let i = 0; i < 6; i++) {
        const a = t - CUTS - i * 0.15;
        if (a < 0 || a > 0.5) continue;
        const y = -44 + i * 7, s = rand(i, 3) > 0.5 ? 1 : -1, k = 1 - a / 0.5;
        p.line(TX - 12, y - s * 5, TX + 12, y + s * 5, WHITE, k);
        p.line(TX - 10, y - s * 4 + 1, TX + 10, y + s * 4 + 1, WIND[2], k);
      }
      ps.draw(p, "front");
    },
  };
});
