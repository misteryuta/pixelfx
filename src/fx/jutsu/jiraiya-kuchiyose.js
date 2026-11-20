// Kuchiyose no Jutsu (Summoning, Jiraiya). Narutopedia: seals Boar, Dog, Bird, Monkey, Ram; the summoner signs a
// contract in blood, so a drop of their own blood is offered and the hand is pressed to the ground, where the formula
// spreads out and the summon arrives in a great cloud of smoke. Jiraiya's is the toad boss Gamabunta: a giant red-brown
// toad with a scarred eye, a pipe and a short blue coat, the summoner standing on his head. Here: the five seals, the
// thumb bitten, the palm slammed down, the black lines of the formula racing out, a vast cloud of smoke, and Gamabunta
// sitting in it with Jiraiya on his head. Then their combination (Katon: Gamayu Endan, Toad Oil Flame Bullet, after the
// reference): the toad (red, mottled with dark teal, yellow eyes, tongue out, a necklace of blue beads with the round
// medallion of loyalty) draws breath and spits a gob of oil in an arc that splashes down and spreads into a pool round
// the target's feet; on his head Jiraiya makes the Tiger seal and breathes a stream of fire into the pool; it catches,
// flame races across the oil, and the whole pool goes up in a blast of fire and black oil smoke, burning oil left
// spattered on the ground. The toad goes in a puff and Jiraiya drops down.
// New: the toad (drawn here from shapes, with an ink outline), the formula, the summoner riding (drawFigure), the oil
// stream and the fire running down it, the oil-and-fire blast (blast() from _lib with sooty smoke, burning puddles).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof, blast, impactFrame, SIGNS } from "./_lib.js";
import { noise2, rand } from "../../core/index.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["i", "inu", "tori", "saru", "hitsuji"], 0.1, { hold: 0.2 });
const BITE = SEALS.end, SLAM = BITE + 0.22, SMOKE = SLAM + 0.3, TOAD = SMOKE + 0.12, INHALE = TOAD + 0.55, SPIT = INHALE + 0.5;
const OILT = 0.42, POUR = 0.3, POOL0 = SPIT + 0.38, POOL1 = SPIT + 0.8, BREATH = SPIT + 0.95, FLY = 0.32, IGN = BREATH + FLY, BURN = 0.16, HIT = IGN + BURN;
const STOP = HIT + 0.5, BYE = STOP + 0.5, TX = 250, X0 = 64, POOLR = 26;
const FIRE = ["#1a0804", "#4a1206", "#9a2a08", "#e0600c", "#ffa020", "#ffe070", "#fffbe0"].map(hex);
const OIL = ["#140a04", "#2e1a08", "#4e3010", "#8a6a30"].map(hex), SOOT = [hex("#141016"), hex("#2a2428"), hex("#4a4246")];

export const meta = {
  name: "Summoning: Gamabunta",
  desc: "Jiraiya: the summoning seals, the toad in a cloud of smoke with Jiraiya on his head; it spits oil into a pool under the target's feet, Jiraiya breathes fire into it, and the pool goes up in a blast of fire and black smoke.",
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
const ridePose = (t) => (t > INHALE + 0.1 && t < BREATH ? { ...SIGNS.tora.pose, fx: 7, fy: -29, bx: 8, by: -29 } : t >= BREATH - 0.1 && t < HIT + 0.2 ? { ...READY, crouch: 3, lean: 5, fx: 7, fy: -30, bx: 8, by: -28 } : RIDE);
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
    { t: SPIT, stop: 0.04, shake: 0.15, amp: 1, target: false, sfx: "whoosh" },
    { t: POOL0, flash: 0, push: 0.3, straw: 2 },
    { t: BREATH, target: false, sfx: "cast" },
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
  const land = 0.08 * Math.max(0, 1 - (t - TOAD) * 4), breath = smooth(INHALE, SPIT, t) * (1 - smooth(SPIT, SPIT + 0.15, t)), heave = smooth(SPIT, SPIT + 0.1, t) * (1 - smooth(SPIT + POUR, SPIT + POUR + 0.2, t));
  return { x: X0 + 3 * heave, y: 0, sq: 1 + land - 0.1 * breath + 0.06 * heave, belly: breath, open: heave };
}
// the toad's lips, where the oil leaves
const lipsAt = (t) => {
  const T = toadAt(t), sy = T.sq < 1 ? T.sq : (1 / T.sq ** 0.5) * T.sq;
  return [T.x + 40 * (2 - sy), T.y - 29 * sy];
};
// the oil's path: a long sag from the lips onto the target
const oilAt = (t, u) => {
  const M = lipsAt(t), E = [TX - 2, -1];
  return [M[0] + (E[0] - M[0]) * u, M[1] + (E[1] - M[1]) * u - Math.sin(Math.PI * u) * 46];
};

// Gamabunta, feet at (x, y), facing right; sq squashes him (wider and lower)
function drawToad(p, x, y, sq, t, belly = 0, open = 0) {
  const INK = hex("#1a0c08"), BODY = hex("#e0583a"), LITE = hex("#f28a62"), SHADE = hex("#b03a26"), DEEP = hex("#7a2418"), MARK = hex("#1e4a50"), MARK2 = hex("#2e6a6e");
  const EYE = hex("#f2c842"), TONGUE = hex("#f0a0a8"), BEAD = hex("#5a78c8"), BEADL = hex("#a8c0f0"), MED = hex("#4a64b0");
  const sy = sq < 1 ? sq : (1 / sq ** 0.5) * sq, X = (v) => x + v * (2 - sy), Y = (v) => y + v * sy;
  // the shapes: haunch, body, head-mass, front legs; an ink rim first, then the skin
  const shapes = [
    [-30, -12, 17, 13], [-36, -2, 13, 3.5], [0, -27, 40, 25], [10, -40, 30, 16], [26, -6, 8, 7], [33, -1.5, 8, 2.5], [-4, -5, 8, 6],
  ];
  for (const pass of [0, 1]) for (const [a, b, rx, ry] of shapes) p.ellipse(X(a), Y(b), rx + (pass ? 0 : 1.3), ry + (pass ? 0 : 1.3), pass ? BODY : INK);
  // shading and the dark teal mottling over its back, head and legs
  p.shade(X(-48), Y(-58), X(42), Y(0), (px, py) => {
    const lx = (px - x) / (2 - sy), ly = (py - y) / sy;
    let inside = false;
    for (const [a, b, rx, ry] of shapes) if (((lx - a) / rx) ** 2 + ((ly - b) / ry) ** 2 < 0.9) inside = true;
    if (!inside) return;
    const n = noise2(lx * 0.13, ly * 0.16, 31) + 0.6 * noise2(lx * 0.3, ly * 0.3, 32);
    const top = ly < -30 + lx * 0.15, under = ly > -12 && lx > -16;
    if (n > 0.32 && !under) return n > 0.62 ? MARK : MARK2;
    if (under) return lx > 4 ? LITE : SHADE;
    return top ? LITE : ly > -20 ? SHADE : BODY;
  });
  // the spiral marks on its front foot
  p.arc(X(27), Y(-7), 3, 1, 0, 5, DEEP);
  p.arc(X(27), Y(-7), 1.5, 1, 0, 5, DEEP);
  // the eyes on top: dark-lidded, yellow, a bar of a pupil
  for (const ex of [-10, 20]) {
    p.circle(X(ex), Y(-54), 9, INK);
    p.circle(X(ex), Y(-54), 8, MARK);
    p.circle(X(ex), Y(-53.5), 6.5, EYE);
    p.rect(X(ex) - 5, Y(-54), 10, 2.4, INK);
    p.px(X(ex) - 3, Y(-56), WHITE);
    p.line(X(ex) - 8, Y(-58), X(ex) + 8, Y(-61), INK);
  }
  // the wide mouth, the tongue poking out at the corner, open as it spits
  if (open > 0.05) p.poly([[X(0), Y(-33)], [X(40), Y(-34 - 4 * open)], [X(40), Y(-29 + 5 * open)], [X(2), Y(-31)]], hex("#4a0e0c"));
  p.line(X(-2), Y(-33), X(38), Y(-31 - 4 * open), INK);
  if (open < 0.3) {
    p.ellipse(X(34), Y(-29), 4, 2.4, TONGUE);
    p.px(X(33), Y(-30), WHITE);
  }
  // the necklace: blue beads across the chest and the round medallion of loyalty with its glyph
  for (let i = 0; i <= 9; i++) {
    const u = i / 9, bx = X(-8 + u * 40), by = Y(-22 + Math.sin(Math.PI * u) * 9);
    p.circle(bx, by, 2.2, BEAD);
    p.px(bx - 0.6, by - 0.8, BEADL);
  }
  const mx = X(14), my = Y(-12);
  p.circle(mx, my, 7.5, INK);
  p.circle(mx, my, 6.5, MED);
  p.ring(mx, my, 6.5, 1, BEADL);
  // the glyph: a box with a stroke through it over a heart-stroke
  p.rect(mx - 2.5, my - 4, 5, 3, INK, 1);
  p.rect(mx - 1.5, my - 3, 3, 1, MED);
  p.line(mx, my - 5, mx, my, INK);
  p.line(mx - 3.5, my + 3.5, mx - 2, my + 1.5, INK);
  p.line(mx - 1, my + 2, mx + 3, my + 2.5, INK);
  p.px(mx + 3.5, my + 1, INK);
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
      blast(p, t - HIT, { x: TX, y: 0, R: 42, C: FIRE, seed: 3, layer: "back", smoke: SOOT });
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
      // the oil: a gob spat in an arc from the lips, landing at the target's feet; it stops pouring and the tail follows down
      if (t > SPIT && t < POOL0 + 0.2) {
        const head = clamp((t - SPIT) / OILT), tail = clamp((t - SPIT - POUR) / OILT), N = 50;
        for (let i = 0; i < N; i++) {
          const u0 = i / N, u1 = (i + 1) / N;
          if (u1 > head || u0 < tail) continue;
          const [x0, y0] = oilAt(t, u0), [x1, y1] = oilAt(t, u1), w = 4 + 3 * Math.sin(Math.PI * u0) + Math.sin(u0 * 30 - t * 25) * 0.8;
          p.beam(x0, y0, x1, y1, w + 1.2, OIL[0]);
          p.beam(x0, y0, x1, y1, w, OIL[1]);
          p.line(x0, y0 - w * 0.25, x1, y1 - w * 0.25, i % 4 ? OIL[2] : OIL[3]);
        }
      }
      // the pool spreading round the target's feet: dark, glossy, rippling; burning once it catches
      const pool = smooth(POOL0, POOL1, t) * (1 - smooth(HIT + 2, HIT + 2.6, t)), catchK = clamp((t - IGN) / BURN);
      if (pool > 0) {
        const r = POOLR * ease.outCubic(pool);
        p.ellipse(TX, 0.5, r + 1, 3.6, OIL[0]);
        p.ellipse(TX, 0.2, r, 3, OIL[1]);
        p.ellipse(TX - r * 0.3, -0.2, r * 0.45, 1, OIL[3], 0.8);
        if (t < IGN) for (let i = 0; i < 3; i++) {
          const u = ((t - POOL0) * 1.6 + i / 3) % 1;
          p.ellipse(TX + (i - 1) * 8, 0, 3 + u * 6, 0.8 + u, OIL[2], 1 - u);
        }
        // flame racing out over the oil from where the fire lands, then the whole pool burning
        if (catchK > 0) {
          const reach = r * catchK;
          for (let i = 0; i < 14; i++) {
            const x = TX - r + (i / 13) * 2 * r;
            if (Math.abs(x - (TX - r * 0.8)) > reach * 2) continue;
            const h = (6 + 10 * rand(i, 5)) * (0.7 + 0.4 * Math.sin(t * 14 + i));
            p.tri(x - 4, 0, x + 4, 0, x + Math.sin(t * 11 + i) * 2, -h, FIRE[3]);
            p.tri(x - 2, 0, x + 2, 0, x + Math.sin(t * 11 + i) * 1.5, -h * 0.6, FIRE[5]);
          }
          p.glow(TX, -6, 40, FIRE[4], 0.6 * catchK);
        }
      }
      // Jiraiya's breath of fire: a roaring stream from his lips arcing down into the pool
      if (J && t > BREATH && t < IGN + 0.25) {
        const m = [J[0] + MOUTH_J[0], J[1] + MOUTH_J[1]], end = [TX - POOLR * 0.8, -2], L = ease.inQuad(clamp((t - BREATH) / FLY)), tail = clamp((t - IGN - 0.05) / 0.2);
        const at = (u) => [m[0] + (end[0] - m[0]) * u, m[1] + (end[1] - m[1]) * u - Math.sin(Math.PI * u) * 26];
        for (let i = 0; i <= 30; i++) {
          const u = (i / 30) * L;
          if (u < tail) continue;
          const [x, y] = at(u), r = 2.5 + 7 * u * (0.8 + 0.4 * noise2(i * 0.3, t * 10, 5));
          p.disc(x, y, r, (d) => (d < 0.35 ? FIRE[6] : d < 0.65 ? FIRE[5] : FIRE[4]), 1);
        }
        p.glowLine(...at(Math.max(tail, 0.02)), ...at(L), 22, FIRE[4], 0.6);
      }
      // the blast where it meets the target: oil and fire, then burning oil spattered over the ground
      const age = t - HIT;
      blast(p, age, { x: TX, y: 0, R: 42, C: FIRE, seed: 3, smoke: SOOT, rock: [OIL[0], OIL[1], OIL[2], FIRE[3]] });
      if (age >= 0 && age < 0.05) p.circle(TX, -20, 30, FIRE[6]);
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
