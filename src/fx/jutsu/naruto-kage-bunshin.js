// Tajuu Kage Bunshin no Jutsu (Multiple Shadow Clone, Naruto). Narutopedia: the clone seal (or Tiger/Horse); real
// copies with the chakra split evenly between them, hundreds at once in the multiple version, each one bursting into a
// puff of smoke when it takes a hard hit. Here: the cross-shaped clone seal held, a wave of puffs all round him, a crowd
// of Narutos in two rows, and they rush the target, each landing a blow and bursting into smoke on it.
// New: the clones (posed second bodies, drawFigure, the back row darker), their run cycle; the puffs (_lib drawPoof).
import { Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["juuji"], 0.12, { hold: 0.55 });
const SPAWN = SEALS.end - 0.15, CHARGE = SPAWN + 0.85, TX = 170;
// the clones: where each appears (x), its row (0 front, 1 back), when it poofs in (after SPAWN) and when it sets off
const CLONES = [
  { x: 26, row: 0, d: 0.0, go: 0.0 }, { x: -26, row: 0, d: 0.05, go: 0.12 }, { x: 46, row: 1, d: 0.08, go: 0.02 },
  { x: 8, row: 1, d: 0.11, go: 0.2 }, { x: -44, row: 1, d: 0.14, go: 0.3 }, { x: 64, row: 0, d: 0.17, go: 0.06 },
  { x: -10, row: 1, d: 0.2, go: 0.36 }, { x: 86, row: 1, d: 0.23, go: 0.1 }, { x: -36, row: 0, d: 0.26, go: 0.26 },
];
const SPEED = 230;
const arrive = (c, i) => CHARGE + c.go + Math.max(0, TX - 24 - (i % 3) * 3 - c.x) / SPEED;
const LAST = Math.max(...CLONES.map(arrive));

export const meta = {
  name: "Multiple shadow clones",
  desc: "Naruto: the cross-shaped clone seal, a wave of smoke puffs and a crowd of Narutos in two rows, who rush the target, land a blow each and burst back into smoke.",
  tags: ["jutsu", "naruto", "clone", "move", "melee", "one-shot"],
  size: [330, 150],
  origin: [80, 118],
  duration: LAST + 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a2a1a", "#ff8a1c", "#ffc070", "#fff0d0"], seed: 24 },
};

const RUN = (ph, x) => ({ ...READY, x, crouch: 7, lean: 13, fx: 12 + 4 * Math.sin(ph + 1.6), fy: -23, bx: -6 - 4 * Math.sin(ph + 1.6), by: -21, ffx: 11 * Math.sin(ph), fbx: -11 * Math.sin(ph), ffy: Math.max(0, Math.cos(ph)) * -4, fby: Math.max(0, -Math.cos(ph)) * -4 });
const PUNCH = (x, i) => (i % 2
  ? { ...READY, x, crouch: 5, lean: 12, fx: 20, fy: -27, bx: -8, by: -20, ffx: 12, fbx: -10 }
  : { ...READY, x, crouch: 2, lean: -8, fx: -4, fy: -26, bx: 8, by: -28, ffx: 18, ffy: -22, fbx: -5 });

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [LAST - 0.1, { ...SEALS.keys[0][1], crouch: 5 }],
    [LAST + 0.3, READY],
    [meta.duration, READY],
  ],
  hits: CLONES.map((c, i) => ({ t: arrive(c, i), stop: i === 4 ? 0.1 : 0.03, shake: i === 4 ? 0.2 : 0.08, amp: 1, flash: i === 4 ? 0.05 : 0, push: 1 + (i % 3) * 0.5, straw: 8 })).sort((a, b) => a.t - b.t),
};

// a clone at time t: its pose and whether it's still there
function cloneAt(c, i, t) {
  const t0 = SPAWN + c.d, go = CHARGE + c.go, hit = arrive(c, i);
  if (t < t0 + 0.06 || t > hit + 0.14) return null;
  if (t < go) {
    const up = Math.floor((t - t0) * 3 + i) & 1;
    return { ...READY, x: c.x, crouch: 3 + up, fx: 11, fy: -21 + up, bx: 9, by: -21 + up };
  }
  if (t < hit) return RUN((t - go) * 16 + i, c.x + (t - go) * SPEED);
  return PUNCH(TX - 24 - (i % 3) * 3, i);
}

export const create = play(
  CLONES.map((c, i) => ({ fx: spark, t: arrive(c, i), x: TX - 12, height: 20 + (i % 3) * 4, aim: 0.1 * ((i % 3) - 1), seed: 30 + i })),
  (o) => {
    const C = fit(o.palette, 4), BG = hex("#1a1626");
    const each = (p, t, row) =>
      CLONES.forEach((c, i) => {
        if (c.row !== row) return;
        const q = cloneAt(c, i, t), y = row ? -3 : 0;
        if (q) drawFigure(p, q, q.x ?? 0, y, row ? { tint: BG, k: 0.32 } : {});
        drawPoof(p, c.x, y - 18, t - SPAWN - c.d, 1, i + 1);
        drawPoof(p, TX - 18 - (i % 3) * 3, y - 20, t - arrive(c, i) - 0.12, 0.9, i + 11);
      });
    return {
      drawBack(p, t) {
        each(p, t, 1);
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C);
        const b = bodyAt(act.poses, t);
        drawBadge(p, t, { kind: "uzumaki", t0: 0.05, t1: SPAWN + 0.3, label: "KAGE BUNSHIN", head: b.head });
        each(p, t, 0);
        // a count of the crowd as it fills: the clones tallied over his head
        const n = CLONES.filter((c) => t >= SPAWN + c.d + 0.06).length;
        if (n && t < CHARGE + 0.2) {
          const k = 1 - smooth(CHARGE, CHARGE + 0.2, t);
          p.text(`x${n}`, 6, -50, n === CLONES.length && t - SPAWN - 0.29 < 0.05 ? WHITE : C[1], { font: "big", outline: hex("#120c18"), align: "center", a: k });
        }
      },
    };
  },
);
