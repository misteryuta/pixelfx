// Uzumaki Naruto Rendan (Naruto Uzumaki Combo). Narutopedia: Naruto makes four shadow clones; they kick the target
// one after another, each shouting a syllable, "U-ZU-MA-KI", and the real Naruto, leaping off a clone, comes down on it
// with "Naruto Rendan!" Here: four clones poof in and dart to both sides of the target, four kicks with the syllables
// slamming up in big letters, then Naruto vaults high and drops a heel onto its head, the clones bursting into smoke.
// New: the four clones and their kicks (posed bodies), the shouted letters, the heel drop's crater ring. From the
// library: the hit spark on every kick, the heavy landing under the finisher.
import { Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import * as landing from "../impacts/heavy-landing.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["juuji"], 0.12, { hold: 0.3 });
const POOF = SEALS.end, DART = POOF + 0.3, K0 = DART + 0.26, KG = 0.2, VAULT = K0 + 3 * KG + 0.08, TOP = VAULT + 0.3, DROP = TOP + 0.14, TX = 150;
const SYL = ["U", "ZU", "MA", "KI"];
// the clones: side (-1 in front of the target, 1 behind it), where they wait, where they kick from
const CL = [
  { side: -1, x0: 22, kx: TX - 24 },
  { side: 1, x0: 34, kx: TX + 24 },
  { side: -1, x0: 12, kx: TX - 20 },
  { side: 1, x0: 44, kx: TX + 20 },
];
const kickT = (i) => K0 + i * KG;

export const meta = {
  name: "Naruto Uzumaki combo",
  desc: "Naruto: four shadow clones dart to both sides of the target and kick it in turn, U-ZU-MA-KI, then the real one vaults high off them and drops a heel onto its head.",
  tags: ["jutsu", "naruto", "clone", "move", "melee", "combo", "one-shot"],
  size: [300, 190],
  origin: [60, 150],
  duration: DROP + 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a1a08", "#c3202a", "#ff8a1c", "#ffc070", "#fff0d0"], seed: 25 },
};

const AIR = { ...READY, x: TX - 30, y: -64, crouch: 0, lean: -6, fx: -8, fy: -28, bx: 7, by: -33, ffx: 9, ffy: -36, fbx: -5, fby: -3 };
const HEEL = { ...READY, x: TX - 15, y: -34, crouch: 2, lean: 10, fx: -6, fy: -26, bx: 8, by: -30, ffx: 15, ffy: -16, fbx: -6, fby: -2 };
export const act = {
  target: { x: TX },
  ghost: "#ffb050",
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [DART, { ...READY, crouch: 5 }],
    [VAULT - 0.05, { ...READY, x: TX - 70, crouch: 9, lean: 10, fx: 12, fy: -20, bx: -6, by: -18, ffx: 10, fbx: -10, ghost: true }, "in"],
    [VAULT + 0.05, { ...READY, x: TX - 56, y: -30, crouch: 1, lean: 2, fx: 4, fy: -36, bx: 9, by: -34, ffx: 4, ffy: -8, fbx: -6, fby: -2 }, "out"],
    [TOP, AIR, "out"],
    [DROP, HEEL, "in"],
    [DROP + 0.12, { ...READY, x: TX - 26, y: 0, crouch: 11, lean: 6, fx: 10, fy: -12, bx: -4, by: -16, ffx: 10, fbx: -9 }, "in"],
    [DROP + 0.9, { ...READY, x: TX - 30 }],
    [meta.duration, { ...READY, x: TX - 30 }],
  ],
  hits: [
    ...SYL.map((s, i) => ({ t: kickT(i), stop: 0.05, shake: 0.08, amp: 1, push: i % 2 ? -1.6 : 1.6, straw: 8, flash: 0 })),
    { t: DROP, stop: 0.18, shake: 0.45, amp: 4, push: 3.5, straw: 34 },
  ],
  dust: [{ t: VAULT - 0.05, x: TX - 70, n: 8, dir: -1 }, { t: DROP + 0.12, x: TX - 26, n: 10 }],
};

function cloneAt(c, i, t) {
  const t0 = POOF + i * 0.04, k = kickT(i);
  if (t < t0 + 0.06 || t > DROP + 0.1) return null;
  const face = c.side < 0 ? 1 : -1;
  if (t < DART + i * 0.03) return { q: { ...READY, crouch: 4 }, x: c.x0, face };
  // dart in, low; then the kick, up into the target; then hold it there, panting, until the finisher
  const u = clamp((t - DART - i * 0.03) / 0.22), x = c.x0 + (c.kx - c.x0) * ease.inOutQuad(u);
  if (t < k - 0.06) return { q: { ...READY, crouch: 8, lean: 12, fx: 12, fy: -20, bx: -6, by: -18, ffx: 10, fbx: -10 }, x, face };
  if (t < k + 0.18) return { q: { ...READY, crouch: 1, lean: -10, fx: -6, fy: -27, bx: 8, by: -31, ffx: 17, ffy: -24 - (i % 2) * 6, fbx: -4 }, x: c.kx, face };
  return { q: { ...READY, crouch: 6, lean: 4, fx: 10, fy: -20, bx: 8, by: -22 }, x: c.kx, face };
}

export const create = play(
  [
    ...SYL.map((s, i) => ({ fx: spark, t: kickT(i), x: CL[i].side < 0 ? TX - 10 : TX + 10, flip: CL[i].side > 0, height: 24 + i * 4, aim: -0.4, seed: 40 + i, palette: ["#3a1a08", "#c3202a", "#ff8a1c", "#ffc070", "#fff0d0", "#ffffff", "#ffffff"] })),
    { fx: landing, t: DROP + 0.12, x: TX - 20 },
  ],
  (o) => {
    const C = fit(o.palette, 5), INK = hex("#120c18");
    return {
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(1));
        const b = bodyAt(act.poses, t);
        drawBadge(p, t, { kind: "uzumaki", t0: 0.05, t1: POOF + 0.15, label: "UZUMAKI", head: b.head });
        CL.forEach((c, i) => {
          const s = cloneAt(c, i, t);
          if (s) drawFigure(p, s.q, s.x, 0, { face: s.face });
          drawPoof(p, c.x0, -18, t - POOF - i * 0.04, 1, i + 2);
          drawPoof(p, c.kx, -18, t - DROP - 0.1, 1, i + 7);
        });
        // the shouted syllables: slammed up big over each kick, shaking, then sliding up and away
        SYL.forEach((s, i) => {
          const a = t - kickT(i);
          if (a < 0 || a > 0.55) return;
          const pop = ease.outBack(clamp(a / 0.1), 3), x = TX + (CL[i].side < 0 ? -30 : 26) + (a < 0.12 ? Math.round(Math.sin(a * 90)) : 0), y = -70 - i * 6 - 10 * smooth(0.3, 0.55, a);
          p.text(s, x, y, a < 0.05 ? WHITE : C[2], { font: "big", scale: Math.max(1, Math.round(2 * pop)), align: "center", outline: INK, a: a > 0.45 ? 0 : 1 });
        });
        // the finisher's name over the drop
        const a = t - DROP;
        if (a > -0.1 && a < 1.0) {
          const k = clamp((a + 0.1) / 0.12) * (1 - smooth(0.75, 1.0, a));
          if (k > 0.5) p.text("NARUTO RENDAN!", TX - 16, -96 - 3 * (1 - clamp((a + 0.1) / 0.12)), a < 0.04 && a > -0.02 ? WHITE : C[3], { font: "big", align: "center", outline: INK });
        }
        if (a > 0 && a < 0.4) {
          const u = a / 0.4;
          p.ring(TX - 2, -50, 6 + 22 * ease.outCubic(u), 1, u < 0.3 ? WHITE : C[3], 1 - u);
          p.ellipse(TX - 6, 0, 10 + 40 * ease.outCubic(u), 2, C[2], 0.7 * (1 - u));
        }
      },
    };
  },
);
