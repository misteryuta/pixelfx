// Kuchiyose no Jutsu (Summoning, Jiraiya). Narutopedia: seals Boar, Dog, Bird, Monkey, Ram; the summoner signs a
// contract in blood, so a drop of their own blood is offered and the hand is pressed to the ground, where the formula
// spreads out and the summon arrives in a great cloud of smoke. Jiraiya's is the toad boss Gamabunta: a giant red-brown
// toad with a scarred eye, a pipe and a short blue coat, the summoner standing on his head. Here: the five seals, the
// thumb bitten, the palm slammed down, the black lines of the formula racing out, a vast cloud of smoke, and Gamabunta
// sitting in it with Jiraiya on his head. Then their combination (Katon: Gamayu Endan, Toad Oil Flame Bullet, after the
// reference): Gamabunta draws breath, his belly swelling, and spits a long stream of oil at the target; on his head
// Jiraiya makes the Tiger seal and breathes fire into it; the flame catches at the toad's lips and races down the oil
// into a roaring river of fire that hits the target and goes up in a blast of fire and black oil smoke, burning oil
// spattered across the ground. The toad goes in a puff and Jiraiya drops down.
// New: the toad (drawn here from shapes, with an ink outline), the formula, the summoner riding (drawFigure), the oil
// stream and the fire running down it, the oil-and-fire blast (blast() from _lib with sooty smoke, burning puddles).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof, blast, impactFrame, SIGNS } from "./_lib.js";
import { noise2, rand } from "../../core/index.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["i", "inu", "tori", "saru", "hitsuji"], 0.1, { hold: 0.2 });
const BITE = SEALS.end, SLAM = BITE + 0.22, SMOKE = SLAM + 0.3, TOAD = SMOKE + 0.12, INHALE = TOAD + 0.55, SPIT = INHALE + 0.5, BREATH = SPIT + 0.18, IGN = BREATH + 0.08;
const OILT = 0.32, BURN = 0.3, HIT = IGN + BURN, STOP = HIT + 0.9, BYE = STOP + 0.5, TX = 250, X0 = 64;
const FIRE = ["#1a0804", "#4a1206", "#9a2a08", "#e0600c", "#ffa020", "#ffe070", "#fffbe0"].map(hex);
const OIL = ["#140a04", "#2e1a08", "#4e3010", "#8a6a30"].map(hex), SOOT = [hex("#141016"), hex("#2a2428"), hex("#4a4246")];

export const meta = {
  name: "Summoning: Gamabunta",
  desc: "Jiraiya: the summoning seals, Gamabunta in a cloud of smoke with Jiraiya on his head; the toad spits a stream of oil, Jiraiya breathes fire into it, and the burning oil roars into the target in a blast of fire and black smoke.",
  tags: ["jutsu", "jiraiya", "summoning", "toad", "move", "aoe", "one-shot"],
  size: [400, 230],
  origin: [52, 198],
  duration: HIT + 3.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1408", "#7a2a18", "#b0482a", "#e08a50", "#ffd0a0"], seed: 29 },
};

// he's on the toad's head from the smoke until the toad goes: drawn riding it, so the stock body steps out
export const actorAlpha = (t) => (t >= TOAD && t < BYE + 0.05 ? 0 : 1);
// he rides the toad: the Tiger seal on its head, then the breath of fire
const RIDE = { ...READY, crouch: 1, armsFront: true, fx: 6, fy: -24, bx: 8, by: -25 };
const ridePose = (t) => (t > INHALE + 0.1 && t < BREATH ? { ...SIGNS.tora.pose, fx: 7, fy: -29, bx: 8, by: -29 } : t >= BREATH && t < STOP ? { ...READY, crouch: 3, lean: 5, fx: 7, fy: -30, bx: 8, by: -28 } : RIDE);
const MOUTH_J = [6, -31];

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
    [BYE + 0.05, { ...READY, x: X0 - 4 }, "snap"],
    [BYE + 0.4, { ...READY, x: X0 - 4, crouch: 6 }],
    [meta.duration, { ...READY, x: X0 - 4 }],
  ],
  hits: [
    { t: SLAM, stop: 0.06, shake: 0.12, amp: 1, target: false },
    { t: SMOKE, stop: 0.1, shake: 0.4, amp: 3, target: false },
    { t: SPIT, stop: 0.04, shake: 0.15, amp: 1, target: false },
    { t: IGN, stop: 0.06, shake: 0.2, amp: 2, target: false },
    { t: HIT, stop: 0.2, shake: 0.7, amp: 5, push: 5, straw: 40, skin: "char", sfx: "explosion" },
    ...[0.3, 0.6, 0.9].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 0.8, straw: 6, shiver: 0.4 })),
    { t: HIT + 3.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SLAM, x: 14, n: 6 }, { t: BYE + 0.05, x: X0 - 4, n: 8 }],
};

// where the toad is: sits at X0, leaps in an arc and lands at X1; s: squash (1 normal)
function toadAt(t) {
  // lands in the smoke, settles; draws breath (belly up), heaves forward as it spits
  const land = 0.08 * Math.max(0, 1 - (t - TOAD) * 4), breath = smooth(INHALE, SPIT, t) * (1 - smooth(SPIT, SPIT + 0.15, t)), heave = smooth(SPIT, SPIT + 0.1, t) * (1 - smooth(STOP - 0.1, STOP + 0.2, t));
  return { x: X0 + 3 * heave, y: 0, sq: 1 + land - 0.1 * breath + 0.06 * heave, belly: breath, open: heave };
}
// the toad's lips, where the oil leaves
const lipsAt = (t) => {
  const T = toadAt(t), sy = T.sq < 1 ? T.sq : (1 / T.sq ** 0.5) * T.sq;
  return [T.x + 40 * (2 - sy), T.y - 29 * sy];
};
// the oil's path: a long sag from the lips onto the target
const oilAt = (t, u) => {
  const M = lipsAt(t), E = [TX - 8, -26];
  return [M[0] + (E[0] - M[0]) * u, M[1] + (E[1] - M[1]) * u + Math.sin(Math.PI * u) * 12];
};

// Gamabunta, feet at (x, y), facing right; sq squashes him (wider and lower)
function drawToad(p, x, y, sq, t, belly = 0, open = 0) {
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
  p.ellipse(X(10), Y(-14), 22 + 4 * belly, 11 + 4 * belly, BELLY);
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
  if (open > 0.05) p.poly([[X(-4), Y(-30)], [X(40), Y(-31 - 3 * open)], [X(40), Y(-27 + 4 * open)], [X(-2), Y(-28)]], hex("#3a0e08"));
  p.line(X(-6), Y(-30), X(36), Y(-28 - 3 * open), INK);
  if (open < 0.3) p.line(X(30), Y(-28), X(46), Y(-38), hex("#5a3a20"));
  if (open < 0.3) p.rect(X(44), Y(-44), 4, 6, hex("#3a2414"));
  for (let i = 0; i < (open < 0.3 ? 3 : 0); i++) {
    const u = ((t * 0.9 + i / 3) % 1);
    p.disc(X(46) + Math.sin(u * 6 + i) * 3, Y(-46) - u * 16, 2 + u * 3, hex("#d8d8e0"), 0.5 * (1 - u));
  }
}

export const create = play([], (o) => {
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
      blast(p, t - HIT, { x: TX - 6, y: 0, R: 40, C: FIRE, seed: 3, layer: "back", smoke: SOOT });
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "summon", t0: 0.05, t1: SEALS.end, label: "KUCHIYOSE", head: b.head });
      // the bitten thumb: a bead of blood
      if (t > BITE + 0.06 && t < SLAM + 0.1) p.px(b.handN[0] + 1, b.handN[1] - 1, hex("#e01828"));
      let J = null;
      if (t >= TOAD && t < BYE + 0.1) {
        const T = toadAt(t);
        drawToad(p, T.x, T.y, T.sq, t, T.belly, T.open);
        // the summoner on his head: arms folded, the Tiger seal, then leaning in to breathe fire
        J = [T.x, T.y - 56 * (T.sq < 1 ? T.sq : 1)];
        drawFigure(p, ridePose(t), J[0], J[1], {});
        if (t > INHALE + 0.15 && t < BREATH) p.text("KATON: GAMAYU ENDAN", J[0] + 6, J[1] - 52, FIRE[5], { font: "mini", align: "center", outline: hex("#1a0804") });
      }
      // the oil: pours from the lips and runs out to the target; it stops pouring and the tail flies on
      if (t > SPIT && t < STOP + 0.6) {
        const head = clamp((t - SPIT) / OILT), tail = clamp((t - STOP) / 0.4), fire = clamp((t - IGN) / BURN), N = 60;
        for (let i = 0; i < N; i++) {
          const u0 = i / N, u1 = (i + 1) / N;
          if (u1 > head || u0 < tail) continue;
          const [x0, y0] = oilAt(t, u0), [x1, y1] = oilAt(t, u1), w = 5 + 4 * u0 + Math.sin(u0 * 30 - t * 25) * 1.2;
          if (u0 < fire) continue;
          p.beam(x0, y0, x1, y1, w + 1.2, OIL[0]);
          p.beam(x0, y0, x1, y1, w, OIL[1]);
          p.line(x0, y0 - w * 0.25, x1, y1 - w * 0.25, i % 4 ? OIL[2] : OIL[3]);
        }
        // the fire running down it: a river of billowing flame, hottest at its leading edge, sooty on top
        for (let i = 0; i < N; i++) {
          const u = i / N;
          if (u > fire || u > head || u < tail) continue;
          const [x, y] = oilAt(t, u), r = 8 + 15 * u + 4 * noise2(u * 9, t * 6, 3), front = fire < 1 && fire - u < 0.08;
          p.disc(x, y - r * 0.4, r * 1.1, SOOT[1], (d) => (d > 0.6 ? 0.5 : 0));
          p.disc(x, y, r, (d, a) => {
            const n = noise2(x * 0.15 + Math.cos(a), y * 0.15 - t * 6, 7) * 0.3, v = 1 - d + n + (front ? 0.4 : 0);
            return v > 0.95 ? FIRE[6] : v > 0.7 ? FIRE[5] : v > 0.45 ? FIRE[4] : v > 0.25 ? FIRE[3] : FIRE[2];
          }, 1);
        }
        if (fire > 0 && tail < 1) p.glowLine(...oilAt(t, Math.max(tail, 0.02)), ...oilAt(t, Math.min(fire, head)), 30, FIRE[4], 0.6);
      }
      // Jiraiya's breath of fire: from his mouth down into the oil at the toad's lips
      if (J && t > BREATH && t < STOP) {
        const m = [J[0] + MOUTH_J[0], J[1] + MOUTH_J[1]], tgt = oilAt(t, 0.06), k = smooth(BREATH, BREATH + 0.06, t), L = k;
        const ex = m[0] + (tgt[0] - m[0]) * L, ey = m[1] + (tgt[1] - m[1]) * L;
        p.glowLine(m[0], m[1], ex, ey, 18, FIRE[4], 0.6);
        // a cone of flame from his lips, puffs widening and boiling as they go
        for (let i = 0; i <= 24; i++) {
          const u = (i / 24) * L, x = m[0] + (ex - m[0]) * (i / 24) + noise2(i * 0.4, t * 12, 2) * 2 * u, y = m[1] + (ey - m[1]) * (i / 24) - 2 * u, r = 2.5 + 8 * u * (0.8 + 0.4 * noise2(i * 0.3, t * 10, 5));
          p.disc(x, y, r, (d) => (d < 0.35 ? FIRE[6] : d < 0.65 ? FIRE[5] : FIRE[4]), 1);
        }
      }
      // the blast where it meets the target: oil and fire, then burning oil spattered over the ground
      const age = t - HIT;
      blast(p, age, { x: TX - 6, y: 0, R: 40, C: FIRE, seed: 3, smoke: SOOT, rock: [OIL[0], OIL[1], OIL[2], FIRE[3]] });
      if (age >= 0 && age < 0.05) p.circle(TX - 6, -26, 30, FIRE[6]);
      if (age > 0.2 && age < 2.8) {
        const k = smooth(0.2, 0.5, age) * (1 - smooth(2.2, 2.8, age));
        for (let i = 0; i < 9; i++) {
          const x = TX - 70 + i * 17 + (rand(i, 8) - 0.5) * 8, h = (5 + 7 * rand(i, 9)) * k * (0.8 + 0.3 * Math.sin(t * 12 + i));
          p.ellipse(x, 0, 7, 1.5, OIL[0], k);
          p.tri(x - 4, 0, x + 4, 0, x + Math.sin(t * 9 + i) * 2, -h, FIRE[3], k);
          p.tri(x - 2, 0, x + 2, 0, x + Math.sin(t * 9 + i) * 1.5, -h * 0.6, FIRE[5], k);
        }
      }
      for (let i = 0; i < 5; i++) drawPoof(p, X0 - 30 + i * 15, -20 - (i % 2) * 24, t - SMOKE - i * 0.03, 3.2, i + 1);
      drawPoof(p, X0, -30, t - BYE, 3.4, 9);
      drawPoof(p, X0 + 30, -16, t - BYE - 0.04, 2.4, 10);
      ps.draw(p, "front");
    },
  };
});
