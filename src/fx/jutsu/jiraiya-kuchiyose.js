// Kuchiyose no Jutsu (Summoning, Jiraiya). Narutopedia: seals Boar, Dog, Bird, Monkey, Ram; the summoner signs a
// contract in blood, so a drop of their own blood is offered and the hand is pressed to the ground, where the formula
// spreads out and the summon arrives in a great cloud of smoke. Jiraiya's is the toad boss Gamabunta: a giant red-brown
// toad with a scarred eye, a pipe and a short blue coat, the summoner standing on his head. Here: the five seals, the
// thumb bitten, the palm slammed down, the black lines of the formula racing out, a vast cloud of smoke, and Gamabunta
// sitting in it with Jiraiya on his head; he leaps and lands by the target with a quake, then goes in a puff.
// New: the toad (drawn here from shapes, with an ink outline), the formula, the summoner riding (drawFigure).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import * as quake from "../impacts/ground-slam.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["i", "inu", "tori", "saru", "hitsuji"], 0.1, { hold: 0.2 });
const BITE = SEALS.end, SLAM = BITE + 0.22, SMOKE = SLAM + 0.3, TOAD = SMOKE + 0.12, LEAP = TOAD + 0.9, LAND = LEAP + 0.45, BYE = LAND + 0.9, TX = 230, X0 = 64, X1 = TX - 66;

export const meta = {
  name: "Summoning: Gamabunta",
  desc: "Jiraiya: Boar, Dog, Bird, Monkey, Ram, a bitten thumb, the palm slammed down, the summoning formula racing out, and Gamabunta in a cloud of smoke with Jiraiya on his head; the toad leaps and lands by the target with a quake.",
  tags: ["jutsu", "jiraiya", "summoning", "toad", "move", "aoe", "one-shot"],
  size: [392, 222],
  origin: [52, 190],
  duration: LAND + 3.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1408", "#7a2a18", "#b0482a", "#e08a50", "#ffd0a0"], seed: 29 },
};

// he's on the toad's head from the smoke until the toad goes: drawn riding it, so the stock body steps out
export const actorAlpha = (t) => (t >= TOAD && t < BYE + 0.05 ? 0 : 1);

const BITEP = { ...READY, crouch: 3, fx: 6, fy: -31, bx: 9, by: -22, ffx: 7, fbx: -7 };
const PRESS = { ...READY, crouch: 14, lean: 14, fx: 15, fy: -2, bx: 6, by: -14, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [BITE + 0.06, BITEP, "snap"],
    [SLAM, PRESS, "in"],
    [TOAD, { ...PRESS, crouch: 12 }],
    [BYE + 0.05, { ...READY, x: X1 - 6 }, "snap"],
    [BYE + 0.4, { ...READY, x: X1 - 6, crouch: 6 }],
    [meta.duration, { ...READY, x: X1 - 6 }],
  ],
  hits: [
    { t: SLAM, stop: 0.06, shake: 0.12, amp: 1, target: false },
    { t: SMOKE, stop: 0.1, shake: 0.4, amp: 3, target: false },
    { t: LAND, stop: 0.18, shake: 0.6, amp: 5, push: 4, straw: 30 },
  ],
  dust: [{ t: SLAM, x: 14, n: 6 }],
};

// where the toad is: sits at X0, leaps in an arc and lands at X1; s: squash (1 normal)
function toadAt(t) {
  if (t < LEAP) return { x: X0, y: 0, sq: 1 + 0.08 * Math.max(0, 1 - (t - TOAD) * 4) - (t > LEAP - 0.15 ? 0.12 * smooth(LEAP - 0.15, LEAP, t) : 0) };
  if (t < LAND) {
    const u = (t - LEAP) / (LAND - LEAP);
    return { x: X0 + (X1 - X0) * u, y: -Math.sin(Math.PI * u) * 46, sq: 1.1 };
  }
  return { x: X1, y: 0, sq: 1 - 0.14 * Math.exp(-(t - LAND) * 10) };
}

// Gamabunta, feet at (x, y), facing right; sq squashes him (wider and lower)
function drawToad(p, x, y, sq, t) {
  const INK = hex("#1a0c08"), BODY = hex("#b0482a"), DARK = hex("#7a2a18"), BELLY = hex("#e0a070"), WART = hex("#8a3420"), VEST = hex("#2a3a6a"), VEST2 = hex("#3e5494"), EYE = hex("#f2c842");
  const sx = 1 / Math.sqrt(sq), sy = sq < 1 ? sq : 1 / sq ** 0.5 * sq;
  const X = (v) => x + v * (2 - sy), Y = (v) => y + v * sy, ol = (fn) => fn(1, INK);
  // haunches and legs behind, then the body, belly, coat, head, eyes, mouth and pipe
  for (const pass of [0, 1]) {
    const c = (base) => (pass ? base : INK), g = pass ? 0 : 1.2;
    p.ellipse(X(-28), Y(-12), 16 + g, 12 + g, c(DARK));
    p.ellipse(X(-34), Y(-2), 12 + g, 3 + g, c(DARK));
    p.ellipse(X(0), Y(-26), 38 + g, 24 + g, c(BODY));
    p.ellipse(X(26), Y(-6), 7 + g, 7 + g, c(BODY));
    p.ellipse(X(32), Y(-1), 7 + g, 2.5 + g, c(DARK));
    p.circle(X(-10), Y(-48), 8 + g, c(BODY));
    p.circle(X(12), Y(-49), 8 + g, c(BODY));
  }
  p.ellipse(X(10), Y(-14), 22, 11, BELLY);
  // the short blue coat over his back
  p.shade(X(-40), Y(-52), X(10), Y(-8), (px, py) => {
    const dx = (px - X(0)) / 38, dy = (py - Y(-26)) / (24 * sy);
    if (dx * dx + dy * dy > 1 || px > X(-6) + (py - Y(-26)) * 0.8) return;
    return (px - x) % 7 < 1 ? VEST2 : VEST;
  });
  for (const [a, b, r] of [[-6, -34, 2], [6, -38, 1.5], [18, -30, 1.6], [-2, -20, 1.4]]) p.circle(X(a), Y(b), r, WART);
  // the eyes, horizontal pupils, the scar down the left one
  for (const ex of [-10, 12]) {
    p.circle(X(ex), Y(-49), 5, EYE);
    p.rect(X(ex) - 3, Y(-49) - 0.5, 6, 2, INK);
    p.px(X(ex) - 2, Y(-51), WHITE);
  }
  p.line(X(-14), Y(-56), X(-6), Y(-42), INK);
  p.line(X(-13), Y(-56), X(-5), Y(-42), hex("#d86a50"));
  // the mouth, wide and grim, and the pipe stuck in the corner of it with smoke curling up
  p.line(X(-6), Y(-30), X(36), Y(-28), INK);
  p.line(X(30), Y(-28), X(46), Y(-38), hex("#5a3a20"));
  p.rect(X(44), Y(-44), 4, 6, hex("#3a2414"));
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.9 + i / 3) % 1);
    p.disc(X(46) + Math.sin(u * 6 + i) * 3, Y(-46) - u * 16, 2 + u * 3, hex("#d8d8e0"), 0.5 * (1 - u));
  }
}

export const create = play([{ fx: quake, t: LAND, x: X1 + 30, reach: 130, light: 0.6 }], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed + 3), ps = new Particles({ rng: R, ground: () => 0 }), INK = hex("#120c18");
  let smoked = false;
  return {
    update(t, dt) {
      if (!smoked && t >= SMOKE) {
        smoked = true;
        for (let i = 0; i < 24; i++) ps.spawn(P.SMOKE, X0 + R.range(-40, 40), -R.range(4, 70), R.range(-40, 40), -R.range(4, 30), R.range(0.8, 1.4), hex("#e6e8f0"), R.range(5, 9));
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      // the formula: black lines of script racing out over the ground from his palm
      if (t > SLAM && t < TOAD + 0.6) {
        const k = ease.outCubic(clamp((t - SLAM) / 0.22)), fade = 1 - smooth(TOAD, TOAD + 0.6, t);
        for (let i = 0; i < 9; i++) {
          const a = Math.PI * (i / 8), L = 50 * k, dx = Math.cos(a) * L, dy = Math.sin(a) * L * 0.12;
          p.line(16, 0, 16 + dx, dy, INK, fade);
          for (let s = 8; s < L; s += 7) p.px(16 + Math.cos(a) * s + 1, Math.sin(a) * s * 0.12 - 1, INK);
        }
        p.ellipse(16, 0.5, 12 * k, 2, INK, fade);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "summon", t0: 0.05, t1: SEALS.end, label: "KUCHIYOSE", head: b.head });
      // the bitten thumb: a bead of blood
      if (t > BITE + 0.06 && t < SLAM + 0.1) p.px(b.handN[0] + 1, b.handN[1] - 1, hex("#e01828"));
      if (t >= TOAD && t < BYE + 0.1) {
        const T = toadAt(t);
        drawToad(p, T.x, T.y, T.sq, t);
        // the summoner on his head, arms folded, swaying with him
        const sit = t > LEAP && t < LAND ? { ...READY, crouch: 8, lean: 6, fx: 9, fy: -24, bx: 11, by: -24 } : { ...READY, crouch: 1, armsFront: true, fx: 6, fy: -24, bx: 8, by: -25 };
        drawFigure(p, sit, T.x, T.y - 56 * (T.sq < 1 ? T.sq : 1), {});
      }
      for (let i = 0; i < 5; i++) drawPoof(p, X0 - 30 + i * 15, -20 - (i % 2) * 24, t - SMOKE - i * 0.03, 3.2, i + 1);
      drawPoof(p, X1, -30, t - BYE, 3.4, 9);
      drawPoof(p, X1 + 30, -16, t - BYE - 0.04, 2.4, 10);
      ps.draw(p, "front");
    },
  };
});
