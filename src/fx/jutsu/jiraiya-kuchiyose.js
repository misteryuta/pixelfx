// Kuchiyose no Jutsu (Summoning, Jiraiya). Narutopedia: seals Boar, Dog, Bird, Monkey, Ram; the summoner signs a
// contract in blood, so a drop of their own blood is offered and the hand is pressed to the ground, where the formula
// spreads out and the summon arrives in a great cloud of smoke. Jiraiya's is the toad boss Gamabunta: a giant red-brown
// toad with a scarred eye, a pipe and a short blue coat, the summoner standing on his head. Here: the five seals, the
// thumb bitten, the palm slammed down, the black lines of the formula racing out, a vast cloud of smoke, and Gamabunta
// sitting in it with Jiraiya on his head. Then their combination, Katon: Gamayu Endan (Toad Oil Flame Bullet): in canon
// the summon spits a torrent of oil while Jiraiya, on its head, breathes fire into it at the same instant; the oil makes
// the flame far bigger and hotter, one roaring jet of burning oil (they used it against Manda and Orochimaru). Here: the
// toad (after the user's reference: red, mottled with dark teal, yellow eyes, the necklace with the round medallion)
// and Jiraiya both draw breath, Jiraiya on the Tiger seal; then both release: a thick jet of oil from the toad's lips,
// Jiraiya's fire pouring into it right at its root, and the two become one huge flamethrower jet that drives straight
// into the target: a bright core, a turbulent orange body, black oil smoke rolling off its top, burning drops raining
// from its underside; it holds, roaring, then is cut off; the ground burns where the oil fell. The toad goes in a puff.
// New: the toad (drawn here from shapes, with an ink outline), the formula, the summoner riding (drawFigure), the joint
// oil-and-fire jet, the burning drops and ground fires, the blast where it lands (blast() from _lib with sooty smoke).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure, drawPoof, blast, SIGNS } from "./_lib.js";
import { noise2, rand } from "../../core/index.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["i", "inu", "tori", "saru", "hitsuji"], 0.1, { hold: 0.2 });
const BITE = SEALS.end, SLAM = BITE + 0.22, SMOKE = SLAM + 0.3, TOAD = SMOKE + 0.12, INHALE = TOAD + 0.5, SPIT = INHALE + 0.55;
// SPIT: both release; the jet's head reaches the target at HIT; it roars until CUT; its tail runs out by STOP
const BREATH = SPIT, REACH = 0.26, HIT = SPIT + REACH, CUT = HIT + 1.1, STOP = CUT + 0.25, BYE = STOP + 0.45, TX = 250, X0 = 64;
const FIRE = ["#1a0804", "#4a1206", "#9a2a08", "#e0600c", "#ffa020", "#ffe070", "#fffbe0"].map(hex);
const OIL = ["#140a04", "#2e1a08", "#4e3010", "#8a6a30"].map(hex), SOOT = [hex("#141016"), hex("#2a2428"), hex("#4a4246")];

export const meta = {
  name: "Summoning: Gamabunta",
  desc: "Jiraiya: the summoning seals and Gamabunta in a cloud of smoke with Jiraiya on his head; the toad sprays oil as Jiraiya breathes fire into it, one roaring jet of burning oil that engulfs the target and leaves the ground burning.",
  tags: ["jutsu", "jiraiya", "summoning", "toad", "move", "aoe", "one-shot"],
  size: [400, 230],
  origin: [52, 198],
  duration: BYE + 1.6,
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
const ridePose = (t) => (t > INHALE && t < BREATH ? { ...SIGNS.tora.pose, lean: -4, fx: 7, fy: -29, bx: 8, by: -29 } : t >= BREATH && t < STOP ? { ...READY, crouch: 4, lean: 9, fx: 8, fy: -29, bx: 9, by: -28 } : RIDE);
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
    { t: INHALE, target: false, sfx: "cast" },
    { t: SPIT, stop: 0.05, shake: 0.5, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.16, shake: 0.9, amp: 5, push: 5, straw: 40, skin: "char", sfx: "explosion" },
    ...[0.25, 0.5, 0.75, 1.0].map((d) => ({ t: HIT + d, stop: 0.02, shake: 0.4, amp: 2, flash: 0, push: 1, straw: 8, shiver: 0.5, sfx: d === 0.5 ? "rumble" : undefined })),
    { t: CUT + 1.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SLAM, x: 14, n: 6 }, { t: BYE + 0.05, x: X0 - 4, n: 8 }],
};

// where the toad is: sits at X0, leaps in an arc and lands at X1; s: squash (1 normal)
function toadAt(t) {
  // lands in the smoke, settles; draws breath (belly up), heaves forward as it spits
  const land = 0.08 * Math.max(0, 1 - (t - TOAD) * 4), breath = smooth(INHALE, SPIT, t) * (1 - smooth(SPIT, SPIT + 0.15, t)), heave = smooth(SPIT, SPIT + 0.08, t) * (1 - smooth(CUT, STOP, t));
  // a tremor while it pours (the force of the jet)
  const shake = heave * Math.sin(t * 50) * 0.6;
  return { x: X0 + 3 * heave + shake, y: 0, sq: 1 + land - 0.1 * breath + 0.05 * heave, belly: breath, open: heave };
}
// the toad's lips, where the oil leaves
const lipsAt = (t) => {
  const T = toadAt(t), sy = T.sq < 1 ? T.sq : (1 / T.sq ** 0.5) * T.sq;
  return [T.x + 40 * (2 - sy), T.y - 29 * sy];
};
// the jet's axis: from the toad's lips, nearly straight (a high-pressure jet sags only a little), onto the target
const jetAt = (t, u) => {
  const M = lipsAt(t), E = [TX + 6, -22];
  return [M[0] + (E[0] - M[0]) * u, M[1] + (E[1] - M[1]) * u + Math.sin(Math.PI * u) * 4];
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
      blast(p, t - HIT, { x: TX, y: 0, R: 30, C: FIRE, seed: 3, layer: "back", smoke: SOOT });
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
        if (t > INHALE + 0.05 && t < SPIT + 0.3) p.text("KATON: GAMAYU ENDAN", J[0] + 6, J[1] - 52, FIRE[5], { font: "mini", align: "center", outline: hex("#1a0804") });
      }
      // the jet: Gamabunta's oil and Jiraiya's fire released together. Head: how far it has reached (0..1 of the way to
      // the target), tail: where it has run out once they stop.
      if (J && t > SPIT && t < STOP + 0.05) {
        const head = ease.outQuad(clamp((t - SPIT) / REACH)), tail = ease.inQuad(clamp((t - CUT) / (STOP - CUT))), M = lipsAt(t);
        const jm = [J[0] + MOUTH_J[0], J[1] + MOUTH_J[1]], MERGE = 0.16;
        // the oil leaving the lips: a thick dark-amber rope for the first stretch, where the fire meets it
        for (let i = 0; i < 12; i++) {
          const u0 = (i / 12) * MERGE, u1 = ((i + 1) / 12) * MERGE;
          if (u1 > head || u0 < tail) continue;
          const [x0, y0] = jetAt(t, u0), [x1, y1] = jetAt(t, u1);
          p.beam(x0, y0, x1, y1, 5.5, OIL[1]); p.line(x0, y0 - 1.5, x1, y1 - 1.5, OIL[3]);
        }
        // Jiraiya's fire: from his lips down into the oil at the merge point
        if (tail < MERGE) {
          const mp = jetAt(t, MERGE), L = clamp((t - SPIT) / 0.08);
          const ex = jm[0] + (mp[0] - jm[0]) * L, ey = jm[1] + (mp[1] - jm[1]) * L, fl = 1 + 0.25 * Math.sin(t * 40);
          p.glowLine(jm[0], jm[1], ex, ey, 10, FIRE[4], 0.5);
          p.beam(jm[0], jm[1], ex, ey, 5 * fl, FIRE[3]);
          p.beam(jm[0], jm[1], ex, ey, 3.2 * fl, FIRE[5]);
          p.beam(jm[0], jm[1], ex, ey, 1.4, FIRE[6]);
        }
        // the burning jet from the merge point to its head: a cone that widens as it goes, turbulent, a white core,
        // orange body, dark red rim; black oil smoke rolling off its top edge
        const u0 = Math.max(MERGE, tail), u1 = head;
        if (u1 > u0) {
          const P0 = jetAt(t, u0), P1 = jetAt(t, u1), len = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), dx = (P1[0] - P0[0]) / len, dy = (P1[1] - P0[1]) / len;
          const pad = 30;
          p.shade(Math.min(P0[0], P1[0]) - pad, Math.min(P0[1], P1[1]) - pad - 8, Math.max(P0[0], P1[0]) + pad, Math.max(P0[1], P1[1]) + pad, (x, y, out) => {
            const rx = x - M[0], ry = y - M[1], along = rx * dx + ry * dy, across = -rx * dy + ry * dx, full = TX + 6 - M[0];
            const u = along / full;
            if (u < u0 - 0.01 || u > u1 + 0.04) return;
            const w = 5 + 27 * Math.pow(Math.max(0, (u - MERGE) / (1 - MERGE)), 0.8) * (u > u1 ? Math.max(0, 1 - (u - u1) * 25) : 1);
            const n = noise2(along * 0.07 - t * 14, across * 0.12, 21) * 0.35 + noise2(along * 0.2 - t * 22, across * 0.3, 22) * 0.15;
            const d = Math.abs(across) / w + n;
            if (d > 1) {
              // the smoke rolling off the top
              if (across < 0 && d < 1.5 && u > 0.35 && noise2(along * 0.1 - t * 6, across * 0.15 + t * 3, 23) > 0.05) { out.a = 0.7; return d < 1.25 ? SOOT[1] : SOOT[0]; }
              return;
            }
            return d < 0.28 ? FIRE[6] : d < 0.5 ? FIRE[5] : d < 0.72 ? FIRE[4] : d < 0.88 ? FIRE[3] : FIRE[2];
          });
          p.glowLine(P0[0], P0[1], P1[0], P1[1], 26, FIRE[4], 0.45);
          // burning drops of oil raining off its underside
          for (let i = 0; i < 10; i++) {
            const ph = (t * 1.8 + rand(i, 3)) % 1, u = u0 + (u1 - u0) * rand(i, 4), [bx, by] = jetAt(t, u);
            const yy = by + 6 + ph * (-by - 6), k = 1 - ph * 0.3;
            if (yy < 0) { p.px(bx + ph * 6, yy, FIRE[ph > 0.5 ? 3 : 4], k); p.px(bx + ph * 6, yy - 1, OIL[2], k); }
          }
        }
      }
      // fires left burning on the ground where the oil fell, between the toad and the target
      if (t > HIT + 0.2 && t < CUT + 1.6) {
        const k = smooth(HIT + 0.2, HIT + 0.6, t) * (1 - smooth(CUT + 1.0, CUT + 1.6, t));
        for (let i = 0; i < 8; i++) {
          const x = X0 + 70 + i * ((TX - X0 - 50) / 8) + (rand(i, 8) - 0.5) * 8, h = (4 + 7 * rand(i, 9)) * k * (0.8 + 0.3 * Math.sin(t * 12 + i));
          p.ellipse(x, 0, 6, 1.4, OIL[0], k);
          p.tri(x - 3.5, 0, x + 3.5, 0, x + Math.sin(t * 9 + i) * 2, -h, FIRE[3], k);
          p.tri(x - 1.8, 0, x + 1.8, 0, x + Math.sin(t * 9 + i) * 1.5, -h * 0.6, FIRE[5], k);
        }
      }
      // the blast where it meets the target: oil and fire, then burning oil spattered over the ground
      const age = t - HIT;
      blast(p, age, { x: TX, y: 0, R: 30, C: FIRE, seed: 3, smoke: SOOT, rock: [OIL[0], OIL[1], OIL[2], FIRE[3]] });
      if (age >= 0 && age < 0.05) p.circle(TX, -20, 30, FIRE[6]);
      for (let i = 0; i < 5; i++) drawPoof(p, X0 - 30 + i * 15, -20 - (i % 2) * 24, t - SMOKE - i * 0.03, 3.2, i + 1);
      drawPoof(p, X0, -30, t - BYE, 3.4, 9);
      drawPoof(p, X0 + 30, -16, t - BYE - 0.04, 2.4, 10);
      ps.draw(p, "front");
    },
  };
});
